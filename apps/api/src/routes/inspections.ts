import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import {
  computeAparOverallStatus,
  computeHydrantOverallStatus,
  detectP3kBoxType,
  firstOfMonth,
  getStandardP3kItemsForType,
} from "@viaannn/shared";
import { and, asc, eq, getTableColumns, gt, gte, inArray, lt } from "drizzle-orm";
import { Hono } from "hono";
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
} from "../db/schema.js";
import { companyId, requireSession } from "../auth/middleware.js";
import { deleteObject } from "../storage.js";
import {
  blockedByChildren,
  duplicateMonth,
  listPage,
  newId,
  notFound,
  periodRange,
} from "./helpers.js";
import {
  aparInspectionBodySchema,
  hydrantInspectionBodySchema,
  idParamSchema,
  inspectionQuerySchema,
  listQuerySchema,
  p3kInspectionBodySchema,
  p3kItemPatchSchema,
} from "./schemas.js";

const itemParamSchema = idParamSchema.extend({ itemId: z.string().min(1) });

const MEDAN_KOMPONEN_HIDRAN = [
  "boxHydrant",
  "fireHose",
  "hoseCoupling",
  "hoseRack",
  "nozzle",
  "valvePillar",
] as const;
const MEDAN_KOMPONEN_APAR = [
  "safetyPin",
  "corong",
  "segel",
  "tekanan",
  "tabung",
  "selang",
  "katupTuas",
] as const;

