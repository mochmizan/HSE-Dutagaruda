/// <reference types="bun-types" />
import { describe, expect, test } from "bun:test";
import { formatIndonesianDate, formatIndonesianMonthYear, toPeriodIso, toPeriodKey } from "./dates.js";
import { detectP3kBoxType, getStandardP3kItemsForType, matchP3kCatalogItem } from "./p3kItems.js";

describe("formatIndonesianDate", () => {
  test("formats a date string with the Indonesian month name", () => {
    expect(formatIndonesianDate("2026-09-27")).toBe("27 September 2026");
  });

  test("formats a Date object the same way", () => {
    expect(formatIndonesianDate(new Date(2026, 0, 1))).toBe("1 Januari 2026");
  });

  test("formats a full ISO timestamp", () => {
    expect(formatIndonesianDate("2026-08-17T00:00:00.000Z")).toBe("17 Agustus 2026");
  });

  test("invalid date string returns an empty string instead of throwing", () => {
    expect(formatIndonesianDate("bukan-tanggal")).toBe("");
    expect(formatIndonesianMonthYear("bukan-tanggal")).toBe("");
    expect(toPeriodIso("bukan-tanggal")).toBe("");
  });

  test("an invalid Date object returns an empty string instead of throwing", () => {
    expect(formatIndonesianDate(new Date("nope"))).toBe("");
    expect(toPeriodIso(new Date("nope"))).toBe("");
  });
});

describe("toPeriodKey & toPeriodIso", () => {
  test("December 31 keeps its own period", () => {
    expect(toPeriodKey("2025-12-31")).toBe("2025-12");
    expect(toPeriodIso("2025-12-31")).toBe("2025-12-01T00:00:00.000Z");
  });

  test("January 1 rolls to the new year", () => {
    expect(toPeriodKey(new Date(2026, 0, 1))).toBe("2026-01");
  });
});

describe("Web P3K Catalog Tipe A, B, C", () => {
  test("Lantai 2 detects as Tipe A and Lantai 3 detects as Tipe B", () => {
    expect(detectP3kBoxType("Lantai 2 (Kotak Tipe A)")).toBe("A");
    expect(detectP3kBoxType("Lantai 3 (Kotak Tipe B)")).toBe("B");
    expect(detectP3kBoxType("Kotak C")).toBe("C");
  });

  test("Tipe A, B, C quantities match Permenakertrans table", () => {
    const a = getStandardP3kItemsForType("A");
    const b = getStandardP3kItemsForType("B");
    const c = getStandardP3kItemsForType("C");
    expect(a.length).toBe(21);
    expect(b.length).toBe(21);
    expect(c.length).toBe(21);
    expect([a[0].standardQty, b[0].standardQty, c[0].standardQty]).toEqual([20, 40, 40]);
    expect([a[9].standardQty, b[9].standardQty, c[9].standardQty]).toEqual([2, 3, 4]);
    expect([a[10].standardQty, b[10].standardQty, c[10].standardQty]).toEqual([2, 4, 6]);
  });

  test("matchP3kCatalogItem resolves aliases", () => {
    expect(matchP3kCatalogItem("Aquades (100 ml lar. Saline)")?.id).toBe(16);
    expect(matchP3kCatalogItem("Povidon Iodin (60ml)")?.id).toBe(17);
  });
});
