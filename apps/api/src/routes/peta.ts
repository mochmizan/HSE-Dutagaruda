import { createHash } from "node:crypto";
import { zValidator } from "@hono/zod-validator";
import { and, asc, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { companyId, requireSession } from "../auth/middleware.js";
import { db } from "../db/client.js";
import { projectMaps } from "../db/schema.js";
import { newId, notFound } from "./helpers.js";
import { idParamSchema } from "./schemas.js";
import { deleteObject, presignedGet, putBytes } from "../storage.js";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 10 * 1024 * 1024;
const MAKS_PETA = 20;

/** `nama` opsional; sisanya berkas multipart yang dibaca lewat `parseBody()`. */
const petaFormSchema = z.object({
  nama: z.string().max(120).optional(),
});

const petaPatchSchema = z.object({
  nama: z
    .string()
    .trim()
    .min(1, "Nama peta wajib diisi.")
    .max(120, "Nama peta maksimal 120 karakter."),
});

/** Bentuk baris yang dikirim ke klien (tanpa `s3Key`/`sha256` internal). */
const kolomPeta = {
  id: projectMaps.id,
  nama: projectMaps.nama,
  mime: projectMaps.mime,
  bytes: projectMaps.bytes,
  urutan: projectMaps.urutan,
  dipilih: projectMaps.dipilih,
  createdAt: projectMaps.createdAt,
};

/** Nama bawaan dari nama berkas tanpa ekstensi; kosong -> "Peta 1". */
function namaDariBerkas(namaBerkas: string): string {
  const tanpaEkstensi = namaBerkas.replace(/\.[^./\\]+$/, "").trim();
  return tanpaEkstensi === "" ? "Peta 1" : tanpaEkstensi.slice(0, 120);
}

export const petaApp = new Hono()
  .use("*", requireSession)

  .get("/", async (c) => {
    const owned = companyId(c);
    const items = await db
      .select(kolomPeta)
      .from(projectMaps)
      .where(eq(projectMaps.companyId, owned))
      .orderBy(asc(projectMaps.urutan), asc(projectMaps.createdAt));
    return c.json({ items });
  })

  .post("/", zValidator("form", petaFormSchema), async (c) => {
    const { nama } = c.req.valid("form");
    const owned = companyId(c);

    const jumlah = await db
      .select({ id: projectMaps.id })
      .from(projectMaps)
      .where(eq(projectMaps.companyId, owned));
    if (jumlah.length >= MAKS_PETA) {
      throw new HTTPException(400, { message: "Maksimal 20 peta per proyek." });
    }

    const body = await c.req.parseBody();
    const file = body.file;
    if (!(file instanceof File)) {
      throw new HTTPException(400, { message: "Berkas peta wajib diunggah." });
    }
    if (!ALLOWED_MIME.has(file.type)) {
      throw new HTTPException(400, { message: "Jenis berkas harus JPEG, PNG, atau WebP." });
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (bytes.length === 0 || bytes.length > MAX_BYTES) {
      throw new HTTPException(400, { message: "Ukuran peta maksimal 10 MB." });
    }

    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const mapId = newId();
    const key = `peta/${owned}/${mapId}.${ext}`;
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    await putBytes(key, bytes, file.type);

    const terakhir = await db
      .select({ urutan: projectMaps.urutan })
      .from(projectMaps)
      .where(eq(projectMaps.companyId, owned))
      .orderBy(desc(projectMaps.urutan))
      .limit(1);
    const urutan = (terakhir[0]?.urutan ?? 0) + 1;

    const [row] = await db
      .insert(projectMaps)
      .values({
        id: mapId,
        companyId: owned,
        s3Key: key,
        nama: (nama ?? namaDariBerkas(file.name)).trim().slice(0, 120) || "Peta 1",
        mime: file.type,
        bytes: bytes.length,
        sha256,
        urutan,
        // Peta pertama proyek langsung terpilih, sisanya menunggu PUT .../dipilih.
        dipilih: jumlah.length === 0,
      })
      .returning(kolomPeta);
    return c.json(row, 201);
  })

  .get("/:id/berkas", zValidator("param", idParamSchema), async (c) => {
    const { id } = c.req.valid("param");
    const owned = companyId(c);
    const rows = await db
      .select({ s3Key: projectMaps.s3Key })
      .from(projectMaps)
      .where(and(eq(projectMaps.id, id), eq(projectMaps.companyId, owned)))
      .limit(1);
    if (rows.length === 0) throw notFound("Peta");
    return c.redirect(await presignedGet(rows[0].s3Key, 60), 302);
  })

  .put("/:id/dipilih", zValidator("param", idParamSchema), async (c) => {
    const { id } = c.req.valid("param");
    const owned = companyId(c);
    const rows = await db
      .select({ id: projectMaps.id })
      .from(projectMaps)
      .where(and(eq(projectMaps.id, id), eq(projectMaps.companyId, owned)))
      .limit(1);
    if (rows.length === 0) throw notFound("Peta");
    // Satu transaksi: kosongkan dulu semua pilihan proyek, baru pilih yang ini,
    // supaya partial unique index `project_maps_satu_dipilih` tidak dilanggar.
    await db.transaction(async (tx) => {
      await tx
        .update(projectMaps)
        .set({ dipilih: false })
        .where(and(eq(projectMaps.companyId, owned), eq(projectMaps.dipilih, true)));
      await tx
        .update(projectMaps)
        .set({ dipilih: true })
        .where(and(eq(projectMaps.id, id), eq(projectMaps.companyId, owned)));
    });
    return c.json({ ok: true });
  })

  .patch("/:id", zValidator("param", idParamSchema), zValidator("json", petaPatchSchema), async (c) => {
    const { id } = c.req.valid("param");
    const { nama } = c.req.valid("json");
    const owned = companyId(c);
    const [row] = await db
      .update(projectMaps)
      .set({ nama })
      .where(and(eq(projectMaps.id, id), eq(projectMaps.companyId, owned)))
      .returning(kolomPeta);
    if (!row) throw notFound("Peta");
    return c.json(row);
  })

  .delete("/:id", zValidator("param", idParamSchema), async (c) => {
    const { id } = c.req.valid("param");
    const owned = companyId(c);
    const rows = await db
      .select({ s3Key: projectMaps.s3Key, dipilih: projectMaps.dipilih })
      .from(projectMaps)
      .where(and(eq(projectMaps.id, id), eq(projectMaps.companyId, owned)))
      .limit(1);
    if (rows.length === 0) throw notFound("Peta");
    await deleteObject(rows[0].s3Key);
    await db.delete(projectMaps).where(eq(projectMaps.id, id));
    if (rows[0].dipilih) {
      // Peta terpilih dihapus: promosikan sisa terbaru supaya proyek tetap punya
      // satu peta yang ditampilkan.
      const [berikut] = await db
        .select({ id: projectMaps.id })
        .from(projectMaps)
        .where(eq(projectMaps.companyId, owned))
        .orderBy(desc(projectMaps.urutan), desc(projectMaps.createdAt))
        .limit(1);
      if (berikut) {
        await db
          .update(projectMaps)
          .set({ dipilih: true })
          .where(and(eq(projectMaps.id, berikut.id), eq(projectMaps.companyId, owned)));
      }
    }
    return c.json({ ok: true });
  });
