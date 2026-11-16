import { zValidator } from "@hono/zod-validator";
import { firstOfMonth, toPeriodKey } from "@viaannn/shared";
import { and, asc, eq, lte } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/client.js";
import {
  aparInspections,
  aparUnits,
  hydrantInspections,
  p3kInspections,
  safetyPatrolReports,
  settings,
} from "../db/schema.js";
import { companyId, requireSession } from "../auth/middleware.js";
import { notFound } from "./helpers.js";
import { monthQuery, settingsPatchSchema } from "./schemas.js";
import { z } from "zod";

const daysQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).optional(),
});

export const feedApp = new Hono()
  .use("*", requireSession)

  .get("/", zValidator("query", monthQuery), async (c) => {
  const { month } = c.req.valid("query");
  const owned = companyId(c);
  const periodStart = toPeriodKey(firstOfMonth(month));
  const [hydrant, apar, p3k, patrol] = await Promise.all([
    db.select().from(hydrantInspections).where(eq(hydrantInspections.companyId, owned)).orderBy(asc(hydrantInspections.period)),
    db.select().from(aparInspections).where(eq(aparInspections.companyId, owned)).orderBy(asc(aparInspections.period)),
    db.select().from(p3kInspections).where(eq(p3kInspections.companyId, owned)).orderBy(asc(p3kInspections.period)),
    db.select().from(safetyPatrolReports).where(eq(safetyPatrolReports.companyId, owned)).orderBy(asc(safetyPatrolReports.patrolDate)),
  ]);
  const patrolFiltered = patrol
    .filter((r) => toPeriodKey(r.patrolDate) === periodStart)
    .map((r) => ({ ...r, category: "patroli" as const }));
  return c.json({
    month,
    hydrant: hydrant.filter((r) => toPeriodKey(r.period) === periodStart).map((r) => ({ ...r, category: "hydrant" as const })),
    apar: apar.filter((r) => toPeriodKey(r.period) === periodStart).map((r) => ({ ...r, category: "apar" as const })),
    p3k: p3k.filter((r) => toPeriodKey(r.period) === periodStart).map((r) => ({ ...r, category: "p3k" as const })),
    patrol: patrolFiltered,
    patroli: patrolFiltered,
  });
});

export const dashboardApp = new Hono()
  .use("*", requireSession)

  .get("/expiring-apar", zValidator("query", daysQuerySchema), async (c) => {
  const { days } = c.req.valid("query");
  const owned = companyId(c);
  let window = days;
  if (window === undefined) {
    const rows = await db
      .select()
      .from(settings)
      .where(eq(settings.key, "apar_expiry_alert_days"))
      .limit(1);
    window = rows.length > 0 ? Number(rows[0].value) : 30;
  }
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + window);
  const cutoffIso = cutoff.toISOString().slice(0, 10);
  const rows = await db
    .select()
    .from(aparUnits)
    .where(and(eq(aparUnits.companyId, owned), lte(aparUnits.expiredDate, cutoffIso)))
    .orderBy(asc(aparUnits.expiredDate));
  return c.json({ days: window, items: rows });
});

export const settingsApp = new Hono()
  .use("*", requireSession)

  .get("/apar-expiry-alert-days", async (c) => {
  const rows = await db
    .select()
    .from(settings)
    .where(eq(settings.key, "apar_expiry_alert_days"))
    .limit(1);
  if (rows.length === 0) throw notFound("Pengaturan");
  return c.json(rows[0]);
  })

  .patch("/apar-expiry-alert-days", zValidator("json", settingsPatchSchema), async (c) => {
  const body = c.req.valid("json");
  const rows = await db
    .select()
    .from(settings)
    .where(eq(settings.key, "apar_expiry_alert_days"))
    .limit(1);
  if (rows.length === 0) throw notFound("Pengaturan");
  const [row] = await db
    .update(settings)
    .set({ value: body.value })
    .where(eq(settings.key, "apar_expiry_alert_days"))
    .returning();
  return c.json(row);
});
