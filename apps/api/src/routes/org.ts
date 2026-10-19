import { zValidator } from "@hono/zod-validator";
import { and, asc, eq, gt } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/client.js";
import { member, organization } from "../db/auth-schema.js";
import {
  aparUnits,
  companies,
  hydrantUnits,
  sites,
  zones,
} from "../db/schema.js";
import { companyId, requireSession } from "../auth/middleware.js";
import { blockedByChildren, listPage, newId, notFound } from "./helpers.js";
import {
  companyBodySchema,
  idParamSchema,
  listQuerySchema,
  siteBodySchema,
  zoneBodySchema,
} from "./schemas.js";

export const companiesApp = new Hono()
  .use("*", requireSession)

  .get("/", zValidator("query", listQuerySchema), async (c) => {
  const { cursor, limit } = c.req.valid("query");
  const page = await listPage({
    limit,
    fetch: (n) =>
      db
        .select()
        .from(companies)
        .where(cursor ? gt(companies.id, cursor) : undefined)
        .orderBy(asc(companies.id))
        .limit(n),
  });
  return c.json(page);
  })

  .post("/", zValidator("json", companyBodySchema), async (c) => {
  const body = c.req.valid("json");
  const [row] = await db
    .insert(companies)
    .values({ id: newId(), name: body.name })
    .returning();
  return c.json(row, 201);
  })

  .get("/:id", zValidator("param", idParamSchema), async (c) => {
  const { id } = c.req.valid("param");
  const rows = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
  if (rows.length === 0) throw notFound("Perusahaan");
  return c.json(rows[0]);
  })

  .patch(
  "/:id",
  zValidator("param", idParamSchema),
  zValidator("json", companyBodySchema.partial()),
  async (c) => {
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const rows = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
    if (rows.length === 0) throw notFound("Perusahaan");
    const [row] = await db.update(companies).set(body).where(eq(companies.id, id)).returning();
    return c.json(row);
  },
  )

  .delete("/:id", zValidator("param", idParamSchema), async (c) => {
  const { id } = c.req.valid("param");
  const rows = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
  if (rows.length === 0) throw notFound("Perusahaan");
  const kids = await db
    .select({ id: sites.id })
    .from(sites)
    .where(eq(sites.companyId, id))
    .limit(1);
  if (kids.length > 0) throw blockedByChildren("Perusahaan");
  await db.delete(companies).where(eq(companies.id, id));
  return c.json({ ok: true });
});

export const clientsApp = new Hono()
  .use("*", requireSession)
  .route("/", companiesApp);

/** Slug unik organisasi dari nama (kolom slug wajib unik). */
function slugProyek(nama: string): string {
  const dasar =
    nama
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "proyek";
  return `${dasar}-${newId().slice(0, 8).toLowerCase()}`;
}

function pemintaId(c: { get(key: string): { id: string } }): string {
  return (c.get("user") as { id: string }).id;
}

async function wajibAnggota(organizationId: string, userId: string): Promise<void> {
  const shots = await db
    .select({ id: member.id })
    .from(member)
    .where(and(eq(member.organizationId, organizationId), eq(member.userId, userId)))
    .limit(1);
  if (shots.length === 0) throw notFound("Proyek");
}

/**
 * Proyek = organisasi Better Auth + baris cermin companies (satu id).
 * Cermin wajib ada: sites.companyId FK ke companies.id, tanpanya
 * proyek baru tak bisa punya lokasi.
 */
export const projectsApp = new Hono()
  .use("*", requireSession)

  .post("/", zValidator("json", companyBodySchema), async (c) => {
    const body = c.req.valid("json");
    const nama = body.name.trim();
    const id = newId();
    await db.insert(organization).values({
      id,
      name: nama,
      slug: slugProyek(nama),
      createdAt: new Date(),
    });
    await db.insert(companies).values({ id, name: nama });
    await db.insert(member).values({
      id: newId(),
      organizationId: id,
      userId: pemintaId(c),
      role: "owner",
      createdAt: new Date(),
    });
    return c.json({ id, name: nama }, 201);
  })

  .patch(
    "/:id",
    zValidator("param", idParamSchema),
    zValidator("json", companyBodySchema.partial()),
    async (c) => {
      const { id } = c.req.valid("param");
      await wajibAnggota(id, pemintaId(c));
      const body = c.req.valid("json");
      if (body.name !== undefined) {
        const nama = body.name.trim();
        await db.update(organization).set({ name: nama }).where(eq(organization.id, id));
        await db.update(companies).set({ name: nama }).where(eq(companies.id, id));
      }
      const rows = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
      if (rows.length === 0) throw notFound("Proyek");
      return c.json(rows[0]);
    },
  )

  .delete("/:id", zValidator("param", idParamSchema), async (c) => {
    const { id } = c.req.valid("param");
    await wajibAnggota(id, pemintaId(c));
    const kids = await db
      .select({ id: sites.id })
      .from(sites)
      .where(eq(sites.companyId, id))
      .limit(1);
    if (kids.length > 0) throw blockedByChildren("Proyek");
    // Cascade FK menghapus member + invitation; cermin companies dihapus eksplisit.
    await db.delete(organization).where(eq(organization.id, id));
    await db.delete(companies).where(eq(companies.id, id));
    return c.json({ ok: true });
  });

