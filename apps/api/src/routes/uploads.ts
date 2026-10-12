import { createHash } from "node:crypto";
import { zValidator } from "@hono/zod-validator";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { companyId, requireSession } from "../auth/middleware.js";
import { db } from "../db/client.js";
import { aparInspections, hydrantInspections, photos } from "../db/schema.js";
import { newId, notFound } from "./helpers.js";
import { idParamSchema } from "./schemas.js";
import { presignedGet, putBytes, deleteObject } from "../storage.js";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 8 * 1024 * 1024;

const uploadFormSchema = z.object({
  inspectionKind: z.enum(["hydrant", "apar"]),
  inspectionId: z.string().min(1),
  caption: z.string().max(500).optional(),
});

export const uploadsApp = new Hono()
  .use("*", requireSession)

  .post("/", zValidator("form", uploadFormSchema), async (c) => {
  const { inspectionKind, inspectionId, caption } = c.req.valid("form");
  const owned = companyId(c);
  const table = inspectionKind === "hydrant" ? hydrantInspections : aparInspections;
  const head = await db
    .select({ id: table.id })
    .from(table)
    .where(and(eq(table.id, inspectionId), eq(table.companyId, owned)))
    .limit(1);
  if (head.length === 0) throw notFound("Inspeksi");

  const body = await c.req.parseBody();
  const file = body.file;
  if (!(file instanceof File)) {
    throw new HTTPException(400, { message: "Berkas foto wajib diunggah." });
  }
  if (!ALLOWED_MIME.has(file.type)) {
    throw new HTTPException(400, { message: "Jenis berkas harus JPEG, PNG, atau WebP." });
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.length === 0 || bytes.length > MAX_BYTES) {
    throw new HTTPException(400, { message: "Ukuran foto maksimal 8 MB." });
  }
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const photoId = newId();
  const key = `foto/${owned}/${photoId}.${ext}`;
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  await putBytes(key, bytes, file.type);
  const [row] = await db
    .insert(photos)
    .values({
      id: photoId,
      companyId: owned,
      s3Key: key,
      mime: file.type,
      bytes: bytes.length,
      sha256,
      caption: caption ?? null,
      hydrantInspectionId: inspectionKind === "hydrant" ? inspectionId : null,
      aparInspectionId: inspectionKind === "apar" ? inspectionId : null,
    })
    .returning();
  return c.json({ id: row.id, key: row.s3Key }, 201);
});

export const photosApp = new Hono()
  .use("*", requireSession)

  .get("/:id", zValidator("param", idParamSchema), async (c) => {
  const { id } = c.req.valid("param");
  const owned = companyId(c);
  const rows = await db
    .select()
    .from(photos)
    .where(and(eq(photos.id, id), eq(photos.companyId, owned)))
    .limit(1);
  if (rows.length === 0) throw notFound("Foto");
  const url = await presignedGet(rows[0].s3Key, 60);
  return c.redirect(url, 302);
  })

  .delete("/:id", zValidator("param", idParamSchema), async (c) => {
  const { id } = c.req.valid("param");
  const owned = companyId(c);
  const rows = await db
    .select({ s3Key: photos.s3Key })
    .from(photos)
    .where(and(eq(photos.id, id), eq(photos.companyId, owned)))
    .limit(1);
  if (rows.length === 0) throw notFound("Foto");
  await deleteObject(rows[0].s3Key);
  await db.delete(photos).where(eq(photos.id, id));
  return c.json({ ok: true });
});
