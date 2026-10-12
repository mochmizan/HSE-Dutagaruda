import { zValidator } from "@hono/zod-validator";
import { STANDARD_P3K_ITEMS, toPeriodKey } from "@viaannn/shared";
import { and, asc, eq, gte, inArray, lte } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { companyId, requireSession } from "../auth/middleware.js";
import { db } from "../db/client.js";
import {
  aparInspections,
  aparUnits,
  hydrantInspections,
  hydrantUnits,
  p3kBoxes,
  p3kInspectionItems,
  p3kInspections,
  pdfJobs,
  photos,
  safetyPatrolFindings,
  safetyPatrolReports,
  sites,
  zones,
} from "../db/schema.js";
import { renderPdf } from "../pdf/render.js";
import {
  aparCard,
  aparMonthly,
  hydrantMonthly,
  patrolReport,
  p3kYearly,
  type AparCardData,
  type AparMonthlyData,
  type HydrantMonthlyData,
  type PatrolReportData,
  type P3kYearlyData,
} from "../pdf/templates.js";
import { objectExists, presignedGet, putBytes } from "../storage.js";
import { newId, notFound } from "./helpers.js";

const exportParamSchema = z.object({
  category: z.enum(["hydrant-monthly", "apar-monthly", "apar-card", "p3k-yearly", "patrol-report"]),
  refId: z.string().min(1),
});
export type ExportCategory = z.infer<typeof exportParamSchema>["category"];

async function presignedPhotoRows(s3Keys: { s3Key: string; caption: string | null }[]) {
  const out: { src: string | null; caption: string }[] = [];
  for (const p of s3Keys) {
    const src = (await objectExists(p.s3Key)) ? await presignedGet(p.s3Key) : null;
    out.push({ src, caption: p.caption ?? "Foto temuan" });
  }
  return out;
}

async function loadHydrantMonthly(refId: string, owned: string): Promise<HydrantMonthlyData> {
  const anchor = await db
    .select({ period: hydrantInspections.period, siteId: hydrantUnits.siteId, siteName: sites.name })
    .from(hydrantInspections)
    .innerJoin(hydrantUnits, eq(hydrantInspections.unitId, hydrantUnits.id))
    .innerJoin(sites, eq(hydrantUnits.siteId, sites.id))
    .where(and(eq(hydrantInspections.id, refId), eq(hydrantInspections.companyId, owned)))
    .limit(1);
  if (anchor.length === 0) throw notFound("Inspeksi hidran");
  const a = anchor[0];
  const rows = await db
    .select({
      inspectionId: hydrantInspections.id,
      kode: hydrantUnits.kode,
      zoneName: zones.name,
      boxHydrant: hydrantInspections.boxHydrant,
      fireHose: hydrantInspections.fireHose,
      hoseCoupling: hydrantInspections.hoseCoupling,
      hoseRack: hydrantInspections.hoseRack,
      nozzle: hydrantInspections.nozzle,
      valvePillar: hydrantInspections.valvePillar,
      overallStatus: hydrantInspections.overallStatus,
      notes: hydrantInspections.notes,
    })
    .from(hydrantInspections)
    .innerJoin(hydrantUnits, eq(hydrantInspections.unitId, hydrantUnits.id))
    .innerJoin(zones, eq(hydrantUnits.zoneId, zones.id))
    .where(
      and(
        eq(hydrantInspections.companyId, owned),
        eq(hydrantInspections.period, a.period),
        eq(hydrantUnits.siteId, a.siteId),
      ),
    )
    .orderBy(asc(hydrantUnits.kode));
  const photoRows = rows.length
    ? await db
        .select({ s3Key: photos.s3Key, caption: photos.caption })
        .from(photos)
        .where(inArray(photos.hydrantInspectionId, rows.map((r) => r.inspectionId)))
    : [];
  return {
    siteName: a.siteName,
    periodKey: toPeriodKey(a.period),
    rows: rows.map((r) => ({
      kode: r.kode,
      zoneName: r.zoneName,
      components: {
        boxHydrant: r.boxHydrant,
        fireHose: r.fireHose,
        hoseCoupling: r.hoseCoupling,
        hoseRack: r.hoseRack,
        nozzle: r.nozzle,
        valvePillar: r.valvePillar,
      },
      overallStatus: r.overallStatus,
      notes: r.notes,
    })),
    photos: await presignedPhotoRows(photoRows),
  };
}

