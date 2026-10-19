/// <reference types="bun-types" />
import { describe, expect, test } from "bun:test";
import { formatIndonesianDate, toPeriodKey } from "./dates.js";

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
  });

  test("an invalid Date object returns an empty string instead of throwing", () => {
    expect(formatIndonesianDate(new Date("nope"))).toBe("");
  });
});

describe("toPeriodKey", () => {
  test("December 31 keeps its own period", () => {
    expect(toPeriodKey("2025-12-31")).toBe("2025-12");
  });

  test("January 1 rolls to the new year", () => {
    expect(toPeriodKey(new Date(2026, 0, 1))).toBe("2026-01");
  });
});
