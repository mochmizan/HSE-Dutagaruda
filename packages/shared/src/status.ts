import type {
  AparComponents,
  HydrantComponents,
  OverallStatus,
  P3kItemCheck,
} from "./types.js";

export function computeHydrantOverallStatus(
  components: HydrantComponents,
): OverallStatus {
  const all = [
    components.boxHydrant,
    components.fireHose,
    components.hoseCoupling,
    components.hoseRack,
    components.nozzle,
    components.valvePillar,
  ];
  const anyFailed = all.some((s) => s === "TIDAK_LAYAK" || s === "HILANG");
  if (anyFailed) return "TIDAK_LAYAK";
  return "LAYAK";
}

export function computeAparOverallStatus(
  components: AparComponents,
): OverallStatus {
  const critical = [
    components.tekanan,
    components.tabung,
    components.selang,
    components.katupTuas,
  ];
  const nonCritical = [components.safetyPin, components.corong, components.segel];
  const allCriticalBaik = critical.every((s) => s === "BAIK" || s === "NA");
  const allNonCriticalBaik = nonCritical.every((s) => s === "BAIK" || s === "NA");
  if (allCriticalBaik && allNonCriticalBaik) return "LAYAK";
  const anyCriticalFailed = critical.some((s) => s === "TIDAK_BAIK");
  if (anyCriticalFailed) return "TIDAK_LAYAK";
  return "LAYAK_DENGAN_CATATAN";
}

export function computeP3kBoxStatus(items: P3kItemCheck[]): {
  overallStatus: OverallStatus;
  needsRestock: boolean;
} {
  const hasSubstandard = items.some(
    (item) =>
      item.status === "DIBAWAH_STANDAR" ||
      item.status === "KADALUARSA" ||
      item.actualQty < item.standardQty,
  );
  return {
    overallStatus: hasSubstandard ? "LAYAK_DENGAN_CATATAN" : "LAYAK",
    needsRestock: hasSubstandard,
  };
}
