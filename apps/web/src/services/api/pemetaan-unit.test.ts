/// <reference types="bun-types" />
import { describe, expect, test } from "bun:test";
import { petakanKartuApar, petakanUnitApar, petakanUnitHidran } from "./pemetaan-unit";
import type { ApiAparUnit, ApiHydrantUnit, ApiInspeksiApar, ApiInspeksiHidran } from "./klien";

// Pin perilaku pemetaan unit. Fungsi-fungsi ini menerjemahkan baris API menjadi
// model yang dirender halaman, jadi perubahan diam-diam di sini tampil sebagai
// status/zona/kedaluwarsa yang salah tanpa error apa pun.

const zona = (id: string) => (id === "z1" ? "Zona 1" : `Zona ${id}`);

const unitHidran = (over: Partial<ApiHydrantUnit> = {}): ApiHydrantUnit => ({
  id: "h1",
  companyId: "c1",
  siteId: "s1",
  zoneId: "z1",
  kode: "H-01",
  sortOrder: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
  ...over,
});

const inspeksiHidran = (over: Partial<ApiInspeksiHidran> = {}): ApiInspeksiHidran => ({
  id: "ih1",
  companyId: "c1",
  unitId: "h1",
  period: "2026-10-01",
  boxHydrant: "LAYAK",
  fireHose: "LAYAK",
  hoseCoupling: "LAYAK",
  hoseRack: "LAYAK",
  nozzle: "LAYAK",
  valvePillar: "LAYAK",
  overallStatus: "LAYAK",
  overallOverridden: false,
  approvalStatus: "DISETUJUI",
  notes: null,
  createdAt: "2026-10-05T03:00:00.000Z",
  ...over,
});

const unitApar = (over: Partial<ApiAparUnit> = {}): ApiAparUnit => ({
  id: "a1",
  companyId: "c1",
  siteId: "s1",
  zoneId: "z1",
  kode: "A-01",
  tahun: 2024,
  jenis: "POWDER",
  ukuran: "3 kg",
  sortOrder: 0,
  expiredDate: "2026-10-31",
  createdAt: "2026-01-01T00:00:00.000Z",
  ...over,
});

const inspeksiApar = (over: Partial<ApiInspeksiApar> = {}): ApiInspeksiApar => ({
  id: "ia1",
  companyId: "c1",
  unitId: "a1",
  period: "2026-10-01",
  safetyPin: "BAIK",
  corong: "BAIK",
  segel: "BAIK",
  tekanan: "BAIK",
  tabung: "BAIK",
  selang: "BAIK",
  katupTuas: "BAIK",
  beratCo2Kg: null,
  overallStatus: "LAYAK",
  overallOverridden: false,
  approvalStatus: "DISETUJUI",
  notes: null,
  createdAt: "2026-10-05T03:00:00.000Z",
  ...over,
});

