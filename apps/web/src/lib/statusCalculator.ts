/**
 * Auto-Computed Overall Status Algorithms
 * Strictly aligned with PRD §3.3
 */

import {
  HydrantComponentStatus,
  AparComponentStatus,
  P3kItemStatus,
  OverallStatus,
} from '../types/domain';

export interface HydrantComponents {
  boxHydrant: HydrantComponentStatus;
  fireHose: HydrantComponentStatus;
  hoseCoupling: HydrantComponentStatus;
  hoseRack: HydrantComponentStatus;
  nozzle: HydrantComponentStatus;
  valvePillar: HydrantComponentStatus;
}

/*
 * BACKEND AGENT CONTRACT / BUSINESS RULE:
 * If any of the 6 hydrant components is TIDAK_LAYAK or HILANG,
 * the overall status (status akhir) MUST automatically evaluate to TIDAK_LAYAK.
 * Only if all 6 components are LAYAK does it evaluate to LAYAK.
 */
export function computeHydrantOverallStatus(components: HydrantComponents): OverallStatus {
  const allComponents = [
    components.boxHydrant,
    components.fireHose,
    components.hoseCoupling,
    components.hoseRack,
    components.nozzle,
    components.valvePillar,
  ];

  const anyFailed = allComponents.some((s) => s === 'TIDAK_LAYAK' || s === 'HILANG');
  if (anyFailed) {
    return 'TIDAK_LAYAK';
  }

  return 'LAYAK';
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

/**
 * APAR Status Algorithm (PRD §3.3)
 * - Critical: tekanan, tabung, selang, katupTuas
 * - Non-critical: safetyPin, corong, segel
 * - All 7 components BAIK (or NA) -> LAYAK
 * - Any critical component TIDAK_BAIK -> TIDAK_LAYAK
 * - Otherwise (only non-critical components TIDAK_BAIK) -> LAYAK_DENGAN_CATATAN
 */
export function computeAparOverallStatus(components: AparComponents): OverallStatus {
  const critical = [components.tekanan, components.tabung, components.selang, components.katupTuas];
  const nonCritical = [components.safetyPin, components.corong, components.segel];

  const allCriticalBaik = critical.every((s) => s === 'BAIK' || s === 'NA');
  const allNonCriticalBaik = nonCritical.every((s) => s === 'BAIK' || s === 'NA');

  if (allCriticalBaik && allNonCriticalBaik) {
    return 'LAYAK';
  }

  const anyCriticalFailed = critical.some((s) => s === 'TIDAK_BAIK');
  if (anyCriticalFailed) {
    return 'TIDAK_LAYAK';
  }

  return 'LAYAK_DENGAN_CATATAN';
}

/**
 * P3K Box Status Algorithm (PRD Epic E / Story E1)
 * Box needs restock if any item status !== STANDAR
 */
export function computeP3kBoxStatus(items: { actualQty: number; standardQty: number; status?: P3kItemStatus }[]): {
  overallStatus: OverallStatus;
  needsRestock: boolean;
} {
  const hasSubstandard = items.some(
    (item) => item.status === 'DIBAWAH_STANDAR' || item.status === 'KADALUARSA' || item.actualQty < item.standardQty
  );

  return {
    overallStatus: hasSubstandard ? 'LAYAK_DENGAN_CATATAN' : 'LAYAK',
    needsRestock: hasSubstandard,
  };
}
