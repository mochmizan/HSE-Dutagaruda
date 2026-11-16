/// <reference types="bun-types" />
import { describe, expect, test } from "bun:test";
import { firstOfMonth, formatIndonesianDate, formatIndonesianMonthYear, toPeriodIso, toPeriodKey } from "./dates.js";
import { detectP3kBoxType, getStandardP3kItemsForType, matchP3kCatalogItem } from "./p3kCatalog.js";

describe("firstOfMonth", () => {
  test("January period becomes the first day of January", () => {
    expect(firstOfMonth("2026-01")).toBe("2026-01-01");
  });

  test("December period becomes the first day of December", () => {
    expect(firstOfMonth("2026-12")).toBe("2026-12-01");
  });
});

describe("toPeriodKey & toPeriodIso", () => {
  test("last day of December from a date string", () => {
    expect(toPeriodKey("2025-12-31")).toBe("2025-12");
  });

  test("first day of January from a date string", () => {
    expect(toPeriodKey("2026-01-01")).toBe("2026-01");
  });

  test("December to January crosses the year boundary", () => {
    expect(toPeriodKey(new Date(2025, 11, 31))).toBe("2025-12");
    expect(toPeriodKey(new Date(2026, 0, 1))).toBe("2026-01");
  });

  test("a Date input and an equivalent date string agree", () => {
    expect(toPeriodKey(new Date(2026, 8, 15))).toBe("2026-09");
    expect(toPeriodKey("2026-09-15")).toBe("2026-09");
  });

  test("single-digit months are zero padded", () => {
    expect(toPeriodKey("2026-03-05")).toBe("2026-03");
  });

  test("an invalid date string returns an empty period key and empty ISO", () => {
    expect(toPeriodKey("bukan-tanggal")).toBe("");
    expect(toPeriodIso("bukan-tanggal")).toBe("");
    expect(formatIndonesianDate("bukan-tanggal")).toBe("");
    expect(formatIndonesianMonthYear("bukan-tanggal")).toBe("");
  });

  test("valid date string formats toPeriodIso to first of month UTC", () => {
    expect(toPeriodIso("2026-11-16")).toBe("2026-11-01T00:00:00.000Z");
  });
});

describe("P3K Box Types A, B, C (Permenakertrans 15/2008)", () => {
  test("detectP3kBoxType maps Lantai 2 to A, Lantai 3 to B, and Tipe C to C", () => {
    expect(detectP3kBoxType("Lantai 2 (Kotak Tipe A)")).toBe("A");
    expect(detectP3kBoxType("Lantai 3 (Kotak Tipe B)")).toBe("B");
    expect(detectP3kBoxType("Kotak Tipe C")).toBe("C");
    expect(detectP3kBoxType("Kantor Pusat")).toBe("A");
  });

  test("getStandardP3kItemsForType returns exact Permenaker quantities for A, B, and C", () => {
    const itemsA = getStandardP3kItemsForType("A");
    const itemsB = getStandardP3kItemsForType("B");
    const itemsC = getStandardP3kItemsForType("C");

    // 1. Kasa steril terbungkus: 20, 40, 40
    expect(itemsA[0].standardQty).toBe(20);
    expect(itemsB[0].standardQty).toBe(40);
    expect(itemsC[0].standardQty).toBe(40);

    // 2. Perban (lebar 5 cm): 2, 4, 6
    expect(itemsA[1].standardQty).toBe(2);
    expect(itemsB[1].standardQty).toBe(4);
    expect(itemsC[1].standardQty).toBe(6);

    // 5. Plester cepat: 10, 15, 20
    expect(itemsA[4].standardQty).toBe(10);
    expect(itemsB[4].standardQty).toBe(15);
    expect(itemsC[4].standardQty).toBe(20);

    // 14. Gelas untuk cuci mata: 1, 2, 3
    expect(itemsA[13].standardQty).toBe(1);
    expect(itemsB[13].standardQty).toBe(2);
    expect(itemsC[13].standardQty).toBe(3);
  });

  test("matchP3kCatalogItem matches both DB names and Permenaker display names", () => {
    expect(matchP3kCatalogItem("NaCl")?.id).toBe(16);
    expect(matchP3kCatalogItem("Aquades (100 ml lar. Saline)")?.id).toBe(16);
    expect(matchP3kCatalogItem("Povidone")?.id).toBe(17);
    expect(matchP3kCatalogItem("Povidon Iodin (60ml)")?.id).toBe(17);
  });
});