describe("petakanUnitHidran", () => {
  test("unit tanpa inspeksi bulan itu jadi BELUM_DIPERIKSA dengan hitungan nol", () => {
    const [item] = petakanUnitHidran([unitHidran()], [], zona, "2026-10");
    expect(item.status).toBe("BELUM_DIPERIKSA");
    expect(item.componentsCheckedCount).toBe(0);
    expect(item.componentsTotal).toBe(6);
    expect(item.scheduledDate).toBe("Bulan Ini");
    expect(item.draftDetails).toBeUndefined();
    expect(item.completedReport).toBeUndefined();
  });

  test("inspeksi DRAFT tetap SEDANG_BERJALAN, bukan SELESAI", () => {
    const [item] = petakanUnitHidran(
      [unitHidran()],
      [inspeksiHidran({ approvalStatus: "DRAFT" })],
      zona,
      "2026-10",
    );
    expect(item.status).toBe("SEDANG_BERJALAN");
    expect(item.componentsCheckedCount).toBe(6);
  });

  test("inspeksi DIAJUKAN dan DISETUJUI sama-sama SELESAI", () => {
    for (const approvalStatus of ["DIAJUKAN", "DIKETAHUI", "DISETUJUI"] as const) {
      const [item] = petakanUnitHidran(
        [unitHidran()],
        [inspeksiHidran({ approvalStatus })],
        zona,
        "2026-10",
      );
      expect(item.status).toBe("SELESAI");
    }
  });

  test("inspeksi bulan lain tidak bocor ke periode yang diminta", () => {
    const [item] = petakanUnitHidran(
      [unitHidran()],
      [inspeksiHidran({ period: "2026-09-01" })],
      zona,
      "2026-10",
    );
    expect(item.status).toBe("BELUM_DIPERIKSA");
    expect(item.period).toBe("2026-10");
  });

  test("zona diambil lewat resolver, bukan dari unit mentah", () => {
    const [item] = petakanUnitHidran(
      [unitHidran({ zoneId: "z1" })],
      [],
      zona,
      "2026-10",
    );
    expect(item.zoneName).toBe("Zona 1");
    expect(item.siteId).toBe("s1");
  });

  test("catatan kosong memakai ringkasan bawaan, catatan ada dipakai apa adanya", () => {
    const [kosong] = petakanUnitHidran([unitHidran()], [inspeksiHidran()], zona, "2026-10");
    expect(kosong.completedReport?.summaryNotes).toBe(
      "Pemeriksaan 6 komponen selesai dan diverifikasi.",
    );

    const [ada] = petakanUnitHidran(
      [unitHidran()],
      [inspeksiHidran({ notes: "keran macet" })],
      zona,
      "2026-10",
    );
    expect(ada.completedReport?.summaryNotes).toBe("keran macet");
    expect(ada.draftDetails?.notes).toBe("keran macet");
  });

  test("period laporan memakai kunci YYYY-MM, bukan ISO penuh", () => {
    const [item] = petakanUnitHidran([unitHidran()], [inspeksiHidran()], zona, "2026-10");
    expect(item.completedReport?.period).toBe("2026-10");
    expect(item.completedReport?.date).toBe("2026-10-05T03:00:00.000Z");
  });
});

describe("petakanUnitApar", () => {
  test("unit tanpa inspeksi: BELUM_DIPERIKSA, draftDetails kosong, jenis bawaan POWDER", () => {
    const [item] = petakanUnitApar([unitApar({ jenis: null, ukuran: null })], [], zona, "2026-10");
    expect(item.status).toBe("BELUM_DIPERIKSA");
    expect(item.componentsCheckedCount).toBe(0);
    expect(item.componentsTotal).toBe(7);
    expect(item.jenis).toBe("POWDER");
    expect(item.ukuran).toBe("");
    expect(item.draftDetails).toEqual({});
  });

  test("tahun null jadi 0, bukan undefined", () => {
    const [item] = petakanUnitApar([unitApar({ tahun: null })], [], zona, "2026-10");
    expect(item.tahunPembuatan).toBe(0);
  });

  test("inspeksi DRAFT tetap SEDANG_BERJALAN", () => {
    const [item] = petakanUnitApar(
      [unitApar()],
      [inspeksiApar({ approvalStatus: "DRAFT" })],
      zona,
      "2026-10",
    );
    expect(item.status).toBe("SEDANG_BERJALAN");
    expect(item.componentsCheckedCount).toBe(7);
  });

  test("berat CO2 hanya diisi untuk jenis CO2 dan hanya bila inspeksi punya nilainya", () => {
    const [co2] = petakanUnitApar(
      [unitApar({ jenis: "CO2" })],
      [inspeksiApar({ beratCo2Kg: 5 })],
      zona,
      "2026-10",
    );
    expect(co2.beratCo2Kg).toBe(5);

    const [co2TanpaNilai] = petakanUnitApar(
      [unitApar({ jenis: "CO2" })],
      [inspeksiApar({ beratCo2Kg: null })],
      zona,
      "2026-10",
    );
    expect(co2TanpaNilai.beratCo2Kg).toBeUndefined();

    const [powder] = petakanUnitApar(
      [unitApar({ jenis: "POWDER" })],
      [inspeksiApar({ beratCo2Kg: 5 })],
      zona,
      "2026-10",
    );
    expect(powder.beratCo2Kg).toBeUndefined();
  });

  test("ringkasan bawaan APAR menyebut 7 komponen", () => {
    const [item] = petakanUnitApar([unitApar()], [inspeksiApar()], zona, "2026-10");
    expect(item.completedReport?.summaryNotes).toBe(
      "Pemeriksaan 7 komponen selesai dan diverifikasi.",
    );
    expect(item.completedReport?.aparDetails?.jenis).toBe("POWDER");
    expect(item.completedReport?.aparDetails?.expiredDate).toBe("2026-10-31");
  });

  test("inspeksi bulan lain tidak bocor ke periode yang diminta", () => {
    const [item] = petakanUnitApar(
      [unitApar()],
      [inspeksiApar({ period: "2025-12-01" })],
      zona,
      "2026-10",
    );
    expect(item.status).toBe("BELUM_DIPERIKSA");
  });
});

