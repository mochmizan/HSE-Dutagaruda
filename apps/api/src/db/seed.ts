import { hashPassword } from "better-auth/crypto";
import { createId } from "@paralleldrive/cuid2";
import { getStandardP3kItemsForType } from "@viaannn/shared";
import { eq } from "drizzle-orm";
import { db } from "./client.js";
import { account, member, organization, user } from "./auth-schema.js";
import {
  aparInspections,
  aparUnits,
  companies,
  hydrantInspections,
  hydrantUnits,
  p3kBoxes,
  p3kInspectionItems,
  p3kInspections,
  projectPreferences,
  safetyPatrolFindings,
  safetyPatrolReports,
  settings,
  sites,
  zones,
} from "./schema.js";

const COMPANY_ID = "seed-perusahaan-1";
const SITE_ID = "seed-lokasi-1";
const USER_ID = "seed-pengawas-1";

const existingCompany = await db
  .select({ id: companies.id })
  .from(companies)
  .where(eq(companies.id, COMPANY_ID))
  .limit(1);

if (existingCompany.length === 0) {
  await db.insert(companies).values({
    id: COMPANY_ID,
    name: "PT DUTAGARUDA PIRANTI PRIMA",
  });
}

const existingSite = await db
  .select({ id: sites.id })
  .from(sites)
  .where(eq(sites.id, SITE_ID))
  .limit(1);

if (existingSite.length === 0) {
  await db.insert(sites).values({
    id: SITE_ID,
    companyId: COMPANY_ID,
    name: "Kantor Pusat",
    address: "Jl. Jenderal Sudirman, Dukuh Atas, Jakarta Pusat",
  });
} else {
  await db
    .update(sites)
    .set({
      name: "Kantor Pusat",
      address: "Jl. Jenderal Sudirman, Dukuh Atas, Jakarta Pusat",
    })
    .where(eq(sites.id, SITE_ID));
}

const ZONES_SEED = [
  { id: "seed-zona-1", companyId: COMPANY_ID, siteId: SITE_ID, name: "Zona 1" },
  { id: "seed-zona-2", companyId: COMPANY_ID, siteId: SITE_ID, name: "Zona 2" },
  { id: "seed-zona-3", companyId: COMPANY_ID, siteId: SITE_ID, name: "Zona 3" },
  { id: "seed-zona-4", companyId: COMPANY_ID, siteId: SITE_ID, name: "Zona 4" },
];

for (const z of ZONES_SEED) {
  const ex = await db.select({ id: zones.id }).from(zones).where(eq(zones.id, z.id)).limit(1);
  if (ex.length === 0) {
    await db.insert(zones).values(z);
  }
}

const existingSetting = await db
  .select({ key: settings.key })
  .from(settings)
  .where(eq(settings.key, "apar_expiry_alert_days"))
  .limit(1);
if (existingSetting.length === 0) {
  await db.insert(settings).values({
    key: "apar_expiry_alert_days",
    value: "30",
  });
}

const existingOrg = await db
  .select({ id: organization.id })
  .from(organization)
  .where(eq(organization.id, COMPANY_ID))
  .limit(1);
if (existingOrg.length === 0) {
  await db.insert(organization).values({
    id: COMPANY_ID,
    name: "PT DUTAGARUDA PIRANTI PRIMA",
    slug: "dutagaruda-piranti-prima",
    createdAt: new Date(),
  });
}

const existingUser = await db
  .select({ id: user.id })
  .from(user)
  .where(eq(user.id, USER_ID))
  .limit(1);
