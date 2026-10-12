/**
 * API Request & Response Contracts
 * Strictly aligned with PRD §3.4 API Surface
 */

import {
  OverallStatus,
  HydrantComponentStatus,
  AparComponentStatus,
  P3kItemStatus,
  HydrantInspection,
  AparInspection,
  P3kInspection,
  SafetyPatrolReport,
  Site,
  AparUnit,
} from './domain';
import { InspectionCategory } from './hse';

export interface CalendarInspectionItem {
  id: string;
  category: InspectionCategory;
  date: string; // ISO date string (YYYY-MM-DD)
  unitLabel: string;
  overallStatus: OverallStatus;
  zoneName: string;
  inspectorName: string;
}

export interface CalendarFeedQuery {
  siteId: string;
  month: number; // 1 - 12
  year: number;  // e.g. 2026
}

export interface ExpiringAparItem {
  id: string;
  siteId: string;
  siteName: string;
  kode: string;
  zoneName: string;
  expiredDate: string;
  daysRemaining: number;
}

export interface ExpiringAparQuery {
  withinDays?: number;
}

export interface CreateHydrantInspectionDto {
  hydrantUnitId: string;
  period: string; // YYYY-MM-01
  inspectorUserId: string;
  boxHydrant: HydrantComponentStatus;
  fireHose: HydrantComponentStatus;
  hoseCoupling: HydrantComponentStatus;
  hoseRack: HydrantComponentStatus;
  nozzle: HydrantComponentStatus;
  valvePillar: HydrantComponentStatus;
  overallStatus?: OverallStatus;
  overallOverridden?: boolean;
  notes?: string;
  photoUrls?: string[];
}

export interface CreateAparInspectionDto {
  aparUnitId: string;
  period: string; // YYYY-MM-01
  inspectorUserId: string;
  safetyPin: AparComponentStatus;
  corong: AparComponentStatus;
  segel: AparComponentStatus;
  tekanan: AparComponentStatus;
  tabung: AparComponentStatus;
  selang: AparComponentStatus;
  katupTuas: AparComponentStatus;
  beratCo2Kg?: number;
  overallStatus?: OverallStatus;
  overallOverridden?: boolean;
  notes?: string;
  photoUrls?: string[];
}

export interface CreateP3kInspectionItemDto {
  itemName: string;
  standardQty: number;
  actualQty: number;
  status: P3kItemStatus;
}

export interface CreateP3kInspectionDto {
  p3kBoxId: string;
  period: string; // YYYY-MM-01
  inspectorUserId: string;
  notes?: string;
  items: CreateP3kInspectionItemDto[];
}

export interface CreateSafetyPatrolFindingDto {
  description: string;
  photoUrl: string;
  locationNote?: string;
}

export interface CreateSafetyPatrolDto {
  siteId: string;
  patrolDate: string; // YYYY-MM-DD
  inspectorUserId: string;
  findings: CreateSafetyPatrolFindingDto[];
}

export interface AlertSettingsDto {
  aparExpiryAlertDays: number;
}

export interface UploadResponse {
  url: string;
}

export interface ExportSignOff {
  dibuatOleh: string;
  diketahuiOleh: string;
  disetujuiOleh: string;
}
