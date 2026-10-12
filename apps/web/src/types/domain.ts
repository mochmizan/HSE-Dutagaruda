/**
 * Domain Models for HSE Inspection Platform
 * Strictly aligned with PRD §3.2 Prisma Schema
 */

export type Role = 'STAFF';

export type HydrantComponentStatus = 'LAYAK' | 'TIDAK_LAYAK' | 'HILANG';

export type AparComponentStatus = 'BAIK' | 'TIDAK_BAIK' | 'NA';

export type P3kItemStatus = 'STANDAR' | 'DIBAWAH_STANDAR' | 'KADALUARSA';

export type OverallStatus = 'LAYAK' | 'LAYAK_DENGAN_CATATAN' | 'TIDAK_LAYAK';

export type AparJenis = 'POWDER' | 'CO2' | 'FOAM' | 'OTHER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface Setting {
  key: string;
  value: string;
}

export interface Client {
  id: string;
  name: string;
  createdAt: string;
  sites?: Site[];
}

export interface Site {
  id: string;
  clientId: string;
  client?: Client;
  name: string;
  address?: string | null;
  createdAt: string;
  zones?: Zone[];
  hydrantUnits?: HydrantUnit[];
  aparUnits?: AparUnit[];
  p3kBoxes?: P3kBox[];
  safetyPatrols?: SafetyPatrolReport[];
}

export interface Zone {
  id: string;
  siteId: string;
  site?: Site;
  name: string; // e.g. "Zona 1"
  hydrantUnits?: HydrantUnit[];
  aparUnits?: AparUnit[];
}

export interface HydrantUnit {
  id: string;
  siteId: string;
  site?: Site;
  zoneId: string;
  zone?: Zone;
  kode: string; // e.g. "Hydrant 1"
  createdAt: string;
  inspections?: HydrantInspection[];
}

export interface AparUnit {
  id: string;
  siteId: string;
  site?: Site;
  zoneId: string;
  zone?: Zone;
  kode: string; // e.g. "01"
  tahun?: number | null;
  jenis?: AparJenis | null;
  ukuran?: string | null;
  expiredDate: string; // ISO date
  createdAt: string;
  inspections?: AparInspection[];
}

export interface P3kBox {
  id: string;
  siteId: string;
  site?: Site;
  name: string; // e.g. "HSE Room"
  createdAt: string;
  inspections?: P3kInspection[];
}

export interface Photo {
  id: string;
  url: string;
  caption?: string | null;
  hydrantInspectionId?: string | null;
  aparInspectionId?: string | null;
}

export interface HydrantInspection {
  id: string;
  hydrantUnitId: string;
  hydrantUnit?: HydrantUnit;
  period: string; // first-of-month ISO
  inspectorUserId: string;
  inspectorName?: string;
  boxHydrant: HydrantComponentStatus;
  fireHose: HydrantComponentStatus;
  hoseCoupling: HydrantComponentStatus;
  hoseRack: HydrantComponentStatus;
  nozzle: HydrantComponentStatus;
  valvePillar: HydrantComponentStatus;
  overallStatus: OverallStatus;
  overallOverridden: boolean;
  notes?: string | null;
  createdAt: string;
  photos: Photo[];
}

export interface AparInspection {
  id: string;
  aparUnitId: string;
  aparUnit?: AparUnit;
  period: string;
  inspectorUserId: string;
  inspectorName?: string;
  safetyPin: AparComponentStatus;
  corong: AparComponentStatus;
  segel: AparComponentStatus;
  tekanan: AparComponentStatus;
  tabung: AparComponentStatus;
  selang: AparComponentStatus;
  katupTuas: AparComponentStatus;
  beratCo2Kg?: number | null;
  overallStatus: OverallStatus;
  overallOverridden: boolean;
  notes?: string | null;
  createdAt: string;
  photos: Photo[];
}

export interface P3kInspectionItem {
  id: string;
  p3kInspectionId: string;
  itemName: string;
  standardQty: number;
  actualQty: number;
  status: P3kItemStatus;
}

export interface P3kInspection {
  id: string;
  p3kBoxId: string;
  p3kBox?: P3kBox;
  period: string;
  inspectorUserId: string;
  inspectorName?: string;
  notes?: string | null;
  createdAt: string;
  items: P3kInspectionItem[];
}

export interface SafetyPatrolFinding {
  id: string;
  safetyPatrolReportId: string;
  description: string;
  photoUrl: string;
  locationNote?: string | null;
}

export interface SafetyPatrolReport {
  id: string;
  siteId: string;
  site?: Site;
  patrolDate: string; // ISO date
  inspectorUserId: string;
  inspectorName?: string;
  createdAt: string;
  findings: SafetyPatrolFinding[];
}