async function loadAparMonthly(refId: string, owned: string): Promise<AparMonthlyData> {
  const anchor = await db
    .select({ period: aparInspections.period, siteId: aparUnits.siteId, siteName: sites.name })
    .from(aparInspections)
    .innerJoin(aparUnits, eq(aparInspections.unitId, aparUnits.id))
    .innerJoin(sites, eq(aparUnits.siteId, sites.id))
    .where(and(eq(aparInspections.id, refId), eq(aparInspections.companyId, owned)))
    .limit(1);
  if (anchor.length === 0) throw notFound("Inspeksi APAR");
  const a = anchor[0];
  const rows = await db
    .select({
      kode: aparUnits.kode,
      zoneName: zones.name,
      jenis: aparUnits.jenis,
      safetyPin: aparInspections.safetyPin,
      corong: aparInspections.corong,
      segel: aparInspections.segel,
      tekanan: aparInspections.tekanan,
      tabung: aparInspections.tabung,
      selang: aparInspections.selang,
      katupTuas: aparInspections.katupTuas,
      overallStatus: aparInspections.overallStatus,
      notes: aparInspections.notes,
    })
    .from(aparInspections)
    .innerJoin(aparUnits, eq(aparInspections.unitId, aparUnits.id))
    .innerJoin(zones, eq(aparUnits.zoneId, zones.id))
    .where(
      and(
        eq(aparInspections.companyId, owned),
        eq(aparInspections.period, a.period),
        eq(aparUnits.siteId, a.siteId),
      ),
    )
    .orderBy(asc(aparUnits.kode));
  const expiring = await db
    .select({
      kode: aparUnits.kode,
      jenis: aparUnits.jenis,
      ukuran: aparUnits.ukuran,
      expiredDate: aparUnits.expiredDate,
    })
    .from(aparUnits)
    .where(and(eq(aparUnits.companyId, owned), eq(aparUnits.siteId, a.siteId)))
    .orderBy(asc(aparUnits.expiredDate))
    .limit(10);
  return {
    siteName: a.siteName,
    periodKey: toPeriodKey(a.period),
    rows: rows.map((r) => ({
      kode: r.kode,
      zoneName: r.zoneName,
      jenis: r.jenis,
      components: {
        safetyPin: r.safetyPin,
        corong: r.corong,
        segel: r.segel,
        tekanan: r.tekanan,
        tabung: r.tabung,
        selang: r.selang,
        katupTuas: r.katupTuas,
      },
      overallStatus: r.overallStatus,
      notes: r.notes,
    })),
    expiring,
  };
}

