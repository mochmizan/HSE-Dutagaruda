export type Role = "inspector" | "staff" | "approver";

export type HydrantComponentStatus = "LAYAK" | "TIDAK_LAYAK" | "HILANG";

export type AparComponentStatus = "BAIK" | "TIDAK_BAIK" | "NA";

export type P3kItemStatus = "STANDAR" | "DIBAWAH_STANDAR" | "KADALUARSA";

export type OverallStatus = "LAYAK" | "LAYAK_DENGAN_CATATAN" | "TIDAK_LAYAK";

export type AparJenis = "POWDER" | "CO2" | "FOAM" | "OTHER";

export type PdfJobStatus = "queued" | "done" | "failed";

export interface HydrantComponents {
  boxHydrant: HydrantComponentStatus;
  fireHose: HydrantComponentStatus;
  hoseCoupling: HydrantComponentStatus;
  hoseRack: HydrantComponentStatus;
  nozzle: HydrantComponentStatus;
  valvePillar: HydrantComponentStatus;
}

export interface AparComponents {
  safetyPin: AparComponentStatus;
  corong: AparComponentStatus;
  segel: AparComponentStatus;
  tekanan: AparComponentStatus;
  tabung: AparComponentStatus;
  selang: AparComponentStatus;
  katupTuas: AparComponentStatus;
}

export interface P3kItemCheck {
  actualQty: number;
  standardQty: number;
  status?: P3kItemStatus;
}