export const sitesApp = new Hono()
  .use("*", requireSession)

  .get("/", zValidator("query", listQuerySchema), async (c) => {
  const { cursor, limit, clientId } = c.req.valid("query");
  const owned = companyId(c);
  const scope = clientId ?? owned;
  if (scope !== owned) throw notFound("Lokasi");
  const page = await listPage({
    limit,
    fetch: (n) =>
      db
        .select()
        .from(sites)
        .where(and(eq(sites.companyId, scope), cursor ? gt(sites.id, cursor) : undefined))
        .orderBy(asc(sites.id))
        .limit(n),
  });
  return c.json(page);
  })

  .post("/", zValidator("json", siteBodySchema), async (c) => {
  const body = c.req.valid("json");
  const owned = companyId(c);
  const target = body.companyId ?? owned;
  if (target !== owned) throw notFound("Perusahaan");
  const [row] = await db
    .insert(sites)
    .values({ id: newId(), companyId: target, name: body.name, address: body.address ?? null })
    .returning();
  return c.json(row, 201);
  })

  .get("/:id", zValidator("param", idParamSchema), async (c) => {
  const { id } = c.req.valid("param");
  const owned = companyId(c);
  const rows = await db
    .select()
    .from(sites)
    .where(and(eq(sites.id, id), eq(sites.companyId, owned)))
    .limit(1);
  if (rows.length === 0) throw notFound("Lokasi");
  return c.json(rows[0]);
  })

  .patch(
  "/:id",
  zValidator("param", idParamSchema),
  zValidator("json", siteBodySchema.partial()),
  async (c) => {
    const { id } = c.req.valid("param");
    const owned = companyId(c);
    const rows = await db
      .select()
      .from(sites)
      .where(and(eq(sites.id, id), eq(sites.companyId, owned)))
      .limit(1);
    if (rows.length === 0) throw notFound("Lokasi");
    const body = c.req.valid("json");
    if (body.companyId && body.companyId !== owned) throw notFound("Perusahaan");
    const [row] = await db
      .update(sites)
      .set({ name: body.name, address: body.address })
      .where(eq(sites.id, id))
      .returning();
    return c.json(row);
  },
  )

  .delete("/:id", zValidator("param", idParamSchema), async (c) => {
  const { id } = c.req.valid("param");
  const owned = companyId(c);
  const rows = await db
    .select()
    .from(sites)
    .where(and(eq(sites.id, id), eq(sites.companyId, owned)))
    .limit(1);
  if (rows.length === 0) throw notFound("Lokasi");
  const kids = await db.select({ id: zones.id }).from(zones).where(eq(zones.siteId, id)).limit(1);
  if (kids.length > 0) throw blockedByChildren("Lokasi");
  await db.delete(sites).where(eq(sites.id, id));
  return c.json({ ok: true });
});

export const zonesApp = new Hono()
  .use("*", requireSession)

  .get("/", zValidator("query", listQuerySchema), async (c) => {
  const { cursor, limit, siteId } = c.req.valid("query");
  const owned = companyId(c);
  const page = await listPage({
    limit,
    fetch: (n) =>
      db
        .select()
        .from(zones)
        .where(
          and(
            eq(zones.companyId, owned),
            siteId ? eq(zones.siteId, siteId) : undefined,
            cursor ? gt(zones.id, cursor) : undefined,
          ),
        )
        .orderBy(asc(zones.id))
        .limit(n),
  });
  return c.json(page);
  })

  .post("/", zValidator("json", zoneBodySchema), async (c) => {
  const body = c.req.valid("json");
  const owned = companyId(c);
  const site = await db
    .select()
    .from(sites)
    .where(and(eq(sites.id, body.siteId), eq(sites.companyId, owned)))
    .limit(1);
  if (site.length === 0) throw notFound("Lokasi");
  const [row] = await db
    .insert(zones)
    .values({ id: newId(), companyId: owned, siteId: body.siteId, name: body.name })
    .returning();
  return c.json(row, 201);
  })

  .get("/:id", zValidator("param", idParamSchema), async (c) => {
  const { id } = c.req.valid("param");
  const owned = companyId(c);
  const rows = await db
    .select()
    .from(zones)
    .where(and(eq(zones.id, id), eq(zones.companyId, owned)))
    .limit(1);
  if (rows.length === 0) throw notFound("Zona");
  return c.json(rows[0]);
  })

  .patch(
  "/:id",
  zValidator("param", idParamSchema),
  zValidator("json", zoneBodySchema.partial()),
  async (c) => {
    const { id } = c.req.valid("param");
    const owned = companyId(c);
    const rows = await db
      .select()
      .from(zones)
      .where(and(eq(zones.id, id), eq(zones.companyId, owned)))
      .limit(1);
    if (rows.length === 0) throw notFound("Zona");
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
      .update(zones)
      .set({ name: body.name, siteId: body.siteId })
      .where(eq(zones.id, id))
      .returning();
    return c.json(row);
  },
  )

  .delete("/:id", zValidator("param", idParamSchema), async (c) => {
  const { id } = c.req.valid("param");
  const owned = companyId(c);
  const rows = await db
    .select()
    .from(zones)
    .where(and(eq(zones.id, id), eq(zones.companyId, owned)))
    .limit(1);
  if (rows.length === 0) throw notFound("Zona");
  const hKids = await db
    .select({ id: hydrantUnits.id })
    .from(hydrantUnits)
    .where(eq(hydrantUnits.zoneId, id))
    .limit(1);
  const aKids = await db
    .select({ id: aparUnits.id })
    .from(aparUnits)
    .where(eq(aparUnits.zoneId, id))
    .limit(1);
  if (hKids.length > 0 || aKids.length > 0) throw blockedByChildren("Zona");
  await db.delete(zones).where(eq(zones.id, id));
  return c.json({ ok: true });
});