async function loadAparCard(refId: string, owned: string): Promise<AparCardData> {
  const anchor = await db
    .select({
      unitId: aparInspections.unitId,
      period: aparInspections.period,
      kode: aparUnits.kode,
      siteName: sites.name,
      zoneName: zones.name,
      tahun: aparUnits.tahun,
      jenis: aparUnits.jenis,
      ukuran: aparUnits.ukuran,
      expiredDate: aparUnits.expiredDate,
    })
    .from(aparInspections)
    .innerJoin(aparUnits, eq(aparInspections.unitId, aparUnits.id))
    .innerJoin(sites, eq(aparUnits.siteId, sites.id))
    .innerJoin(zones, eq(aparUnits.zoneId, zones.id))
    .where(and(eq(aparInspections.id, refId), eq(aparInspections.companyId, owned)))
    .limit(1);
  if (anchor.length === 0) throw notFound("Inspeksi APAR");
  const a = anchor[0];
  const year = toPeriodKey(a.period).slice(0, 4);
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;
  const rows = await db
    .select({
      period: aparInspections.period,
      safetyPin: aparInspections.safetyPin,
      corong: aparInspections.corong,
      segel: aparInspections.segel,
      tekanan: aparInspections.tekanan,
      tabung: aparInspections.tabung,
      selang: aparInspections.selang,
      katupTuas: aparInspections.katupTuas,
      overallStatus: aparInspections.overallStatus,
    })
    .from(aparInspections)
    .where(
      and(
        eq(aparInspections.companyId, owned),
        eq(aparInspections.unitId, a.unitId),
        gte(aparInspections.period, `${year}-01-01`),
        lte(aparInspections.period, `${year}-12-31`),
      ),
    );
  const months: AparCardData["months"] = Array.from({ length: 12 }, () => ({ overallStatus: "" }));
  for (const r of rows) {
    const monthIndex = Number(toPeriodKey(r.period).slice(5, 7)) - 1;
    months[monthIndex] = {
      safetyPin: r.safetyPin,
      corong: r.corong,
      segel: r.segel,
      tekanan: r.tekanan,
      tabung: r.tabung,
      selang: r.selang,
      katupTuas: r.katupTuas,
      overallStatus: r.overallStatus,
    };
  }
  return {
    kode: a.kode,
    siteName: a.siteName,
    zoneName: a.zoneName,
    tahun: a.tahun ?? Number(year),
    jenis: a.jenis,
    ukuran: a.ukuran,
    expiredDate: a.expiredDate,
    months,
  };
}

async function loadP3kYearly(refId: string, owned: string): Promise<P3kYearlyData> {
  const anchor = await db
    .select({ boxId: p3kInspections.boxId, period: p3kInspections.period, boxName: p3kBoxes.name, siteName: sites.name })
    .from(p3kInspections)
    .innerJoin(p3kBoxes, eq(p3kInspections.boxId, p3kBoxes.id))
    .innerJoin(sites, eq(p3kBoxes.siteId, sites.id))
    .where(and(eq(p3kInspections.id, refId), eq(p3kInspections.companyId, owned)))
    .limit(1);
  if (anchor.length === 0) throw notFound("Inspeksi P3K");
  const a = anchor[0];
  const year = toPeriodKey(a.period).slice(0, 4);
  const yearInspections = await db
    .select({ id: p3kInspections.id, period: p3kInspections.period })
    .from(p3kInspections)
    .where(and(eq(p3kInspections.companyId, owned), eq(p3kInspections.boxId, a.boxId)));
  const inYear = yearInspections.filter((r) => toPeriodKey(r.period).startsWith(year));
  const items = inYear.length
    ? await db
        .select({ inspectionId: p3kInspectionItems.inspectionId, itemName: p3kInspectionItems.itemName, standardQty: p3kInspectionItems.standardQty, status: p3kInspectionItems.status })
        .from(p3kInspectionItems)
        .where(inArray(p3kInspectionItems.inspectionId, inYear.map((r) => r.id)))
    : [];
  const perMonth = new Map<string, (string | null)[]>();
  const standardQty = new Map<string, number>();
  for (const it of items) {
    const list = perMonth.get(it.itemName) ?? Array.from({ length: 12 }, () => null);
    const monthIndex = Number(toPeriodKey(inYear.find((r) => r.id === it.inspectionId)!.period).slice(5, 7)) - 1;
    list[monthIndex] = it.status;
    perMonth.set(it.itemName, list);
    standardQty.set(it.itemName, it.standardQty);
  }
  return {
    boxName: a.boxName,
    siteName: a.siteName,
    tahun: Number(year),
    items: STANDARD_P3K_ITEMS.filter((cat) => perMonth.has(cat.name)).map((cat) => ({
      name: cat.name,
      standardQty: standardQty.get(cat.name) ?? cat.standardQty,
      perMonth: perMonth.get(cat.name)!,
    })),
  };
}

