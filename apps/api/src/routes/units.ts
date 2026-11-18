import { zValidator } from "@hono/zod-validator";
import { and, asc, eq, gt, inArray, sql } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { db } from "../db/client.js";
import {
  aparInspections,
  aparUnits,
  hydrantInspections,
  hydrantUnits,
  p3kBoxes,
  p3kInspectionItems,
  p3kInspections,
  photos,
  sites,
  zones,
} from "../db/schema.js";
import { deleteObject } from "../storage.js";
import { companyId, requireSession } from "../auth/middleware.js";
import { blockedByChildren, listPage, newId, notFound } from "./helpers.js";
import {
  aparUnitBodySchema,
  hydrantUnitBodySchema,
  idParamSchema,
  listQuerySchema,
  p3kBoxBodySchema,
  urutanUnitSchema,
} from "./schemas.js";

async function ownSiteZone(
  owned: string,
  siteId: string,
  zoneId?: string,
): Promise<void> {
  const site = await db
    .select()
    .from(sites)
    .where(and(eq(sites.id, siteId), eq(sites.companyId, owned)))
    .limit(1);
  if (site.length === 0) throw notFound("Lokasi");
  if (zoneId) {
    const zone = await db
      .select()
      .from(zones)
      .where(and(eq(zones.id, zoneId), eq(zones.companyId, owned), eq(zones.siteId, siteId)))
      .limit(1);
    if (zone.length === 0) throw notFound("Zona");
  }
}

/** Tabel unit yang punya kolom `sortOrder` (Hydrant dan APAR). */
type TabelUnit = typeof hydrantUnits | typeof aparUnits;

/**
 * Tulis ulang urutan tampil unit satu lokasi.
 *
 * `ids` harus memuat SELURUH unit lokasi itu tepat sekali — bukan sebagian —
 * supaya tidak ada dua unit yang mendapat `sort_order` sama (urutan jadi tak
 * deterministik) dan tidak ada unit yang tertinggal di urutan lama. Daftar yang
 * tidak cocok ditolak 400, bukan diam-diam diterima.
 */
async function simpanUrutanUnit(
  tabel: TabelUnit,
  owned: string,
  siteId: string,
  ids: string[],
): Promise<void> {
  await ownSiteZone(owned, siteId);

  const milikLokasi = await db
    .select({ id: tabel.id })
    .from(tabel)
    .where(and(eq(tabel.companyId, owned), eq(tabel.siteId, siteId)));
  const milik = new Set(milikLokasi.map((r) => r.id));

  const unik = new Set(ids);
  if (unik.size !== ids.length) {
    throw new HTTPException(400, { message: "Daftar urutan memuat unit ganda." });
  }
  if (ids.length !== milik.size || ids.some((id) => !milik.has(id))) {
    throw new HTTPException(400, {
      message: "Daftar urutan harus memuat seluruh unit pada lokasi ini.",
    });
  }

  // Satu transaksi: penulisan sebagian akan meninggalkan urutan bolong.
  await db.transaction(async (tx) => {
    for (const [urutan, id] of ids.entries()) {
      await tx
        .update(tabel)
        .set({ sortOrder: urutan })
        .where(and(eq(tabel.id, id), eq(tabel.companyId, owned)));
    }
  });
}