export const hydrantInspectionsApp = new Hono()
  .use("*", requireSession)

  .get("/", zValidator("query", listQuerySchema), async (c) => {
  const { cursor, limit, siteId, period } = c.req.valid("query");
  const owned = companyId(c);
  const rentang = period ? periodRange(period) : null;
  const page = await listPage({
    limit,
    fetch: (n) =>
      db
        .select(getTableColumns(hydrantInspections))
        .from(hydrantInspections)
        .innerJoin(hydrantUnits, eq(hydrantInspections.unitId, hydrantUnits.id))
        .where(
          and(
            eq(hydrantInspections.companyId, owned),
            siteId ? eq(hydrantUnits.siteId, siteId) : undefined,
            rentang ? gte(hydrantInspections.period, rentang.from) : undefined,
            rentang ? lt(hydrantInspections.period, rentang.to) : undefined,
            cursor ? gt(hydrantInspections.id, cursor) : undefined,
          ),
        )
        .orderBy(asc(hydrantInspections.id))
        .limit(n),
  });
  return c.json(page);
  })

  .get("/by-asset", zValidator("query", inspectionQuerySchema), async (c) => {
  const { month, unitId } = c.req.valid("query");
  if (!unitId) return c.json({ items: [] });
  const owned = companyId(c);
  const rentang = periodRange(month);
  const rows = await db
    .select()
    .from(hydrantInspections)
    .where(
      and(
        eq(hydrantInspections.companyId, owned),
        eq(hydrantInspections.unitId, unitId),
        gte(hydrantInspections.period, rentang.from),
        lt(hydrantInspections.period, rentang.to),
      ),
    )
    .orderBy(asc(hydrantInspections.period));
  return c.json({ items: rows });
  })

  .post("/", zValidator("json", hydrantInspectionBodySchema), async (c) => {
  const body = c.req.valid("json");
  const owned = companyId(c);
  const unit = await db
    .select()
    .from(hydrantUnits)
    .where(and(eq(hydrantUnits.id, body.unitId), eq(hydrantUnits.companyId, owned)))
    .limit(1);
  if (unit.length === 0) throw notFound("Unit hidran");
  const period = firstOfMonth(body.month);
  const dup = await db
    .select({ id: hydrantInspections.id })
    .from(hydrantInspections)
    .where(and(eq(hydrantInspections.unitId, body.unitId), eq(hydrantInspections.period, period)))
    .limit(1);
  if (dup.length > 0) throw duplicateMonth();
  const overallStatus =
    body.overallOverridden && body.overallStatus
      ? body.overallStatus
      : computeHydrantOverallStatus(body);
  const [row] = await db
    .insert(hydrantInspections)
    .values({
      id: newId(),
      companyId: owned,
      unitId: body.unitId,
      period,
      boxHydrant: body.boxHydrant,
      fireHose: body.fireHose,
      hoseCoupling: body.hoseCoupling,
      hoseRack: body.hoseRack,
      nozzle: body.nozzle,
      valvePillar: body.valvePillar,
      overallStatus,
      overallOverridden: body.overallOverridden ?? false,
      approvalStatus: body.approvalStatus ?? "DRAFT",
      notes: body.notes ?? null,
    })
    .returning();
  return c.json(row, 201);
  })

  .get("/:id", zValidator("param", idParamSchema), async (c) => {
  const { id } = c.req.valid("param");
  const owned = companyId(c);
  const rows = await db
    .select()
    .from(hydrantInspections)
    .where(and(eq(hydrantInspections.id, id), eq(hydrantInspections.companyId, owned)))
    .limit(1);
  if (rows.length === 0) throw notFound("Inspeksi hidran");
  return c.json(rows[0]);
  })

  .patch(
  "/:id",
  zValidator("param", idParamSchema),
  zValidator("json", hydrantInspectionBodySchema.partial().omit({ unitId: true, month: true })),
  async (c) => {
    const { id } = c.req.valid("param");
    const owned = companyId(c);
    const rows = await db
      .select()
      .from(hydrantInspections)
      .where(and(eq(hydrantInspections.id, id), eq(hydrantInspections.companyId, owned)))
      .limit(1);
    if (rows.length === 0) throw notFound("Inspeksi hidran");
    const body = c.req.valid("json");
    const merged = { ...rows[0], ...body };
    const sentuhPenilaian =
      body.overallStatus !== undefined ||
      body.overallOverridden !== undefined ||
      MEDAN_KOMPONEN_HIDRAN.some((k) => body[k] !== undefined);
    const overallStatus = !sentuhPenilaian
      ? rows[0].overallStatus
      : (body.overallOverridden ?? rows[0].overallOverridden) && body.overallStatus
        ? body.overallStatus
        : computeHydrantOverallStatus({
            boxHydrant: merged.boxHydrant,
            fireHose: merged.fireHose,
            hoseCoupling: merged.hoseCoupling,
            hoseRack: merged.hoseRack,
            nozzle: merged.nozzle,
            valvePillar: merged.valvePillar,
          });
    const [row] = await db
      .update(hydrantInspections)
      .set({ ...body, overallStatus })
      .where(eq(hydrantInspections.id, id))
      .returning();
    return c.json(row);
  },
  )

  .delete("/:id", zValidator("param", idParamSchema), async (c) => {
  const { id } = c.req.valid("param");
  const owned = companyId(c);
  const rows = await db
    .select()
    .from(hydrantInspections)
    .where(and(eq(hydrantInspections.id, id), eq(hydrantInspections.companyId, owned)))
    .limit(1);
  if (rows.length === 0) throw notFound("Inspeksi hidran");
  const force = c.req.query("force") === "1";
  const attached = await db
    .select({ id: photos.id })
    .from(photos)
    .where(eq(photos.hydrantInspectionId, id))
    .limit(1);
  if (attached.length > 0 && !force) throw blockedByChildren("Inspeksi hidran");
  if (!force) {
    await db.delete(hydrantInspections).where(eq(hydrantInspections.id, id));
    return c.json({ ok: true });
  }
  const foto = await db
    .select({ s3Key: photos.s3Key })
    .from(photos)
    .where(eq(photos.hydrantInspectionId, id));
  await db.transaction(async (tx) => {
    await tx.delete(photos).where(eq(photos.hydrantInspectionId, id));
    await tx.delete(hydrantInspections).where(eq(hydrantInspections.id, id));
  });
  for (const f of foto) {
    try {
      await deleteObject(f.s3Key);
    } catch {
      /* abaikan: baris sudah terhapus */
    }
  }
  return c.json({ ok: true });
});

