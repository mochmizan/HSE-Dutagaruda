import { zValidator } from "@hono/zod-validator";
import { and, asc, eq, gt } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/client.js";
import {
  aparInspections,
  aparUnits,
  hydrantInspections,
  hydrantUnits,
  p3kBoxes,
  p3kInspections,
  sites,
  zones,
} from "../db/schema.js";
import { companyId, requireSession } from "../auth/middleware.js";
import { blockedByChildren, listPage, newId, notFound } from "./helpers.js";
import {
  aparUnitBodySchema,
  hydrantUnitBodySchema,
  idParamSchema,
  listQuerySchema,
  p3kBoxBodySchema,
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

export const hydrantUnitsApp = new Hono();
hydrantUnitsApp.use("*", requireSession);

hydrantUnitsApp.get("/", zValidator("query", listQuerySchema), async (c) => {
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
});

hydrantUnitsApp.post("/", zValidator("json", hydrantUnitBodySchema), async (c) => {
  const body = c.req.valid("json");
  const owned = companyId(c);
  await ownSiteZone(owned, body.siteId, body.zoneId);
  const [row] = await db
    .insert(hydrantUnits)
    .values({ id: newId(), companyId: owned, ...body })
    .returning();
  return c.json(row, 201);
});

hydrantUnitsApp.get("/:id", zValidator("param", idParamSchema), async (c) => {
  const { id } = c.req.valid("param");
  const owned = companyId(c);
  const rows = await db
    .select()
    .from(hydrantUnits)
    .where(and(eq(hydrantUnits.id, id), eq(hydrantUnits.companyId, owned)))
    .limit(1);
  if (rows.length === 0) throw notFound("Unit hidran");
  return c.json(rows[0]);
});

hydrantUnitsApp.patch(
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
);

hydrantUnitsApp.delete("/:id", zValidator("param", idParamSchema), async (c) => {
  const { id } = c.req.valid("param");
  const owned = companyId(c);
  const rows = await db
    .select()
    .from(hydrantUnits)
    .where(and(eq(hydrantUnits.id, id), eq(hydrantUnits.companyId, owned)))
    .limit(1);
  if (rows.length === 0) throw notFound("Unit hidran");
  const kids = await db
    .select({ id: hydrantInspections.id })
    .from(hydrantInspections)
    .where(eq(hydrantInspections.unitId, id))
    .limit(1);
  if (kids.length > 0) throw blockedByChildren("Unit hidran");
  await db.delete(hydrantUnits).where(eq(hydrantUnits.id, id));
  return c.json({ ok: true });
});

export const aparUnitsApp = new Hono();
aparUnitsApp.use("*", requireSession);

aparUnitsApp.get("/", zValidator("query", listQuerySchema), async (c) => {
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
});

aparUnitsApp.post("/", zValidator("json", aparUnitBodySchema), async (c) => {
  const body = c.req.valid("json");
  const owned = companyId(c);
  await ownSiteZone(owned, body.siteId, body.zoneId);
  const [row] = await db
    .insert(aparUnits)
    .values({ id: newId(), companyId: owned, ...body })
    .returning();
  return c.json(row, 201);
});

aparUnitsApp.get("/:id", zValidator("param", idParamSchema), async (c) => {
  const { id } = c.req.valid("param");
  const owned = companyId(c);
  const rows = await db
    .select()
    .from(aparUnits)
    .where(and(eq(aparUnits.id, id), eq(aparUnits.companyId, owned)))
    .limit(1);
  if (rows.length === 0) throw notFound("Unit APAR");
  return c.json(rows[0]);
});

aparUnitsApp.patch(
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
);

aparUnitsApp.delete("/:id", zValidator("param", idParamSchema), async (c) => {
  const { id } = c.req.valid("param");
  const owned = companyId(c);
  const rows = await db
    .select()
    .from(aparUnits)
    .where(and(eq(aparUnits.id, id), eq(aparUnits.companyId, owned)))
    .limit(1);
  if (rows.length === 0) throw notFound("Unit APAR");
  const kids = await db
    .select({ id: aparInspections.id })
    .from(aparInspections)
    .where(eq(aparInspections.unitId, id))
    .limit(1);
  if (kids.length > 0) throw blockedByChildren("Unit APAR");
  await db.delete(aparUnits).where(eq(aparUnits.id, id));
  return c.json({ ok: true });
});

export const p3kBoxesApp = new Hono();
p3kBoxesApp.use("*", requireSession);

p3kBoxesApp.get("/", zValidator("query", listQuerySchema), async (c) => {
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
});

p3kBoxesApp.post("/", zValidator("json", p3kBoxBodySchema), async (c) => {
  const body = c.req.valid("json");
  const owned = companyId(c);
  await ownSiteZone(owned, body.siteId);
  const [row] = await db
    .insert(p3kBoxes)
    .values({ id: newId(), companyId: owned, ...body })
    .returning();
  return c.json(row, 201);
});

p3kBoxesApp.get("/:id", zValidator("param", idParamSchema), async (c) => {
  const { id } = c.req.valid("param");
  const owned = companyId(c);
  const rows = await db
    .select()
    .from(p3kBoxes)
    .where(and(eq(p3kBoxes.id, id), eq(p3kBoxes.companyId, owned)))
    .limit(1);
  if (rows.length === 0) throw notFound("Kotak P3K");
  return c.json(rows[0]);
});

p3kBoxesApp.patch(
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
);

p3kBoxesApp.delete("/:id", zValidator("param", idParamSchema), async (c) => {
  const { id } = c.req.valid("param");
  const owned = companyId(c);
  const rows = await db
    .select()
    .from(p3kBoxes)
    .where(and(eq(p3kBoxes.id, id), eq(p3kBoxes.companyId, owned)))
    .limit(1);
  if (rows.length === 0) throw notFound("Kotak P3K");
  const kids = await db
    .select({ id: p3kInspections.id })
    .from(p3kInspections)
    .where(eq(p3kInspections.boxId, id))
    .limit(1);
  if (kids.length > 0) throw blockedByChildren("Kotak P3K");
  await db.delete(p3kBoxes).where(eq(p3kBoxes.id, id));
  return c.json({ ok: true });
});