describe("petakanKartuApar", () => {
  test("satu inspeksi mengisi satu sel bulan pada tahun yang benar", () => {
    const kartu = petakanKartuApar([unitApar({ kode: "A-01" })], [inspeksiApar()]);
    const sel = kartu["A-01"]["2026"]["10"];
    expect(sel.tanggal).toBe("2026-10-05");
    expect(sel.kondisi.safetyPin).toBe("✓");
    expect(sel.nama).toBe("Pengawas K3");
    expect(sel.paraf).toBe("");
  });

  test("sel tanpa inspeksi tetap kosong, bukan undefined", () => {
    const kartu = petakanKartuApar([unitApar({ kode: "A-01" })], []);
    expect(kartu["A-01"]).toEqual({});
  });

  test("status TIDAK_BAIK dan NA dipetakan ke X dan NA", () => {
    const kartu = petakanKartuApar(
      [unitApar({ kode: "A-01" })],
      [
        inspeksiApar({
          safetyPin: "TIDAK_BAIK",
          corong: "NA",
          segel: "BAIK",
          tekanan: "BAIK",
          tabung: "BAIK",
          selang: "BAIK",
          katupTuas: "BAIK",
        }),
      ],
    );
    const sel = kartu["A-01"]["2026"]["10"];
    expect(sel.kondisi.safetyPin).toBe("X");
    expect(sel.kondisi.corong).toBe("NA");
    expect(sel.kondisi.segel).toBe("✓");
  });

  test("tindakLanjut hanya ada bila catatan terisi", () => {
    const tanpa = petakanKartuApar([unitApar({ kode: "A-01" })], [inspeksiApar()]);
    expect("tindakLanjut" in tanpa["A-01"]["2026"]["10"]).toBe(false);

    const ada = petakanKartuApar(
      [unitApar({ kode: "A-01" })],
      [inspeksiApar({ notes: "isi ulang" })],
    );
    expect(ada["A-01"]["2026"]["10"].tindakLanjut).toBe("isi ulang");
  });

  test("unit lain tidak menerima sel milik unit pertama", () => {
    const kartu = petakanKartuApar(
      [unitApar({ id: "a1", kode: "A-01" }), unitApar({ id: "a2", kode: "A-02" })],
      [inspeksiApar({ unitId: "a1" })],
    );
    expect(kartu["A-01"]["2026"]["10"].tanggal).toBe("2026-10-05");
    expect(kartu["A-02"]).toEqual({});
  });

  test("beberapa inspeksi di tahun berbeda masuk ke grid tahun masing-masing", () => {
    const kartu = petakanKartuApar(
      [unitApar({ kode: "A-01" })],
      [
        inspeksiApar({ id: "ia1", period: "2025-12-01", createdAt: "2025-12-04T00:00:00.000Z" }),
        inspeksiApar({ id: "ia2", period: "2026-01-01", createdAt: "2026-01-09T00:00:00.000Z" }),
      ],
    );
    expect(kartu["A-01"]["2025"]["12"].tanggal).toBe("2025-12-04");
    expect(kartu["A-01"]["2026"]["01"].tanggal).toBe("2026-01-09");
  });

  test("dua inspeksi di bulan yang sama: yang terakhir diproses menang", () => {
    const kartu = petakanKartuApar(
      [unitApar({ kode: "A-01" })],
      [
        inspeksiApar({ id: "ia1", createdAt: "2026-10-01T00:00:00.000Z" }),
        inspeksiApar({ id: "ia2", createdAt: "2026-10-20T00:00:00.000Z" }),
      ],
    );
    expect(kartu["A-01"]["2026"]["10"].tanggal).toBe("2026-10-20");
  });
});