export const aparInspectionsApp = new Hono()
  .use("*", requireSession)

  .get("/", zValidator("query", listQuerySchema), async (c) => {
  const { cursor, limit, siteId, period } = c.req.valid("query");
  const owned = companyId(c);
  const rentang = period ? periodRange(period) : null;
  const page = await listPage({
    limit,
    fetch: (n) =>
      db
        .select(getTableColumns(aparInspections))
        .from(aparInspections)
        .innerJoin(aparUnits, eq(aparInspections.unitId, aparUnits.id))
        .where(
          and(
            eq(aparInspections.companyId, owned),
            siteId ? eq(aparUnits.siteId, siteId) : undefined,
            rentang ? gte(aparInspections.period, rentang.from) : undefined,
            rentang ? lt(aparInspections.period, rentang.to) : undefined,
            cursor ? gt(aparInspections.id, cursor) : undefined,
          ),
        )
        .orderBy(asc(aparInspections.id))
        .limit(n),
  });
  return c.json(page);
  })

  .get("/by-asset", zValidator("query", inspectionQuerySchema), async (c) => {
  const { month, unitId } = c.req.valid("query");
  if (!unitId) return c.json({ items: [] });
  const owned = companyId(c);
  const rentang = periodRange(month);
  const rows = await db
    .select()
    .from(aparInspections)
    .where(
      and(
        eq(aparInspections.companyId, owned),
        eq(aparInspections.unitId, unitId),
        gte(aparInspections.period, rentang.from),
        lt(aparInspections.period, rentang.to),
      ),
    )
    .orderBy(asc(aparInspections.period));
  return c.json({ items: rows });
  })

  .post("/", zValidator("json", aparInspectionBodySchema), async (c) => {
  const body = c.req.valid("json");
  const owned = companyId(c);
  const unit = await db
    .select()
    .from(aparUnits)
    .where(and(eq(aparUnits.id, body.unitId), eq(aparUnits.companyId, owned)))
    .limit(1);
  if (unit.length === 0) throw notFound("Unit APAR");
  const period = firstOfMonth(body.month);
  const dup = await db
    .select({ id: aparInspections.id })
    .from(aparInspections)
    .where(and(eq(aparInspections.unitId, body.unitId), eq(aparInspections.period, period)))
    .limit(1);
  if (dup.length > 0) throw duplicateMonth();
  const overallStatus =
    body.overallOverridden && body.overallStatus
      ? body.overallStatus
      : computeAparOverallStatus(body);
  const [row] = await db
    .insert(aparInspections)
    .values({
      id: newId(),
      companyId: owned,
      unitId: body.unitId,
      period,
      safetyPin: body.safetyPin,
      corong: body.corong,
      segel: body.segel,
      tekanan: body.tekanan,
      tabung: body.tabung,
      selang: body.selang,
      katupTuas: body.katupTuas,
      beratCo2Kg: body.beratCo2Kg ?? null,
      overallStatus,
      overallOverridden: body.overallOverridden ?? false,
      approvalStatus: body.approvalStatus ?? "DRAFT",
      notes: body.notes ?? null,
    })
    .returning();
  return c.json(row, 201);
  })

  .get("/:id", zValidator("param", idParamSchema), async (c) => {
  const { id } = c.req.valid("param");
  const owned = companyId(c);
  const rows = await db
    .select()
    .from(aparInspections)
    .where(and(eq(aparInspections.id, id), eq(aparInspections.companyId, owned)))
    .limit(1);
  if (rows.length === 0) throw notFound("Inspeksi APAR");
  return c.json(rows[0]);
  })

  .patch(
  "/:id",
  zValidator("param", idParamSchema),
  zValidator("json", aparInspectionBodySchema.partial().omit({ unitId: true, month: true })),
  async (c) => {
    const { id } = c.req.valid("param");
    const owned = companyId(c);
    const rows = await db
      .select()
      .from(aparInspections)
      .where(and(eq(aparInspections.id, id), eq(aparInspections.companyId, owned)))
      .limit(1);
    if (rows.length === 0) throw notFound("Inspeksi APAR");
    const body = c.req.valid("json");
    const merged = { ...rows[0], ...body };
    const sentuhPenilaian =
      body.overallStatus !== undefined ||
      body.overallOverridden !== undefined ||
      MEDAN_KOMPONEN_APAR.some((k) => body[k] !== undefined);
    const overallStatus = !sentuhPenilaian
      ? rows[0].overallStatus
      : (body.overallOverridden ?? rows[0].overallOverridden) && body.overallStatus
        ? body.overallStatus
        : computeAparOverallStatus({
            safetyPin: merged.safetyPin,
            corong: merged.corong,
            segel: merged.segel,
            tekanan: merged.tekanan,
            tabung: merged.tabung,
            selang: merged.selang,
            katupTuas: merged.katupTuas,
          });
    const [row] = await db
      .update(aparInspections)
      .set({ ...body, overallStatus })
      .where(eq(aparInspections.id, id))
      .returning();
    return c.json(row);
  },
  )

  .delete("/:id", zValidator("param", idParamSchema), async (c) => {
  const { id } = c.req.valid("param");
  const owned = companyId(c);
  const rows = await db
    .select()
    .from(aparInspections)
    .where(and(eq(aparInspections.id, id), eq(aparInspections.companyId, owned)))
    .limit(1);
  if (rows.length === 0) throw notFound("Inspeksi APAR");
  const force = c.req.query("force") === "1";
  const attached = await db
    .select({ id: photos.id })
    .from(photos)
    .where(eq(photos.aparInspectionId, id))
    .limit(1);
  if (attached.length > 0 && !force) throw blockedByChildren("Inspeksi APAR");
  if (!force) {
    await db.delete(aparInspections).where(eq(aparInspections.id, id));
    return c.json({ ok: true });
  }
  const foto = await db
    .select({ s3Key: photos.s3Key })
    .from(photos)
    .where(eq(photos.aparInspectionId, id));
  await db.transaction(async (tx) => {
    await tx.delete(photos).where(eq(photos.aparInspectionId, id));
    await tx.delete(aparInspections).where(eq(aparInspections.id, id));
  });
  for (const f of foto) {
    try {
      await deleteObject(f.s3Key);
    } catch {
      /* abaikan: baris sudah terhapus */
    }
  }
  return c.json({ ok: true });
});

