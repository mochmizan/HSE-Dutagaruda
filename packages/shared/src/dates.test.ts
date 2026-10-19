/// <reference types="bun-types" />
import { describe, expect, test } from "bun:test";
import { firstOfMonth, toPeriodKey } from "./dates.js";

describe("firstOfMonth", () => {
  test("January period becomes the first day of January", () => {
    expect(firstOfMonth("2026-01")).toBe("2026-01-01");
  });

  test("December period becomes the first day of December", () => {
    expect(firstOfMonth("2026-12")).toBe("2026-12-01");
  });
});

describe("toPeriodKey", () => {
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

  test("an invalid date string returns an empty period key", () => {
    expect(toPeriodKey("bukan-tanggal")).toBe("");
  });
});
