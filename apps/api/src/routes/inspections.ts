import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import {
  STANDARD_P3K_ITEMS,
  computeAparOverallStatus,
  computeHydrantOverallStatus,
  firstOfMonth,
  toPeriodKey,
} from "@viaannn/shared";
import { and, asc, eq, gt } from "drizzle-orm";
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
import { blockedByChildren, duplicateMonth, editLocked, listPage, newId, notFound } from "./helpers.js";
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

export const hydrantInspectionsApp = new Hono();
hydrantInspectionsApp.use("*", requireSession);

hydrantInspectionsApp.get("/", zValidator("query", listQuerySchema), async (c) => {
  const { cursor, limit } = c.req.valid("query");
  const owned = companyId(c);
  const page = await listPage({
    limit,
    fetch: (n) =>
      db
        .select()
        .from(hydrantInspections)
        .where(and(eq(hydrantInspections.companyId, owned), cursor ? gt(hydrantInspections.id, cursor) : undefined))
        .orderBy(asc(hydrantInspections.id))
        .limit(n),
  });
  return c.json(page);
});

hydrantInspectionsApp.get("/by-asset", zValidator("query", inspectionQuerySchema), async (c) => {
  const { month, unitId } = c.req.valid("query");
  if (!unitId) return c.json({ items: [] });
  const owned = companyId(c);
  const rows = await db
    .select()
    .from(hydrantInspections)
    .where(and(eq(hydrantInspections.companyId, owned), eq(hydrantInspections.unitId, unitId)))
    .orderBy(asc(hydrantInspections.period));
  const wanted = rows.filter((r) => toPeriodKey(r.period) === month);
  return c.json({ items: wanted });
});

hydrantInspectionsApp.post("/", zValidator("json", hydrantInspectionBodySchema), async (c) => {
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
      notes: body.notes ?? null,
    })
    .returning();
  return c.json(row, 201);
});

hydrantInspectionsApp.get("/:id", zValidator("param", idParamSchema), async (c) => {
  const { id } = c.req.valid("param");
  const owned = companyId(c);
  const rows = await db
    .select()
    .from(hydrantInspections)
    .where(and(eq(hydrantInspections.id, id), eq(hydrantInspections.companyId, owned)))
    .limit(1);
  if (rows.length === 0) throw notFound("Inspeksi hidran");
  return c.json(rows[0]);
});

hydrantInspectionsApp.patch(
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
    if (rows[0].approvalStatus !== "DRAFT") throw editLocked();
    const body = c.req.valid("json");
    const merged = { ...rows[0], ...body };
    const overallStatus =
      (body.overallOverridden ?? rows[0].overallOverridden) && body.overallStatus
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
);

hydrantInspectionsApp.delete("/:id", zValidator("param", idParamSchema), async (c) => {
  const { id } = c.req.valid("param");
  const owned = companyId(c);
  const rows = await db
    .select()
    .from(hydrantInspections)
    .where(and(eq(hydrantInspections.id, id), eq(hydrantInspections.companyId, owned)))
    .limit(1);
  if (rows.length === 0) throw notFound("Inspeksi hidran");
  const attached = await db
    .select({ id: photos.id })
    .from(photos)
    .where(eq(photos.hydrantInspectionId, id))
    .limit(1);
  if (attached.length > 0) throw blockedByChildren("Inspeksi hidran");
  await db.delete(hydrantInspections).where(eq(hydrantInspections.id, id));
  return c.json({ ok: true });
});

export const aparInspectionsApp = new Hono();
aparInspectionsApp.use("*", requireSession);

aparInspectionsApp.get("/", zValidator("query", listQuerySchema), async (c) => {
  const { cursor, limit } = c.req.valid("query");
  const owned = companyId(c);
  const page = await listPage({
    limit,
    fetch: (n) =>
      db
        .select()
        .from(aparInspections)
        .where(and(eq(aparInspections.companyId, owned), cursor ? gt(aparInspections.id, cursor) : undefined))
        .orderBy(asc(aparInspections.id))
        .limit(n),
  });
  return c.json(page);
});