if (existingUser.length === 0) {
  await db.insert(user).values({
    id: USER_ID,
    name: "Pengawas Demo",
    email: "pengawas@contoh.id",
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await db.insert(member).values({
    id: "seed-anggota-1",
    organizationId: COMPANY_ID,
    userId: USER_ID,
    role: "inspector",
    createdAt: new Date(),
  });

  await db.insert(account).values({
    id: createId(),
    accountId: USER_ID,
    providerId: "credential",
    userId: USER_ID,
    password: await hashPassword("Pengawas123"),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

const existingPref = await db
  .select({ userId: projectPreferences.userId })
  .from(projectPreferences)
  .where(eq(projectPreferences.userId, USER_ID))
  .limit(1);
if (existingPref.length === 0) {
  await db.insert(projectPreferences).values({
    userId: USER_ID,
    projectId: COMPANY_ID,
  });
}

// ── 1. BENIH HYDRANT (8 Unit + Inspeksi Bulanan) ──

const HYDRANT_UNITS_SEED = [
  {
    id: "seed-hyd-1",
    zoneId: "seed-zona-1",
    kode: "Hydrant 1",
    sortOrder: 0,
    boxHydrant: "LAYAK" as const,
    fireHose: "TIDAK_LAYAK" as const,
    hoseCoupling: "TIDAK_LAYAK" as const,
    hoseRack: "TIDAK_LAYAK" as const,
    nozzle: "TIDAK_LAYAK" as const,
    valvePillar: "LAYAK" as const,
    overallStatus: "TIDAK_LAYAK" as const,
    notes: "Tidak ada isi pada Box Hydrant",
  },
  {
    id: "seed-hyd-2",
    zoneId: "seed-zona-2",
    kode: "Hydrant 2",
    sortOrder: 1,
    boxHydrant: "TIDAK_LAYAK" as const,
    fireHose: "TIDAK_LAYAK" as const,
    hoseCoupling: "LAYAK" as const,
    hoseRack: "LAYAK" as const,
    nozzle: "TIDAK_LAYAK" as const,
    valvePillar: "TIDAK_LAYAK" as const,
    overallStatus: "LAYAK_DENGAN_CATATAN" as const,
    notes: "Daun Pintu Hydrant rusak, Nozzle Hydrant di Engineering, dan terdapat air pada outlet penyambung hydrant",
  },
  {
    id: "seed-hyd-3",
    zoneId: "seed-zona-3",
    kode: "Hydrant 3",
    sortOrder: 2,
    boxHydrant: "LAYAK" as const,
    fireHose: "TIDAK_LAYAK" as const,
    hoseCoupling: "LAYAK" as const,
    hoseRack: "LAYAK" as const,
    nozzle: "TIDAK_LAYAK" as const,
    valvePillar: "LAYAK" as const,
    overallStatus: "LAYAK_DENGAN_CATATAN" as const,
    notes: "Tidak ada penyambung antara Nozzle dan Fire Hose, dan Nozzle di Engineering",
  },
  {
    id: "seed-hyd-4",
    zoneId: "seed-zona-4",
    kode: "Hydrant 4",
    sortOrder: 3,
    boxHydrant: "LAYAK" as const,
    fireHose: "TIDAK_LAYAK" as const,
    hoseCoupling: "LAYAK" as const,
    hoseRack: "LAYAK" as const,
    nozzle: "TIDAK_LAYAK" as const,
    valvePillar: "LAYAK" as const,
    overallStatus: "LAYAK_DENGAN_CATATAN" as const,
    notes: "Jahitan pada Fire Hose mulai robek, dan nozzle di engineering",
  },
  {
    id: "seed-hyd-5",
    zoneId: "seed-zona-4",
    kode: "Hydrant 5",
    sortOrder: 4,
    boxHydrant: "TIDAK_LAYAK" as const,
    fireHose: "LAYAK" as const,
    hoseCoupling: "LAYAK" as const,
    hoseRack: "LAYAK" as const,
    nozzle: "TIDAK_LAYAK" as const,
    valvePillar: "LAYAK" as const,
    overallStatus: "LAYAK_DENGAN_CATATAN" as const,
    notes: "Jahitan pada Fire Hose mulai robek, pintu box hydrant tidak bisa menutup rapat, dan nozzle di engineering",
  },
  {
    id: "seed-hyd-6",
    zoneId: "seed-zona-3",
    kode: "Hydrant 6",
    sortOrder: 5,
    boxHydrant: "LAYAK" as const,
    fireHose: "TIDAK_LAYAK" as const,
    hoseCoupling: "TIDAK_LAYAK" as const,
    hoseRack: "TIDAK_LAYAK" as const,
    nozzle: "TIDAK_LAYAK" as const,
    valvePillar: "LAYAK" as const,
    overallStatus: "TIDAK_LAYAK" as const,
    notes: "Tidak ada isi pada Box Hydrant",
  },
  {
    id: "seed-hyd-7",
    zoneId: "seed-zona-4",
    kode: "Hydrant 7",
    sortOrder: 6,
    boxHydrant: "LAYAK" as const,
    fireHose: "TIDAK_LAYAK" as const,
    hoseCoupling: "LAYAK" as const,
    hoseRack: "LAYAK" as const,
    nozzle: "TIDAK_LAYAK" as const,
    valvePillar: "LAYAK" as const,
    overallStatus: "LAYAK_DENGAN_CATATAN" as const,
    notes: "Jahitan pada Fire Hose mulai robek, dan nozzle di engineering",
  },
  {
    id: "seed-hyd-8",
    zoneId: "seed-zona-4",
    kode: "Hydrant 8",
    sortOrder: 7,
    boxHydrant: "TIDAK_LAYAK" as const,
    fireHose: "TIDAK_LAYAK" as const,
    hoseCoupling: "LAYAK" as const,
    hoseRack: "LAYAK" as const,
    nozzle: "TIDAK_LAYAK" as const,
    valvePillar: "LAYAK" as const,
    overallStatus: "LAYAK_DENGAN_CATATAN" as const,
    notes: "Jahitan pada Fire Hose mulai robek, pintu box hydrant tidak bisa menutup rapat, dan nozzle di engineering",
  },
];

const HYDRANT_PERIODS = ["2026-09-01", "2026-10-01", "2026-11-01"];

for (const u of HYDRANT_UNITS_SEED) {
  const ex = await db.select({ id: hydrantUnits.id }).from(hydrantUnits).where(eq(hydrantUnits.id, u.id)).limit(1);
  if (ex.length === 0) {
    await db.insert(hydrantUnits).values({
      id: u.id,
      companyId: COMPANY_ID,
      siteId: SITE_ID,
      zoneId: u.zoneId,
      kode: u.kode,
      sortOrder: u.sortOrder,
    });
  }
  for (const period of HYDRANT_PERIODS) {
    const inspId = `${u.id}-${period.slice(0, 7)}`;
    const exI = await db
      .select({ id: hydrantInspections.id })
      .from(hydrantInspections)
      .where(eq(hydrantInspections.id, inspId))
      .limit(1);
    if (exI.length === 0) {
      await db.insert(hydrantInspections).values({
        id: inspId,
        companyId: COMPANY_ID,
        unitId: u.id,
        period,
        boxHydrant: u.boxHydrant,
        fireHose: u.fireHose,
        hoseCoupling: u.hoseCoupling,
        hoseRack: u.hoseRack,
        nozzle: u.nozzle,
        valvePillar: u.valvePillar,
        overallStatus: u.overallStatus,
        overallOverridden: true,
        approvalStatus: "DIAJUKAN",
        notes: u.notes,
        createdAt: new Date(`${period.slice(0, 7)}-16T08:30:00.000Z`),
      });
    }
  }
}

// ── 2. BENIH APAR (20 Unit JPM Dukuh Atas + Inspeksi Multi-Bulan 2026) ──

const APAR_UNITS_SEED = [
  { no: 1, zoneId: "seed-zona-4", kode: "APAR 01", jenis: "POWDER" as const, ukuran: "3 kg", tahun: 2024, expiredDate: "2027-01-22" },
  { no: 2, zoneId: "seed-zona-4", kode: "APAR 02", jenis: "POWDER" as const, ukuran: "3 kg", tahun: 2024, expiredDate: "2028-02-22" },
  { no: 3, zoneId: "seed-zona-4", kode: "APAR 03", jenis: "POWDER" as const, ukuran: "3 kg", tahun: 2024, expiredDate: "2028-02-22" },
  { no: 4, zoneId: "seed-zona-4", kode: "APAR 04", jenis: "POWDER" as const, ukuran: "3 kg", tahun: 2024, expiredDate: "2028-02-22" },
  { no: 5, zoneId: "seed-zona-1", kode: "APAR 05", jenis: "POWDER" as const, ukuran: "3 kg", tahun: 2024, expiredDate: "2028-02-22" },
  { no: 6, zoneId: "seed-zona-1", kode: "APAR 06", jenis: "POWDER" as const, ukuran: "3 kg", tahun: 2024, expiredDate: "2028-02-22" },
  { no: 7, zoneId: "seed-zona-1", kode: "APAR 07", jenis: "POWDER" as const, ukuran: "3 kg", tahun: 2024, expiredDate: "2028-02-22" },
  { no: 8, zoneId: "seed-zona-1", kode: "APAR 08", jenis: "POWDER" as const, ukuran: "3 kg", tahun: 2024, expiredDate: "2028-02-22" },
  { no: 9, zoneId: "seed-zona-2", kode: "APAR 09", jenis: "POWDER" as const, ukuran: "3 kg", tahun: 2024, expiredDate: "2028-02-22" },
  { no: 10, zoneId: "seed-zona-2", kode: "APAR 10", jenis: "POWDER" as const, ukuran: "3 kg", tahun: 2024, expiredDate: "2028-02-22" },
  { no: 11, zoneId: "seed-zona-2", kode: "APAR 11", jenis: "POWDER" as const, ukuran: "3 kg", tahun: 2024, expiredDate: "2028-02-22" },
  { no: 12, zoneId: "seed-zona-3", kode: "APAR 12", jenis: "POWDER" as const, ukuran: "3 kg", tahun: 2024, expiredDate: "2028-02-22" },
  { no: 13, zoneId: "seed-zona-3", kode: "APAR 13", jenis: "CO2" as const, ukuran: "5 kg", tahun: 2025, expiredDate: "2029-02-20" },
  { no: 14, zoneId: "seed-zona-3", kode: "APAR 14", jenis: "POWDER" as const, ukuran: "3 kg", tahun: 2024, expiredDate: "2027-01-22" },
  { no: 15, zoneId: "seed-zona-3", kode: "APAR 15", jenis: "POWDER" as const, ukuran: "3 kg", tahun: 2024, expiredDate: "2027-01-22" },
  { no: 16, zoneId: "seed-zona-3", kode: "APAR 16", jenis: "CO2" as const, ukuran: "5 kg", tahun: 2025, expiredDate: "2029-02-20" },
  { no: 17, zoneId: "seed-zona-3", kode: "APAR 17", jenis: "CO2" as const, ukuran: "5 kg", tahun: 2025, expiredDate: "2029-02-20" },
  { no: 18, zoneId: "seed-zona-3", kode: "APAR 18", jenis: "CO2" as const, ukuran: "5 kg", tahun: 2025, expiredDate: "2029-02-20" },
  { no: 19, zoneId: "seed-zona-1", kode: "APAR 19", jenis: "CO2" as const, ukuran: "5 kg", tahun: 2025, expiredDate: "2029-02-20" },
  { no: 20, zoneId: "seed-zona-3", kode: "APAR 20", jenis: "POWDER" as const, ukuran: "3 kg", tahun: 2023, expiredDate: "2026-10-23" },
];

const APAR_MONTHS_SEED = [
  "2026-02-01",
  "2026-03-01",
  "2026-04-01",
  "2026-05-01",
  "2026-06-01",
  "2026-07-01",
  "2026-08-01",
  "2026-09-01",
  "2026-10-01",
  "2026-11-01",
];

for (const a of APAR_UNITS_SEED) {
  const unitId = `seed-apar-${a.no}`;
  const ex = await db.select({ id: aparUnits.id }).from(aparUnits).where(eq(aparUnits.id, unitId)).limit(1);
  if (ex.length === 0) {
    await db.insert(aparUnits).values({
      id: unitId,
      companyId: COMPANY_ID,
      siteId: SITE_ID,
      zoneId: a.zoneId,
      kode: a.kode,
      tahun: a.tahun,
      jenis: a.jenis,
      ukuran: a.ukuran,
      expiredDate: a.expiredDate,
      sortOrder: a.no - 1,
    });
  }
  for (const period of APAR_MONTHS_SEED) {
    const ym = period.slice(0, 7);
    const inspId = `${unitId}-${ym}`;
    const exI = await db
      .select({ id: aparInspections.id })
      .from(aparInspections)
      .where(eq(aparInspections.id, inspId))
      .limit(1);
    if (exI.length === 0) {
      const corongRusak = a.no === 3 && ym >= "2026-02" && ym <= "2026-08";
      await db.insert(aparInspections).values({
        id: inspId,
        companyId: COMPANY_ID,
        unitId,
        period,
        safetyPin: "BAIK",
        corong: corongRusak ? "TIDAK_BAIK" : "BAIK",
        segel: "BAIK",
        tekanan: "BAIK",
        tabung: "BAIK",
        selang: "BAIK",
        katupTuas: "BAIK",
        beratCo2Kg: a.jenis === "CO2" ? 4.8 : null,
        overallStatus: corongRusak ? "LAYAK_DENGAN_CATATAN" : "LAYAK",
        overallOverridden: true,
        approvalStatus: "DIAJUKAN",
        notes: corongRusak
          ? "Corong: Corong mengalami retak ringan\nTindak Lanjut: Dijadwalkan penggantian corong"
          : "Seluruh 7 komponen APAR dalam kondisi baik dan siap pakai",
        createdAt: new Date(`${ym}-16T09:00:00.000Z`),
      });
    }
  }
}

// ── 3. BENIH KOTAK P3K (Kotak Lokasi + 11 Bulan Tahun 2026 × 21 Item Baku) ──

const P3K_BOXES_SEED = [
  { id: "seed-p3k-box-1", name: "P3K-01 · Lantai 2 · Kotak Tipe A", boxType: "A" as const },
  { id: "seed-p3k-box-2", name: "P3K-02 · Lantai 3 · Kotak Tipe B", boxType: "B" as const },
];

for (const boxDef of P3K_BOXES_SEED) {
  const exBox = await db.select({ id: p3kBoxes.id }).from(p3kBoxes).where(eq(p3kBoxes.id, boxDef.id)).limit(1);
  if (exBox.length === 0) {
    await db.insert(p3kBoxes).values({
      id: boxDef.id,
      companyId: COMPANY_ID,
      siteId: SITE_ID,
      name: boxDef.name,
    });
  } else {
    await db.update(p3kBoxes).set({ name: boxDef.name }).where(eq(p3kBoxes.id, boxDef.id));
  }
}

const P3K_MONTHS_SEED = [
  { period: "2026-01-01", inspectionDate: "2026-01-02", paraf: "Takamay Jason H. I." },
  { period: "2026-02-01", inspectionDate: "2026-02-10", paraf: "Takamay Jason H. I." },
  { period: "2026-03-01", inspectionDate: "2026-03-11", paraf: "Takamay Jason H. I." },
  { period: "2026-04-01", inspectionDate: "2026-04-22", paraf: "Takamay Jason H. I." },
  { period: "2026-05-01", inspectionDate: "2026-05-13", paraf: "Takamay Jason H. I." },
  { period: "2026-06-01", inspectionDate: "2026-06-12", paraf: "Takamay Jason H. I." },
  { period: "2026-07-01", inspectionDate: "2026-07-20", paraf: "Takamay Jason H. I." },
  { period: "2026-08-01", inspectionDate: "2026-08-21", paraf: "Takamay Jason H. I." },
  { period: "2026-09-01", inspectionDate: "2026-09-16", paraf: "Takamay Jason H. I." },
  { period: "2026-10-01", inspectionDate: "2026-10-15", paraf: "Takamay Jason H. I." },
  { period: "2026-11-01", inspectionDate: "2026-11-15", paraf: "Takamay Jason H. I." },
];

for (const boxDef of P3K_BOXES_SEED) {
  const itemsForBox = getStandardP3kItemsForType(boxDef.boxType);
  const prefix = boxDef.boxType === "A" ? "seed-p3k-insp" : "seed-p3k-b-insp";
  for (const m of P3K_MONTHS_SEED) {
    const ym = m.period.slice(0, 7);
    const inspId = `${prefix}-${ym}`;
    const exP = await db
      .select({ id: p3kInspections.id })
      .from(p3kInspections)
      .where(eq(p3kInspections.id, inspId))
      .limit(1);
    if (exP.length === 0) {
      await db.insert(p3kInspections).values({
        id: inspId,
        companyId: COMPANY_ID,
        boxId: boxDef.id,
        period: m.period,
        inspectionDate: m.inspectionDate,
        paraf: m.paraf,
        notes: `Pemeriksaan rutin kelengkapan 21 item standar ${boxDef.name}`,
      });

      const itemRows = itemsForBox.map((std) => {
        const kurangJan = ym === "2026-01" && (std.id === 5 || std.id === 8);
        const kurangApr = ym === "2026-04" && std.id === 8;
        const kurangJun = ym === "2026-06" && std.id === 14;
        const isKurang = kurangJan || kurangApr || kurangJun;
        return {
          id: `${inspId}-item-${std.id}`,
          companyId: COMPANY_ID,
          inspectionId: inspId,
          itemName: std.name,
          standardQty: std.standardQty,
          actualQty: isKurang ? Math.max(0, std.standardQty - 1) : std.standardQty,
          status: isKurang ? ("DIBAWAH_STANDAR" as const) : ("STANDAR" as const),
        };
      });
      await db.insert(p3kInspectionItems).values(itemRows);
    }
  }
}

// ── 4. BENIH SAFETY PATROL (12 Temuan Lapangan Resmi) ──

const PATROL_FINDINGS_CAPTIONS = [
  "Isi Kotak P3K sudah sesuai standar",
  "Sudah diterapkan 5R",
  "APAR terhalang Tenant",
  "Terdapat limbah kemasan B3",
  "APAR tidak terpasang sign APAR dan Petunjuk cara penggunaan APAR",
  "Pipa hydrant bocor",
  "Selang hydrant robek",
  "APAR terhalang kipas",
  "Tidak ada penyambung antara Fire Hose dan Nozzle",
  "Box APAR tidak dapat menutup rapat",
  "Tuas APAR kendur",
  "Kabel Dispenser Air Isi Ulang gratis tidak merekat pada lantai",
];

const PATROL_DATES_SEED = ["2026-06-19", "2026-09-18", "2026-11-15"];

for (const patrolDate of PATROL_DATES_SEED) {
  const repId = `seed-patrol-${patrolDate}`;
  const exR = await db
    .select({ id: safetyPatrolReports.id })
    .from(safetyPatrolReports)
    .where(eq(safetyPatrolReports.id, repId))
    .limit(1);
  if (exR.length === 0) {
    await db.insert(safetyPatrolReports).values({
      id: repId,
      companyId: COMPANY_ID,
      siteId: SITE_ID,
      patrolDate,
      inspectorUserId: USER_ID,
    });

    await db.insert(safetyPatrolFindings).values(
      PATROL_FINDINGS_CAPTIONS.map((desc, idx) => ({
        id: `${repId}-f-${idx + 1}`,
        companyId: COMPANY_ID,
        reportId: repId,
        description: desc,
        s3Key: `draft/patrol-${idx + 1}.jpg`,
        locationNote: "ITJ JPM Dukuh Atas",
      })),
    );
  }
}

console.log(
  "Benih selesai: PT DUTAGARUDA PIRANTI PRIMA, lokasi Kantor Pusat (4 zona), 8 unit Hydrant, 20 unit APAR, 2 kotak P3K (Lantai 2 Tipe A & Lantai 3 Tipe B, 11 bulan × 21 item), dan 3 laporan Safety Patrol (36 temuan).",
);
process.exit(0);
