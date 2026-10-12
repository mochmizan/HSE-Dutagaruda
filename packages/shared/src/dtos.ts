import { z } from "zod";

export const periodKeySchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Periode harus format YYYY-MM.");

export const idParamSchema = z.object({ id: z.string().min(1) });

export const paginationQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const monthQuerySchema = z.object({
  month: periodKeySchema,
});

export const hydrantComponentsSchema = z.object({
  boxHydrant: z.enum(["LAYAK", "TIDAK_LAYAK", "HILANG"]),
  fireHose: z.enum(["LAYAK", "TIDAK_LAYAK", "HILANG"]),
  hoseCoupling: z.enum(["LAYAK", "TIDAK_LAYAK", "HILANG"]),
  hoseRack: z.enum(["LAYAK", "TIDAK_LAYAK", "HILANG"]),
  nozzle: z.enum(["LAYAK", "TIDAK_LAYAK", "HILANG"]),
  valvePillar: z.enum(["LAYAK", "TIDAK_LAYAK", "HILANG"]),
});

export const aparComponentsSchema = z.object({
  safetyPin: z.enum(["BAIK", "TIDAK_BAIK", "NA"]),
  corong: z.enum(["BAIK", "TIDAK_BAIK", "NA"]),
  segel: z.enum(["BAIK", "TIDAK_BAIK", "NA"]),
  tekanan: z.enum(["BAIK", "TIDAK_BAIK", "NA"]),
  tabung: z.enum(["BAIK", "TIDAK_BAIK", "NA"]),
  selang: z.enum(["BAIK", "TIDAK_BAIK", "NA"]),
  katupTuas: z.enum(["BAIK", "TIDAK_BAIK", "NA"]),
});
