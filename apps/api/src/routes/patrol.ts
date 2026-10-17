import { createHash } from "node:crypto";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { and, asc, eq, gt } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { db } from "../db/client.js";
import {
  safetyPatrolFindings,
  safetyPatrolReports,
  sites,
} from "../db/schema.js";
import { companyId, requireSession } from "../auth/middleware.js";
import { listPage, newId, notFound } from "./helpers.js";
import { deleteObject, presignedGet, putBytes } from "../storage.js";
import {
  idParamSchema,
  listQuerySchema,
  patrolFindingBodySchema,
  patrolReportBodySchema,
} from "./schemas.js";

const findingParamSchema = idParamSchema.extend({ fid: z.string().min(1) });

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 8 * 1024 * 1024;

const findingPhotoFormSchema = z.object({
  description: z.string().min(1, "Uraian temuan wajib diisi."),
  locationNote: z.string().optional(),
});

export const patrolApp = new Hono()
  .use("*", requireSession)

  .get("/", zValidator("query", listQuerySchema), async (c) => {
  const { cursor, limit, siteId } = c.req.valid("query");
  const owned = companyId(c);
  const page = await listPage({
    limit,
    fetch: (n) =>
      db
        .select()
        .from(safetyPatrolReports)
        .where(
          and(
            eq(safetyPatrolReports.companyId, owned),
            siteId ? eq(safetyPatrolReports.siteId, siteId) : undefined,
            cursor ? gt(safetyPatrolReports.id, cursor) : undefined,
          ),
        )
        .orderBy(asc(safetyPatrolReports.id))
        .limit(n),
  });
  return c.json(page);
  })

  .post("/", zValidator("json", patrolReportBodySchema), async (c) => {
  const body = c.req.valid("json");
  const owned = companyId(c);
  const user = c.get("user");
  const site = await db
    .select()
    .from(sites)
    .where(and(eq(sites.id, body.siteId), eq(sites.companyId, owned)))
    .limit(1);
  if (site.length === 0) throw notFound("Lokasi");
  const [row] = await db
    .insert(safetyPatrolReports)
    .values({
      id: newId(),
      companyId: owned,
      siteId: body.siteId,
      patrolDate: body.patrolDate,
      inspectorUserId: user.id,
    })
    .returning();
  return c.json(row, 201);
  })

  .get("/:id", zValidator("param", idParamSchema), async (c) => {
  const { id } = c.req.valid("param");
  const owned = companyId(c);
  const rows = await db
    .select()
    .from(safetyPatrolReports)
    .where(and(eq(safetyPatrolReports.id, id), eq(safetyPatrolReports.companyId, owned)))
    .limit(1);
  if (rows.length === 0) throw notFound("Laporan patroli");
  const findings = await db
    .select()
    .from(safetyPatrolFindings)
    .where(eq(safetyPatrolFindings.reportId, id));
  return c.json({ ...rows[0], findings });
  })

  .patch(
  "/:id",
  zValidator("param", idParamSchema),
  zValidator("json", patrolReportBodySchema.partial()),
  async (c) => {
    const { id } = c.req.valid("param");
    const owned = companyId(c);
    const rows = await db
      .select()
      .from(safetyPatrolReports)
      .where(and(eq(safetyPatrolReports.id, id), eq(safetyPatrolReports.companyId, owned)))
      .limit(1);
    if (rows.length === 0) throw notFound("Laporan patroli");
    const body = c.req.valid("json");
    if (body.siteId) {
      const site = await db
        .select()
        .from(sites)
        .where(and(eq(sites.id, body.siteId), eq(sites.companyId, owned)))
        .limit(1);
      if (site.length === 0) throw notFound("Lokasi");
    }
    const [row] = await db
      .update(safetyPatrolReports)
      .set(body)
      .where(eq(safetyPatrolReports.id, id))
      .returning();
    return c.json(row);
  },
  )

  .delete("/:id", zValidator("param", idParamSchema), async (c) => {
  const { id } = c.req.valid("param");
  const owned = companyId(c);
  const rows = await db
    .select()
    .from(safetyPatrolReports)
    .where(and(eq(safetyPatrolReports.id, id), eq(safetyPatrolReports.companyId, owned)))
    .limit(1);
  if (rows.length === 0) throw notFound("Laporan patroli");
  const olds = await db
    .select({ s3Key: safetyPatrolFindings.s3Key })
    .from(safetyPatrolFindings)
    .where(eq(safetyPatrolFindings.reportId, id));
  await db.delete(safetyPatrolFindings).where(eq(safetyPatrolFindings.reportId, id));
  await db.delete(safetyPatrolReports).where(eq(safetyPatrolReports.id, id));
  for (const o of olds) {
    try {
      await deleteObject(o.s3Key);
    } catch {
      /* abaikan: baris sudah terhapus */
    }
  }
  return c.json({ ok: true });
  })

  .get("/:id/findings", zValidator("param", idParamSchema), async (c) => {
  const { id } = c.req.valid("param");
  const owned = companyId(c);
  const head = await db
    .select()
    .from(safetyPatrolReports)
    .where(and(eq(safetyPatrolReports.id, id), eq(safetyPatrolReports.companyId, owned)))
    .limit(1);
  if (head.length === 0) throw notFound("Laporan patroli");
  const rows = await db
    .select()
    .from(safetyPatrolFindings)
    .where(eq(safetyPatrolFindings.reportId, id));
  return c.json({ items: rows });
  })

  .post(
  "/:id/findings",
  zValidator("param", idParamSchema),
  zValidator("json", patrolFindingBodySchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const owned = companyId(c);
    const head = await db
      .select()
      .from(safetyPatrolReports)
      .where(and(eq(safetyPatrolReports.id, id), eq(safetyPatrolReports.companyId, owned)))
      .limit(1);
    if (head.length === 0) throw notFound("Laporan patroli");
    const body = c.req.valid("json");
    const [row] = await db
      .insert(safetyPatrolFindings)
      .values({ id: newId(), companyId: owned, reportId: id, ...body })
      .returning();
    return c.json(row, 201);
  },
  )

  .post(
  "/:id/findings/photo",
  zValidator("param", idParamSchema),
  zValidator("form", findingPhotoFormSchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const owned = companyId(c);
    const head = await db
      .select()
      .from(safetyPatrolReports)
      .where(and(eq(safetyPatrolReports.id, id), eq(safetyPatrolReports.companyId, owned)))
      .limit(1);
    if (head.length === 0) throw notFound("Laporan patroli");
    const form = c.req.valid("form");
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
    const findingId = newId();
    const key = `foto/${owned}/${findingId}.${ext}`;
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    await putBytes(key, bytes, file.type);
    const [row] = await db
      .insert(safetyPatrolFindings)
      .values({
        id: findingId,
        companyId: owned,
        reportId: id,
        description: form.description,
        s3Key: key,
        mime: file.type,
        bytes: bytes.length,
        sha256,
        locationNote: form.locationNote ?? null,
      })
      .returning();
    return c.json(row, 201);
  },
  )

  .get("/findings/:fid/photo", zValidator("param", findingParamSchema.pick({ fid: true })), async (c) => {
  const { fid } = c.req.valid("param");
  const owned = companyId(c);
  const rows = await db
    .select()
    .from(safetyPatrolFindings)
    .where(and(eq(safetyPatrolFindings.id, fid), eq(safetyPatrolFindings.companyId, owned)))
    .limit(1);
  if (rows.length === 0) throw notFound("Temuan patroli");
  const url = await presignedGet(rows[0].s3Key, 60);
  return c.redirect(url, 302);
  })

  .delete("/findings/:fid", zValidator("param", findingParamSchema.pick({ fid: true })), async (c) => {
  const { fid } = c.req.valid("param");
  const owned = companyId(c);
  const rows = await db
    .select()
    .from(safetyPatrolFindings)
    .where(and(eq(safetyPatrolFindings.id, fid), eq(safetyPatrolFindings.companyId, owned)))
    .limit(1);
  if (rows.length === 0) throw notFound("Temuan patroli");
  await db.delete(safetyPatrolFindings).where(eq(safetyPatrolFindings.id, fid));
  try {
    await deleteObject(rows[0].s3Key);
  } catch {
    /* abaikan: baris sudah terhapus */
  }
  return c.json({ ok: true });
});
