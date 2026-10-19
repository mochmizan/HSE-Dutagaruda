/// <reference types="bun-types" />
import { describe, expect, test } from "bun:test";
import { computeAparOverallStatus, computeHydrantOverallStatus } from "./status.js";
import type { AparComponents, HydrantComponents } from "./types.js";

const hydrantAll = (): HydrantComponents => ({
  boxHydrant: "LAYAK",
  fireHose: "LAYAK",
  hoseCoupling: "LAYAK",
  hoseRack: "LAYAK",
  nozzle: "LAYAK",
  valvePillar: "LAYAK",
});

const aparAll = (): AparComponents => ({
  safetyPin: "BAIK",
  corong: "BAIK",
  segel: "BAIK",
  tekanan: "BAIK",
  tabung: "BAIK",
  selang: "BAIK",
  katupTuas: "BAIK",
});

const HYDRANT_KEYS = [
  "boxHydrant",
  "fireHose",
  "hoseCoupling",
  "hoseRack",
  "nozzle",
  "valvePillar",
] as const;

const CRITICAL_KEYS = ["tekanan", "tabung", "selang", "katupTuas"] as const;
const NON_CRITICAL_KEYS = ["safetyPin", "corong", "segel"] as const;

describe("computeHydrantOverallStatus", () => {
  test("all six components LAYAK gives LAYAK", () => {
    expect(computeHydrantOverallStatus(hydrantAll())).toBe("LAYAK");
  });

  test("one TIDAK_LAYAK component gives TIDAK_LAYAK", () => {
    expect(computeHydrantOverallStatus({ ...hydrantAll(), nozzle: "TIDAK_LAYAK" })).toBe(
      "TIDAK_LAYAK",
    );
  });

  for (const key of HYDRANT_KEYS) {
    test(`${key} HILANG gives TIDAK_LAYAK`, () => {
      expect(computeHydrantOverallStatus({ ...hydrantAll(), [key]: "HILANG" })).toBe(
        "TIDAK_LAYAK",
      );
    });
  }
});

describe("computeAparOverallStatus", () => {
  test("all seven components BAIK gives LAYAK", () => {
    expect(computeAparOverallStatus(aparAll())).toBe("LAYAK");
  });

  test("all seven components NA gives LAYAK", () => {
    const allNa = Object.fromEntries(
      Object.keys(aparAll()).map((k) => [k, "NA"]),
    ) as unknown as AparComponents;
    expect(computeAparOverallStatus(allNa)).toBe("LAYAK");
  });

  test("mix of BAIK and NA gives LAYAK", () => {
    expect(
      computeAparOverallStatus({ ...aparAll(), safetyPin: "NA", selang: "NA" }),
    ).toBe("LAYAK");
  });

  for (const key of CRITICAL_KEYS) {
    test(`critical ${key} TIDAK_BAIK gives TIDAK_LAYAK`, () => {
      expect(computeAparOverallStatus({ ...aparAll(), [key]: "TIDAK_BAIK" })).toBe(
        "TIDAK_LAYAK",
      );
    });
  }

  for (const key of NON_CRITICAL_KEYS) {
    test(`non-critical ${key} TIDAK_BAIK gives LAYAK_DENGAN_CATATAN`, () => {
      expect(computeAparOverallStatus({ ...aparAll(), [key]: "TIDAK_BAIK" })).toBe(
        "LAYAK_DENGAN_CATATAN",
      );
    });
  }

  test("critical failure outranks a non-critical failure", () => {
    expect(
      computeAparOverallStatus({ ...aparAll(), safetyPin: "TIDAK_BAIK", tabung: "TIDAK_BAIK" }),
    ).toBe("TIDAK_LAYAK");
  });

  test("critical TIDAK_BAIK plus everything else NA still gives TIDAK_LAYAK", () => {
    expect(
      computeAparOverallStatus({
        safetyPin: "NA",
        corong: "NA",
        segel: "NA",
        tekanan: "NA",
        tabung: "TIDAK_BAIK",
        selang: "NA",
        katupTuas: "NA",
      }),
    ).toBe("TIDAK_LAYAK");
  });
});