export const hydrantUnitsApp = new Hono()
  .use("*", requireSession)

  .get("/", zValidator("query", listQuerySchema), async (c) => {
  const { cursor, limit, siteId } = c.req.valid("query");
  const owned = companyId(c);
  const page = await listPage({
    limit,
    fetch: (n) =>
      db
        .select()
        .from(hydrantUnits)
        .where(
          and(
            eq(hydrantUnits.companyId, owned),
            siteId ? eq(hydrantUnits.siteId, siteId) : undefined,
            cursor ? gt(hydrantUnits.id, cursor) : undefined,
          ),
        )
        .orderBy(asc(hydrantUnits.id))
        .limit(n),
  });
  return c.json(page);
  })

  .post("/", zValidator("json", hydrantUnitBodySchema), async (c) => {
  const body = c.req.valid("json");
  const owned = companyId(c);
  await ownSiteZone(owned, body.siteId, body.zoneId);
  // Unit baru masuk ke urutan paling akhir, bukan menimpa urutan unit lain.
  const [terakhir] = await db
    .select({ maks: sql<number>`coalesce(max(${hydrantUnits.sortOrder}), -1)` })
    .from(hydrantUnits)
    .where(and(eq(hydrantUnits.companyId, owned), eq(hydrantUnits.siteId, body.siteId)));
  const [row] = await db
    .insert(hydrantUnits)
    .values({ id: newId(), companyId: owned, sortOrder: Number(terakhir?.maks ?? -1) + 1, ...body })
    .returning();
  return c.json(row, 201);
  })

  .put("/urutan", zValidator("json", urutanUnitSchema), async (c) => {
    const { siteId, ids } = c.req.valid("json");
    await simpanUrutanUnit(hydrantUnits, companyId(c), siteId, ids);
    return c.json({ ok: true });
  })

  .get("/:id", zValidator("param", idParamSchema), async (c) => {
  const { id } = c.req.valid("param");
  const owned = companyId(c);
  const rows = await db
    .select()
    .from(hydrantUnits)
    .where(and(eq(hydrantUnits.id, id), eq(hydrantUnits.companyId, owned)))
    .limit(1);
  if (rows.length === 0) throw notFound("Unit hidran");
  return c.json(rows[0]);
  })

  .patch(
  "/:id",
  zValidator("param", idParamSchema),
  zValidator("json", hydrantUnitBodySchema.partial()),
  async (c) => {
    const { id } = c.req.valid("param");
    const owned = companyId(c);
    const rows = await db
      .select()
      .from(hydrantUnits)
      .where(and(eq(hydrantUnits.id, id), eq(hydrantUnits.companyId, owned)))
      .limit(1);
    if (rows.length === 0) throw notFound("Unit hidran");
    const body = c.req.valid("json");
    const siteId = body.siteId ?? rows[0].siteId;
    if (body.siteId || body.zoneId) await ownSiteZone(owned, siteId, body.zoneId ?? rows[0].zoneId);
    const [row] = await db.update(hydrantUnits).set(body).where(eq(hydrantUnits.id, id)).returning();
    return c.json(row);
  },
  )

  .delete("/:id", zValidator("param", idParamSchema), async (c) => {
  const { id } = c.req.valid("param");
  const owned = companyId(c);
  const rows = await db
    .select()
    .from(hydrantUnits)
    .where(and(eq(hydrantUnits.id, id), eq(hydrantUnits.companyId, owned)))
    .limit(1);
  if (rows.length === 0) throw notFound("Unit hidran");
  const force = c.req.query("force") === "1";
  const kids = await db
    .select({ id: hydrantInspections.id })
    .from(hydrantInspections)
    .where(eq(hydrantInspections.unitId, id))
    .limit(1);
  if (kids.length > 0 && !force) throw blockedByChildren("Unit hidran");
  if (!force) {
    await db.delete(hydrantUnits).where(eq(hydrantUnits.id, id));
    return c.json({ ok: true });
  }
  const semua = await db
    .select({ id: hydrantInspections.id })
    .from(hydrantInspections)
    .where(eq(hydrantInspections.unitId, id));
  const idsInspeksi = semua.map((r) => r.id);
  let kunciFoto: string[] = [];
  if (idsInspeksi.length > 0) {
    const foto = await db
      .select({ s3Key: photos.s3Key })
      .from(photos)
      .where(inArray(photos.hydrantInspectionId, idsInspeksi));
    kunciFoto = foto.map((f) => f.s3Key);
    await db.transaction(async (tx) => {
      await tx.delete(photos).where(inArray(photos.hydrantInspectionId, idsInspeksi));
      await tx.delete(hydrantInspections).where(inArray(hydrantInspections.id, idsInspeksi));
      await tx.delete(hydrantUnits).where(eq(hydrantUnits.id, id));
    });
  } else {
    await db.delete(hydrantUnits).where(eq(hydrantUnits.id, id));
  }
  for (const key of kunciFoto) {
    try {
      await deleteObject(key);
    } catch {
      /* abaikan: baris sudah terhapus */
    }
  }
  return c.json({ ok: true });
});