aparInspectionsApp.get("/by-asset", zValidator("query", inspectionQuerySchema), async (c) => {
  const { month, unitId } = c.req.valid("query");
  if (!unitId) return c.json({ items: [] });
  const owned = companyId(c);
  const rows = await db
    .select()
    .from(aparInspections)
    .where(and(eq(aparInspections.companyId, owned), eq(aparInspections.unitId, unitId)))
    .orderBy(asc(aparInspections.period));
  return c.json({ items: rows.filter((r) => toPeriodKey(r.period) === month) });
});

aparInspectionsApp.post("/", zValidator("json", aparInspectionBodySchema), async (c) => {
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
      notes: body.notes ?? null,
    })
    .returning();
  return c.json(row, 201);
});

aparInspectionsApp.get("/:id", zValidator("param", idParamSchema), async (c) => {
  const { id } = c.req.valid("param");
  const owned = companyId(c);
  const rows = await db
    .select()
    .from(aparInspections)
    .where(and(eq(aparInspections.id, id), eq(aparInspections.companyId, owned)))
    .limit(1);
  if (rows.length === 0) throw notFound("Inspeksi APAR");
  return c.json(rows[0]);
});

aparInspectionsApp.patch(
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
    if (rows[0].approvalStatus !== "DRAFT") throw editLocked();
    const body = c.req.valid("json");
    const merged = { ...rows[0], ...body };
    const overallStatus =
      (body.overallOverridden ?? rows[0].overallOverridden) && body.overallStatus
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
);

aparInspectionsApp.delete("/:id", zValidator("param", idParamSchema), async (c) => {
  const { id } = c.req.valid("param");
  const owned = companyId(c);
  const rows = await db
    .select()
    .from(aparInspections)
    .where(and(eq(aparInspections.id, id), eq(aparInspections.companyId, owned)))
    .limit(1);
  if (rows.length === 0) throw notFound("Inspeksi APAR");
  const attached = await db
    .select({ id: photos.id })
    .from(photos)
    .where(eq(photos.aparInspectionId, id))
    .limit(1);
  if (attached.length > 0) throw blockedByChildren("Inspeksi APAR");
  await db.delete(aparInspections).where(eq(aparInspections.id, id));
  return c.json({ ok: true });
});

export const p3kInspectionsApp = new Hono();
p3kInspectionsApp.use("*", requireSession);

p3kInspectionsApp.get("/", zValidator("query", listQuerySchema), async (c) => {
  const { cursor, limit } = c.req.valid("query");
  const owned = companyId(c);
  const page = await listPage({
    limit,
    fetch: (n) =>
      db
        .select()
        .from(p3kInspections)
        .where(and(eq(p3kInspections.companyId, owned), cursor ? gt(p3kInspections.id, cursor) : undefined))
        .orderBy(asc(p3kInspections.id))
        .limit(n),
  });
  return c.json(page);
});

p3kInspectionsApp.get("/by-asset", zValidator("query", inspectionQuerySchema), async (c) => {
  const { month, boxId } = c.req.valid("query");
  if (!boxId) return c.json({ items: [] });
  const owned = companyId(c);
  const rows = await db
    .select()
    .from(p3kInspections)
    .where(and(eq(p3kInspections.companyId, owned), eq(p3kInspections.boxId, boxId)))
    .orderBy(asc(p3kInspections.period));
  return c.json({ items: rows.filter((r) => toPeriodKey(r.period) === month) });
});

p3kInspectionsApp.post("/", zValidator("json", p3kInspectionBodySchema), async (c) => {
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
    .values({ id: newId(), companyId: owned, boxId: body.boxId, period, notes: body.notes ?? null })
    .returning();
  await db.insert(p3kInspectionItems).values(
    STANDARD_P3K_ITEMS.map((item) => ({
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
});

p3kInspectionsApp.get("/:id", zValidator("param", idParamSchema), async (c) => {
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
});

p3kInspectionsApp.patch(
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
    if (rows[0].approvalStatus !== "DRAFT") throw editLocked();
    const body = c.req.valid("json");
    const [row] = await db.update(p3kInspections).set(body).where(eq(p3kInspections.id, id)).returning();
    return c.json(row);
  },
);

p3kInspectionsApp.delete("/:id", zValidator("param", idParamSchema), async (c) => {
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
});

p3kInspectionsApp.patch(
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
    if (head[0].approvalStatus !== "DRAFT") throw editLocked();
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
