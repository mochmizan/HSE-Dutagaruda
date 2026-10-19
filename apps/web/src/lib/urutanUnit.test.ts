/// <reference types="bun-types" />
import { describe, expect, test } from "bun:test";
import { susunUrutanBaru } from "./urutanUnit";

// Fungsi ini menentukan urutan yang dikirim ke server, dan server menolak
// daftar yang tidak lengkap. Salah menyusun berarti tombol panah tampak
// bekerja lalu urutannya kembali sendiri setelah data diambil ulang.

const semua = ["a", "b", "c", "d"];

describe("susunUrutanBaru", () => {
  test("naik menukar dengan tetangga di atasnya", () => {
    expect(susunUrutanBaru(semua, semua, "c", -1)).toEqual(["a", "c", "b", "d"]);
  });

  test("turun menukar dengan tetangga di bawahnya", () => {
    expect(susunUrutanBaru(semua, semua, "b", 1)).toEqual(["a", "c", "b", "d"]);
  });

  test("baris teratas tidak bisa naik", () => {
    expect(susunUrutanBaru(semua, semua, "a", -1)).toBeNull();
  });

  test("baris terbawah tidak bisa turun", () => {
    expect(susunUrutanBaru(semua, semua, "d", 1)).toBeNull();
  });

  test("id yang tidak ada di daftar tampil diabaikan", () => {
    expect(susunUrutanBaru(semua, semua, "zz", -1)).toBeNull();
  });

  test("daftar tetap lengkap dan tidak menggandakan id", () => {
    const hasil = susunUrutanBaru(semua, semua, "d", -1)!;
    expect(hasil).toHaveLength(semua.length);
    expect(new Set(hasil).size).toBe(semua.length);
    expect([...hasil].sort()).toEqual([...semua].sort());
  });

  test("tabel tersaring: tetangga dari daftar tampil, hasil tetap daftar penuh", () => {
    // Hanya b dan d yang terlihat; menaikkan d berarti menukar dengan b,
    // walaupun di daftar penuh ada c di antaranya.
    const tampil = ["b", "d"];
    const hasil = susunUrutanBaru(semua, tampil, "d", -1)!;
    expect(hasil).toHaveLength(semua.length);
    expect(new Set(hasil).size).toBe(semua.length);
    // d kini tepat sebelum b.
    expect(hasil.indexOf("d")).toBe(hasil.indexOf("b") - 1);
  });

  test("tabel tersaring: baris pertama yang terlihat tetap tidak bisa naik", () => {
    expect(susunUrutanBaru(semua, ["b", "d"], "b", -1)).toBeNull();
  });
});
