import { z } from "zod";
import { periodKeySchema } from "@viaannn/shared";

export const idParamSchema = z.object({ id: z.string().min(1) });

export const companyBodySchema = z.object({
  name: z.string().min(1, "Nama perusahaan wajib diisi."),
});

export const siteBodySchema = z.object({
  companyId: z.string().min(1).optional(),
  name: z.string().min(1, "Nama lokasi wajib diisi."),
  address: z.string().optional(),
});

export const zoneBodySchema = z.object({
  companyId: z.string().min(1).optional(),
  siteId: z.string().min(1, "Lokasi wajib diisi."),
  name: z.string().min(1, "Nama zona wajib diisi."),
});

export const hydrantUnitBodySchema = z.object({
  siteId: z.string().min(1, "Lokasi wajib diisi."),
  zoneId: z.string().min(1, "Zona wajib diisi."),
  kode: z.string().min(1, "Kode hidran wajib diisi."),
});

export const aparUnitBodySchema = z.object({
  siteId: z.string().min(1, "Lokasi wajib diisi."),
  zoneId: z.string().min(1, "Zona wajib diisi."),
  kode: z.string().min(1, "Kode APAR wajib diisi."),
  tahun: z.number().int().min(1900).max(2100).optional(),
  jenis: z.enum(["POWDER", "CO2", "FOAM", "OTHER"]).optional(),
  ukuran: z.string().optional(),
  expiredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal kedaluwarsa harus format YYYY-MM-DD."),
});

export const p3kBoxBodySchema = z.object({
  siteId: z.string().min(1, "Lokasi wajib diisi."),
  name: z.string().min(1, "Nama kotak P3K wajib diisi."),
});

const monthBody = z.object({
  month: periodKeySchema,
});

export const hydrantInspectionBodySchema = z.object({
  unitId: z.string().min(1),
  month: periodKeySchema,
  boxHydrant: z.enum(["LAYAK", "TIDAK_LAYAK", "HILANG"]),
  fireHose: z.enum(["LAYAK", "TIDAK_LAYAK", "HILANG"]),
  hoseCoupling: z.enum(["LAYAK", "TIDAK_LAYAK", "HILANG"]),
  hoseRack: z.enum(["LAYAK", "TIDAK_LAYAK", "HILANG"]),
  nozzle: z.enum(["LAYAK", "TIDAK_LAYAK", "HILANG"]),
  valvePillar: z.enum(["LAYAK", "TIDAK_LAYAK", "HILANG"]),
  overallStatus: z.enum(["LAYAK", "LAYAK_DENGAN_CATATAN", "TIDAK_LAYAK"]).optional(),
  overallOverridden: z.boolean().optional(),
  notes: z.string().optional(),
});

export const aparInspectionBodySchema = z.object({
  unitId: z.string().min(1),
  month: periodKeySchema,
  safetyPin: z.enum(["BAIK", "TIDAK_BAIK", "NA"]),
  corong: z.enum(["BAIK", "TIDAK_BAIK", "NA"]),
  segel: z.enum(["BAIK", "TIDAK_BAIK", "NA"]),
  tekanan: z.enum(["BAIK", "TIDAK_BAIK", "NA"]),
  tabung: z.enum(["BAIK", "TIDAK_BAIK", "NA"]),
  selang: z.enum(["BAIK", "TIDAK_BAIK", "NA"]),
  katupTuas: z.enum(["BAIK", "TIDAK_BAIK", "NA"]),
  beratCo2Kg: z.number().optional(),
  overallStatus: z.enum(["LAYAK", "LAYAK_DENGAN_CATATAN", "TIDAK_LAYAK"]).optional(),
  overallOverridden: z.boolean().optional(),
  notes: z.string().optional(),
});

export const p3kInspectionBodySchema = z.object({
  boxId: z.string().min(1),
  month: periodKeySchema,
  notes: z.string().optional(),
  inspectionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal inspeksi harus format YYYY-MM-DD.").optional(),
  paraf: z.string().max(24).optional(),
});

export const p3kItemPatchSchema = z.object({
  actualQty: z.number().int().min(0).optional(),
  status: z.enum(["STANDAR", "DIBAWAH_STANDAR", "KADALUARSA"]).optional(),
});

export const patrolReportBodySchema = z.object({
  siteId: z.string().min(1, "Lokasi wajib diisi."),
  patrolDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal patroli harus format YYYY-MM-DD."),
});

export const patrolFindingBodySchema = z.object({
  description: z.string().min(1, "Uraian temuan wajib diisi."),
  s3Key: z.string().min(1, "Kunci foto wajib diisi."),
  mime: z.string().optional(),
  bytes: z.number().int().min(0).optional(),
  sha256: z.string().optional(),
  locationNote: z.string().optional(),
});

export const inspectionQuerySchema = z.object({
  month: periodKeySchema,
  unitId: z.string().min(1).optional(),
  boxId: z.string().min(1).optional(),
});

export const listQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  siteId: z.string().min(1).optional(),
  clientId: z.string().min(1).optional(),
});

export const monthQuery = monthBody;

export const settingsPatchSchema = z.object({
  value: z.string().min(1),
});