async function loadPatrolReport(refId: string, owned: string): Promise<PatrolReportData> {
  const anchor = await db
    .select({ patrolDate: safetyPatrolReports.patrolDate, siteName: sites.name })
    .from(safetyPatrolReports)
    .innerJoin(sites, eq(safetyPatrolReports.siteId, sites.id))
    .where(and(eq(safetyPatrolReports.id, refId), eq(safetyPatrolReports.companyId, owned)))
    .limit(1);
  if (anchor.length === 0) throw notFound("Laporan patroli");
  const findings = await db
    .select({ s3Key: safetyPatrolFindings.s3Key, description: safetyPatrolFindings.description })
    .from(safetyPatrolFindings)
    .where(eq(safetyPatrolFindings.reportId, refId))
    .orderBy(asc(safetyPatrolFindings.createdAt));
  const photos = await presignedPhotoRows(findings.map((f) => ({ s3Key: f.s3Key, caption: f.description })));
  return { siteName: anchor[0].siteName, patrolDate: anchor[0].patrolDate, findings: photos };
}

const CATEGORY_DEFS: Record<
  ExportCategory,
  { landscape: boolean; run: (refId: string, owned: string) => Promise<string> }
> = {
  "hydrant-monthly": {
    landscape: false,
    run: (refId, owned) => loadHydrantMonthly(refId, owned).then(hydrantMonthly),
  },
  "apar-monthly": {
    landscape: false,
    run: (refId, owned) => loadAparMonthly(refId, owned).then(aparMonthly),
  },
  "apar-card": {
    landscape: false,
    run: (refId, owned) => loadAparCard(refId, owned).then(aparCard),
  },
  "p3k-yearly": {
    landscape: true,
    run: (refId, owned) => loadP3kYearly(refId, owned).then(p3kYearly),
  },
  "patrol-report": {
    landscape: false,
    run: (refId, owned) => loadPatrolReport(refId, owned).then(patrolReport),
  },
};

export const exportsApp = new Hono()
  .use("*", requireSession)

  .post("/:category/:refId", zValidator("param", exportParamSchema), async (c) => {
  const { category, refId } = c.req.valid("param");
  const owned = companyId(c);
  const jobId = newId();
  await db.insert(pdfJobs).values({ id: jobId, companyId: owned, category, refId, status: "queued" });
  try {
    const html = await CATEGORY_DEFS[category].run(refId, owned);
    const pdf = await renderPdf(html, { landscape: CATEGORY_DEFS[category].landscape });
    const key = `pdf/${owned}/${jobId}.pdf`;
    await putBytes(key, pdf, "application/pdf");
    await db.update(pdfJobs).set({ status: "done", s3Key: key }).where(eq(pdfJobs.id, jobId));
    return c.json({ id: jobId, category, status: "done" }, 201);
  } catch (err) {
    await db.update(pdfJobs).set({ status: "failed" }).where(eq(pdfJobs.id, jobId));
    throw err;
  }
});

export const pdfJobsApp = new Hono()
  .use("*", requireSession)

  .get("/:id", zValidator("param", z.object({ id: z.string().min(1) })), async (c) => {
  const { id } = c.req.valid("param");
  const owned = companyId(c);
  const rows = await db
    .select()
    .from(pdfJobs)
    .where(and(eq(pdfJobs.id, id), eq(pdfJobs.companyId, owned)))
    .limit(1);
  if (rows.length === 0) throw notFound("Pekerjaan PDF");
  const job = rows[0];
  const downloadUrl = job.s3Key && job.status === "done" ? await presignedGet(job.s3Key, 60) : null;
  return c.json({
    id: job.id,
    category: job.category,
    refId: job.refId,
    status: job.status,
    createdAt: job.createdAt,
    downloadUrl,
  });
});
