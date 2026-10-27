/// <reference types="bun-types" />
import { describe, expect, test } from "bun:test";
import { ukuranPeta } from "./petaTeks.js";

describe("ukuranPeta", () => {
  test("di bawah 1 KB memakai penanda kurang dari", () => {
    expect(ukuranPeta(512)).toBe("< 1 KB");
  });

  test("kilobyte dibulatkan tanpa desimal", () => {
    expect(ukuranPeta(1024)).toBe("1 KB");
    expect(ukuranPeta(842 * 1024)).toBe("842 KB");
  });

  test("megabyte memakai koma desimal Indonesia", () => {
    expect(ukuranPeta(1.4 * 1024 * 1024)).toBe("1,4 MB");
    expect(ukuranPeta(2 * 1024 * 1024)).toBe("2,0 MB");
  });

  test("nilai tidak masuk akal tidak merusak tampilan", () => {
    expect(ukuranPeta(Number.NaN)).toBe("< 1 KB");
    expect(ukuranPeta(Number.POSITIVE_INFINITY)).toBe("< 1 KB");
  });
});