export const aparUnitsApp = new Hono()
  .use("*", requireSession)

  .get("/", zValidator("query", listQuerySchema), async (c) => {
  const { cursor, limit, siteId } = c.req.valid("query");
  const owned = companyId(c);
  const page = await listPage({
    limit,
    fetch: (n) =>
      db
        .select()
        .from(aparUnits)
        .where(
          and(
            eq(aparUnits.companyId, owned),
            siteId ? eq(aparUnits.siteId, siteId) : undefined,
            cursor ? gt(aparUnits.id, cursor) : undefined,
          ),
        )
        .orderBy(asc(aparUnits.id))
        .limit(n),
  });
  return c.json(page);
  })

  .post("/", zValidator("json", aparUnitBodySchema), async (c) => {
  const body = c.req.valid("json");
  const owned = companyId(c);
  await ownSiteZone(owned, body.siteId, body.zoneId);
  const [terakhir] = await db
    .select({ maks: sql<number>`coalesce(max(${aparUnits.sortOrder}), -1)` })
    .from(aparUnits)
    .where(and(eq(aparUnits.companyId, owned), eq(aparUnits.siteId, body.siteId)));
  const [row] = await db
    .insert(aparUnits)
    .values({ id: newId(), companyId: owned, sortOrder: Number(terakhir?.maks ?? -1) + 1, ...body })
    .returning();
  return c.json(row, 201);
  })

  .put("/urutan", zValidator("json", urutanUnitSchema), async (c) => {
    const { siteId, ids } = c.req.valid("json");
    await simpanUrutanUnit(aparUnits, companyId(c), siteId, ids);
    return c.json({ ok: true });
  })

  .get("/:id", zValidator("param", idParamSchema), async (c) => {
  const { id } = c.req.valid("param");
  const owned = companyId(c);
  const rows = await db
    .select()
    .from(aparUnits)
    .where(and(eq(aparUnits.id, id), eq(aparUnits.companyId, owned)))
    .limit(1);
  if (rows.length === 0) throw notFound("Unit APAR");
  return c.json(rows[0]);
  })

  .patch(
  "/:id",
  zValidator("param", idParamSchema),
  zValidator("json", aparUnitBodySchema.partial()),
  async (c) => {
    const { id } = c.req.valid("param");
    const owned = companyId(c);
    const rows = await db
      .select()
      .from(aparUnits)
      .where(and(eq(aparUnits.id, id), eq(aparUnits.companyId, owned)))
      .limit(1);
    if (rows.length === 0) throw notFound("Unit APAR");
    const body = c.req.valid("json");
    const siteId = body.siteId ?? rows[0].siteId;
    if (body.siteId || body.zoneId) await ownSiteZone(owned, siteId, body.zoneId ?? rows[0].zoneId);
    const [row] = await db.update(aparUnits).set(body).where(eq(aparUnits.id, id)).returning();
    return c.json(row);
  },
  )

  .delete("/:id", zValidator("param", idParamSchema), async (c) => {
  const { id } = c.req.valid("param");
  const owned = companyId(c);
  const rows = await db
    .select()
    .from(aparUnits)
    .where(and(eq(aparUnits.id, id), eq(aparUnits.companyId, owned)))
    .limit(1);
  if (rows.length === 0) throw notFound("Unit APAR");
  const force = c.req.query("force") === "1";
  const kids = await db
    .select({ id: aparInspections.id })
    .from(aparInspections)
    .where(eq(aparInspections.unitId, id))
    .limit(1);
  if (kids.length > 0 && !force) throw blockedByChildren("Unit APAR");
  if (!force) {
    await db.delete(aparUnits).where(eq(aparUnits.id, id));
    return c.json({ ok: true });
  }
  const semua = await db
    .select({ id: aparInspections.id })
    .from(aparInspections)
    .where(eq(aparInspections.unitId, id));
  const idsInspeksi = semua.map((r) => r.id);
  let kunciFoto: string[] = [];
  if (idsInspeksi.length > 0) {
    const foto = await db
      .select({ s3Key: photos.s3Key })
      .from(photos)
      .where(inArray(photos.aparInspectionId, idsInspeksi));
    kunciFoto = foto.map((f) => f.s3Key);
    await db.transaction(async (tx) => {
      await tx.delete(photos).where(inArray(photos.aparInspectionId, idsInspeksi));
      await tx.delete(aparInspections).where(inArray(aparInspections.id, idsInspeksi));
      await tx.delete(aparUnits).where(eq(aparUnits.id, id));
    });
  } else {
    await db.delete(aparUnits).where(eq(aparUnits.id, id));
  }
  for (const key of kunciFoto) {
    try {
      await deleteObject(key);
    } catch {
      /* abaikan: baris sudah terhapus */
    }
  }
  return c.json({ ok: true });
});