export const p3kInspectionsApp = new Hono()
  .use("*", requireSession)

  .get("/", zValidator("query", listQuerySchema), async (c) => {
  const { cursor, limit, siteId, period } = c.req.valid("query");
  const owned = companyId(c);
  const rentang = period ? periodRange(period) : null;
  const page = await listPage({
    limit,
    fetch: (n) =>
      db
        .select(getTableColumns(p3kInspections))
        .from(p3kInspections)
        .innerJoin(p3kBoxes, eq(p3kInspections.boxId, p3kBoxes.id))
        .where(
          and(
            eq(p3kInspections.companyId, owned),
            siteId ? eq(p3kBoxes.siteId, siteId) : undefined,
            rentang ? gte(p3kInspections.period, rentang.from) : undefined,
            rentang ? lt(p3kInspections.period, rentang.to) : undefined,
            cursor ? gt(p3kInspections.id, cursor) : undefined,
          ),
        )
        .orderBy(asc(p3kInspections.id))
        .limit(n),
  });
  return c.json(page);
  })

  .get("/by-asset", zValidator("query", inspectionQuerySchema), async (c) => {
  const { month, boxId } = c.req.valid("query");
  if (!boxId) return c.json({ items: [] });
  const owned = companyId(c);
  const rentang = periodRange(month);
  const rows = await db
    .select()
    .from(p3kInspections)
    .where(
      and(
        eq(p3kInspections.companyId, owned),
        eq(p3kInspections.boxId, boxId),
        gte(p3kInspections.period, rentang.from),
        lt(p3kInspections.period, rentang.to),
      ),
    )
    .orderBy(asc(p3kInspections.period));
  if (rows.length === 0) return c.json({ items: [] });
  const semuaButir = await db
    .select()
    .from(p3kInspectionItems)
    .where(
      inArray(
        p3kInspectionItems.inspectionId,
        rows.map((r) => r.id),
      ),
    );
  const perInspeksi = new Map<string, typeof semuaButir>();
  for (const b of semuaButir) {
    const daftar = perInspeksi.get(b.inspectionId);
    if (daftar) daftar.push(b);
    else perInspeksi.set(b.inspectionId, [b]);
  }
  return c.json({ items: rows.map((r) => ({ ...r, items: perInspeksi.get(r.id) ?? [] })) });
  })

  .post("/", zValidator("json", p3kInspectionBodySchema), async (c) => {
  const body = c.req.valid("json");
  const owned = companyId(c);
  const box = await db
    .select()
    .from(p3kBoxes)
    .where(and(eq(p3kBoxes.id, body.boxId), eq(p3kBoxes.companyId, owned)))
    .limit(1);
  if (box.length === 0) throw notFound("Kotak P3K");
  const period = firstOfMonth(body.month);
  const dup = await db
    .select({ id: p3kInspections.id })
    .from(p3kInspections)
    .where(and(eq(p3kInspections.boxId, body.boxId), eq(p3kInspections.period, period)))
    .limit(1);
  if (dup.length > 0) throw duplicateMonth();
  const [row] = await db
    .insert(p3kInspections)
    .values({
      id: newId(),
      companyId: owned,
      boxId: body.boxId,
      period,
      notes: body.notes ?? null,
      inspectionDate: body.inspectionDate ?? null,
      paraf: body.paraf?.trim() ? body.paraf.trim() : null,
    })
    .returning();
  const boxType = detectP3kBoxType(box[0].name);
  const typedItems = getStandardP3kItemsForType(boxType);
  await db.insert(p3kInspectionItems).values(
    typedItems.map((item) => ({
      id: newId(),
      companyId: owned,
      inspectionId: row.id,
      itemName: item.name,
      standardQty: item.standardQty,
      actualQty: item.standardQty,
      status: "STANDAR" as const,
    })),
  );
  const items = await db
    .select()
    .from(p3kInspectionItems)
    .where(eq(p3kInspectionItems.inspectionId, row.id));
  return c.json({ ...row, items }, 201);
  })

  .get("/:id", zValidator("param", idParamSchema), async (c) => {
  const { id } = c.req.valid("param");
  const owned = companyId(c);
  const rows = await db
    .select()
    .from(p3kInspections)
    .where(and(eq(p3kInspections.id, id), eq(p3kInspections.companyId, owned)))
    .limit(1);
  if (rows.length === 0) throw notFound("Inspeksi P3K");
  const items = await db
    .select()
    .from(p3kInspectionItems)
    .where(eq(p3kInspectionItems.inspectionId, id));
  return c.json({ ...rows[0], items });
  })

  .patch(
  "/:id",
  zValidator("param", idParamSchema),
  zValidator("json", p3kInspectionBodySchema.partial().omit({ boxId: true, month: true })),
  async (c) => {
    const { id } = c.req.valid("param");
    const owned = companyId(c);
    const rows = await db
      .select()
      .from(p3kInspections)
      .where(and(eq(p3kInspections.id, id), eq(p3kInspections.companyId, owned)))
      .limit(1);
    if (rows.length === 0) throw notFound("Inspeksi P3K");
    const body = c.req.valid("json");
    const [row] = await db.update(p3kInspections).set(body).where(eq(p3kInspections.id, id)).returning();
    return c.json(row);
  },
  )

  .delete("/:id", zValidator("param", idParamSchema), async (c) => {
  const { id } = c.req.valid("param");
  const owned = companyId(c);
  const rows = await db
    .select()
    .from(p3kInspections)
    .where(and(eq(p3kInspections.id, id), eq(p3kInspections.companyId, owned)))
    .limit(1);
  if (rows.length === 0) throw notFound("Inspeksi P3K");
  await db.delete(p3kInspectionItems).where(eq(p3kInspectionItems.inspectionId, id));
  await db.delete(p3kInspections).where(eq(p3kInspections.id, id));
  return c.json({ ok: true });
  })

  .patch(
  "/:id/items/:itemId",
  zValidator("param", itemParamSchema),
  zValidator("json", p3kItemPatchSchema),
  async (c) => {
    const { id, itemId } = c.req.valid("param");
    const owned = companyId(c);
    const head = await db
      .select()
      .from(p3kInspections)
      .where(and(eq(p3kInspections.id, id), eq(p3kInspections.companyId, owned)))
      .limit(1);
    if (head.length === 0) throw notFound("Inspeksi P3K");
    const rows = await db
      .select()
      .from(p3kInspectionItems)
      .where(and(eq(p3kInspectionItems.id, itemId), eq(p3kInspectionItems.inspectionId, id)))
      .limit(1);
    if (rows.length === 0) throw notFound("Butir P3K");
    const body = c.req.valid("json");
    const [row] = await db
      .update(p3kInspectionItems)
      .set(body)
      .where(eq(p3kInspectionItems.id, itemId))
      .returning();
    return c.json(row);
  },
);
