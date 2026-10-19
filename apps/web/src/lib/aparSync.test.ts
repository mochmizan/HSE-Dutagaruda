/// <reference types="bun-types" />
import { describe, expect, test } from "bun:test";
import {
  APAR_COMPONENT_KEYS,
  APAR_MONTH_KEYS,
  countChecked,
  draftToYearCell,
  emptyYearCell,
  emptyYearGrid,
  resolveReportCell,
  yearCellToDraft,
} from "./aparSync";
import type { AparComponentDraft } from "./aparSync";
import type { AparUnitItem } from "../types/hse";

const unit = (overrides: Partial<AparUnitItem> = {}): AparUnitItem => ({
  id: "u1",
  kode: "01",
  siteId: "s1",
  zoneId: "z1",
  zoneName: "Zona 1",
  status: "BELUM_DIPERIKSA",
  period: "2026-09",
  jenis: "POWDER",
  ukuran: "6 kg",
  tahunPembuatan: 2024,
  expiredDate: "2027-01-31",
  componentsCheckedCount: 0,
  componentsTotal: 7,
  ...overrides,
});

describe("yearCellToDraft", () => {
  test("maps check marks to component statuses", () => {
    const cell = emptyYearCell();
    cell.kondisi.tekanan = "✓";
    cell.kondisi.tabung = "X";
    cell.kondisi.selang = "NA";
    expect(yearCellToDraft(cell)).toEqual({
      tekanan: "BAIK",
      tabung: "TIDAK_BAIK",
      selang: "NA",
    });
  });

  test("omits components that were never checked", () => {
    expect(yearCellToDraft(emptyYearCell())).toEqual({});
  });

  test("ignores an unknown mark rather than inventing a status", () => {
    const cell = emptyYearCell();
    cell.kondisi.katupTuas = "?";
    expect(yearCellToDraft(cell)).toEqual({});
  });
});

describe("draftToYearCell", () => {
  test("maps statuses back to check marks and leaves identity fields blank", () => {
    expect(draftToYearCell({ safetyPin: "BAIK", corong: "TIDAK_BAIK", segel: "NA" })).toEqual({
      tanggal: "",
      kondisi: {
        safetyPin: "✓",
        corong: "X",
        segel: "NA",
        tekanan: "",
        tabung: "",
        selang: "",
        katupTuas: "",
      },
      nama: "",
      paraf: "",
    });
  });

  test("an empty draft becomes an empty cell", () => {
    expect(draftToYearCell({})).toEqual(emptyYearCell());
  });

  test("round-trips every component through the card cell and back", () => {
    const draft: AparComponentDraft = {
      safetyPin: "BAIK",
      corong: "TIDAK_BAIK",
      segel: "NA",
      tekanan: "BAIK",
      tabung: "TIDAK_BAIK",
      selang: "NA",
      katupTuas: "BAIK",
    };
    expect(yearCellToDraft(draftToYearCell(draft))).toEqual(draft);
  });
});

describe("countChecked", () => {
  test("counts zero for an untouched draft", () => {
    expect(countChecked({})).toBe(0);
  });

  test("counts a partially filled draft", () => {
    expect(countChecked({ tekanan: "BAIK", tabung: "TIDAK_BAIK", selang: "NA" })).toBe(3);
  });

  test("counts all seven components", () => {
    const draft: AparComponentDraft = {
      safetyPin: "BAIK",
      corong: "BAIK",
      segel: "BAIK",
      tekanan: "BAIK",
      tabung: "BAIK",
      selang: "BAIK",
      katupTuas: "NA",
    };
    expect(countChecked(draft)).toBe(7);
  });
});

describe("emptyYearGrid", () => {
  test("has exactly the twelve month keys", () => {
    expect(Object.keys(emptyYearGrid()).sort()).toEqual([...APAR_MONTH_KEYS].sort());
  });

  test("every month is an empty cell with all seven components blank", () => {
    const grid = emptyYearGrid();
    for (const month of APAR_MONTH_KEYS) {
      expect(grid[month]).toEqual(emptyYearCell());
      expect(APAR_COMPONENT_KEYS.filter((key) => grid[month].kondisi[key] !== "")).toEqual([]);
    }
  });

  test("each month gets its own cell object, not a shared reference", () => {
    const grid = emptyYearGrid();
    grid["01"].tanggal = "2026-01-05";
    expect(grid["02"].tanggal).toBe("");
  });
});

describe("resolveReportCell", () => {
  test("a stored report cell wins over the unit draft", () => {
    const stored = emptyYearCell();
    stored.kondisi.tekanan = "X";
    stored.nama = "Petugas Kartu";
    const withDraft = unit({
      draftDetails: { tekanan: "BAIK", namaPemeriksa: "Petugas Draf" },
    });
    expect(resolveReportCell(stored, withDraft)).toEqual({
      tanggal: "",
      kondisi: {
        safetyPin: "",
        corong: "",
        segel: "",
        tekanan: "X",
        tabung: "",
        selang: "",
        katupTuas: "",
      },
      nama: "Petugas Kartu",
      paraf: "",
    });
  });

  test("an empty stored cell falls back to the unit draft", () => {
    const withDraft = unit({
      draftDetails: {
        tekanan: "BAIK",
        tabung: "TIDAK_BAIK",
        tanggalPemeriksaan: "2026-09-10",
        namaPemeriksa: "Petugas Draf",
        paraf: "PD",
      },
    });
    expect(resolveReportCell(undefined, withDraft)).toEqual({
      tanggal: "2026-09-10",
      kondisi: {
        safetyPin: "",
        corong: "",
        segel: "",
        tekanan: "✓",
        tabung: "X",
        selang: "",
        katupTuas: "",
      },
      nama: "Petugas Draf",
      paraf: "PD",
    });
  });

  test("a stored cell with a tanggal is not empty, so it wins over the draft", () => {
    const stored = emptyYearCell();
    stored.tanggal = "2026-09-01";
    const withDraft = unit({ draftDetails: { tekanan: "BAIK" } });
    const resolved = resolveReportCell(stored, withDraft);
    expect(resolved.tanggal).toBe("2026-09-01");
    expect(resolved.kondisi.tekanan).toBe("");
  });

  test("no stored cell and no draft returns an empty cell", () => {
    expect(resolveReportCell(undefined, unit())).toEqual(emptyYearCell());
  });

  test("an empty stored cell and no draft returns an empty cell", () => {
    expect(resolveReportCell(emptyYearCell(), unit())).toEqual(emptyYearCell());
  });
});