export const p3kBoxesApp = new Hono()
  .use("*", requireSession)

  .get("/", zValidator("query", listQuerySchema), async (c) => {
  const { cursor, limit, siteId } = c.req.valid("query");
  const owned = companyId(c);
  const page = await listPage({
    limit,
    fetch: (n) =>
      db
        .select()
        .from(p3kBoxes)
        .where(
          and(
            eq(p3kBoxes.companyId, owned),
            siteId ? eq(p3kBoxes.siteId, siteId) : undefined,
            cursor ? gt(p3kBoxes.id, cursor) : undefined,
          ),
        )
        .orderBy(asc(p3kBoxes.id))
        .limit(n),
  });
  return c.json(page);
  })

  .post("/", zValidator("json", p3kBoxBodySchema), async (c) => {
  const body = c.req.valid("json");
  const owned = companyId(c);
  await ownSiteZone(owned, body.siteId);
  const [row] = await db
    .insert(p3kBoxes)
    .values({ id: newId(), companyId: owned, ...body })
    .returning();
  return c.json(row, 201);
  })

  .get("/:id", zValidator("param", idParamSchema), async (c) => {
  const { id } = c.req.valid("param");
  const owned = companyId(c);
  const rows = await db
    .select()
    .from(p3kBoxes)
    .where(and(eq(p3kBoxes.id, id), eq(p3kBoxes.companyId, owned)))
    .limit(1);
  if (rows.length === 0) throw notFound("Kotak P3K");
  return c.json(rows[0]);
  })

  .patch(
  "/:id",
  zValidator("param", idParamSchema),
  zValidator("json", p3kBoxBodySchema.partial()),
  async (c) => {
    const { id } = c.req.valid("param");
    const owned = companyId(c);
    const rows = await db
      .select()
      .from(p3kBoxes)
      .where(and(eq(p3kBoxes.id, id), eq(p3kBoxes.companyId, owned)))
      .limit(1);
    if (rows.length === 0) throw notFound("Kotak P3K");
    const body = c.req.valid("json");
    if (body.siteId) await ownSiteZone(owned, body.siteId);
    const [row] = await db.update(p3kBoxes).set(body).where(eq(p3kBoxes.id, id)).returning();
    return c.json(row);
  },
  )

  .delete("/:id", zValidator("param", idParamSchema), async (c) => {
  const { id } = c.req.valid("param");
  const owned = companyId(c);
  const rows = await db
    .select()
    .from(p3kBoxes)
    .where(and(eq(p3kBoxes.id, id), eq(p3kBoxes.companyId, owned)))
    .limit(1);
  if (rows.length === 0) throw notFound("Kotak P3K");
  const force = c.req.query("force") === "1";
  const kids = await db
    .select({ id: p3kInspections.id })
    .from(p3kInspections)
    .where(eq(p3kInspections.boxId, id))
    .limit(1);
  if (kids.length > 0 && !force) throw blockedByChildren("Kotak P3K");
  if (!force) {
    await db.delete(p3kBoxes).where(eq(p3kBoxes.id, id));
    return c.json({ ok: true });
  }
  const semua = await db
    .select({ id: p3kInspections.id })
    .from(p3kInspections)
    .where(eq(p3kInspections.boxId, id));
  const idsInspeksi = semua.map((r) => r.id);
  if (idsInspeksi.length > 0) {
    await db.transaction(async (tx) => {
      await tx.delete(p3kInspectionItems).where(inArray(p3kInspectionItems.inspectionId, idsInspeksi));
      await tx.delete(p3kInspections).where(inArray(p3kInspections.id, idsInspeksi));
      await tx.delete(p3kBoxes).where(eq(p3kBoxes.id, id));
    });
  } else {
    await db.delete(p3kBoxes).where(eq(p3kBoxes.id, id));
  }
  return c.json({ ok: true });
});
