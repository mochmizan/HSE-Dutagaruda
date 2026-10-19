/// <reference types="bun-types" />
import { describe, expect, test } from "bun:test";
import { petakanTemuanPatroli, petakanUmpanKeLaporan } from "./pemetaan-umpan";
import type { KonteksUmpan } from "./pemetaan-umpan";
import type {
  ApiAparUnit,
  ApiHydrantUnit,
  ApiInspeksiApar,
  ApiInspeksiHidran,
  ApiInspeksiP3k,
  ApiLaporanPatroli,
  ApiP3kBox,
  ApiTemuanPatroli,
  ApiUmpan,
} from "./klien";

// Pin perilaku umpan dashboard. `petakanUmpanKeLaporan` menggabungkan empat
// kategori jadi satu daftar laporan lintas situs, jadi kesalahan di sini tampil
// sebagai laporan hilang atau kategori tertukar di beranda.

const zona = (id: string) => (id === "z1" ? "Zona 1" : `Zona ${id}`);

const unitHidran = (over: Partial<ApiHydrantUnit> = {}): ApiHydrantUnit => ({
  id: "h1",
  companyId: "c1",
  siteId: "s1",
  zoneId: "z1",
  kode: "H-01",
  createdAt: "2026-01-01T00:00:00.000Z",
  ...over,
});

const unitApar = (over: Partial<ApiAparUnit> = {}): ApiAparUnit => ({
  id: "a1",
  companyId: "c1",
  siteId: "s1",
  zoneId: "z1",
  kode: "A-01",
  tahun: 2024,
  jenis: "CO2",
  ukuran: "5 kg",
  expiredDate: "2027-01-31",
  createdAt: "2026-01-01T00:00:00.000Z",
  ...over,
});

const kotakP3k = (over: Partial<ApiP3kBox> = {}): ApiP3kBox => ({
  id: "p1",
  companyId: "c1",
  siteId: "s1",
  name: "Kotak P3K Utama",
  createdAt: "2026-01-01T00:00:00.000Z",
  ...over,
});

const ctx = (over: Partial<KonteksUmpan> = {}): KonteksUmpan => ({
  zonaNama: zona,
  unitHidran: new Map([["h1", unitHidran()]]),
  unitApar: new Map([["a1", unitApar()]]),
  kotakP3k: new Map([["p1", kotakP3k()]]),
  ...over,
});

const umpanHidran = (
  over: Partial<ApiInspeksiHidran> = {},
): ApiInspeksiHidran & { category: "hydrant" } => ({
  id: "r-h",
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
  createdAt: "2026-10-01T00:00:00.000Z",
  category: "hydrant",
  ...over,
});

const umpanApar = (
  over: Partial<ApiInspeksiApar> = {},
): ApiInspeksiApar & { category: "apar" } => ({
  id: "r-a",
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
  createdAt: "2026-10-01T00:00:00.000Z",
  category: "apar",
  ...over,
});

const umpanP3k = (over: Partial<ApiInspeksiP3k> = {}): ApiInspeksiP3k & { category: "p3k" } => ({
  id: "r-p",
  companyId: "c1",
  boxId: "p1",
  period: "2026-10-01",
  notes: null,
  inspectionDate: "2026-10-03",
  paraf: null,
  createdAt: "2026-10-03T00:00:00.000Z",
  category: "p3k",
  ...over,
});

const laporanPatroli = (over: Partial<ApiLaporanPatroli> = {}): ApiLaporanPatroli => ({
  id: "t1",
  companyId: "c1",
  siteId: "z1",
  patrolDate: "2026-10-04",
  inspectorUserId: "u1",
  createdAt: "2026-10-04T00:00:00.000Z",
  ...over,
});

const umpanPatroli = (
  over: Partial<ApiLaporanPatroli> = {},
): ApiLaporanPatroli & { category: "patroli" } => ({
  ...laporanPatroli(over),
  category: "patroli",
});

const umpan = (over: Partial<Omit<ApiUmpan, "month">> = {}): ApiUmpan => ({
  month: "2026-10",
  hydrant: [],
  apar: [],
  p3k: [],
  patroli: [],
  ...over,
});

describe("petakanUmpanKeLaporan", () => {
  test("umpan kosong menghasilkan daftar kosong", () => {
    expect(petakanUmpanKeLaporan(undefined, ctx())).toEqual([]);
  });

  test("urutan kategori tetap hidran, apar, p3k, patroli", () => {
    const hasil = petakanUmpanKeLaporan(
      umpan({
        hydrant: [umpanHidran()],
        apar: [umpanApar()],
        p3k: [umpanP3k()],
        patroli: [umpanPatroli()],
      }),
      ctx(),
    );
    expect(hasil.map((r) => r.category)).toEqual([
      "HYDRANT",
      "APAR",
      "P3K",
      "SAFETY_PATROL",
    ]);
  });

  test("unit tak dikenal memakai label cadangan, bukan melempar", () => {
    const [laporan] = petakanUmpanKeLaporan(
      umpan({ hydrant: [umpanHidran({ unitId: "tidak-ada" })] }),
      ctx(),
    );
    expect(laporan.zoneName).toBe("–");
    expect(laporan.assetCode).toBe("Hydrant");
  });

  test("kode aset diberi awalan kategori saat unit dikenal", () => {
    const [hidran, apar] = petakanUmpanKeLaporan(
      umpan({ hydrant: [umpanHidran()], apar: [umpanApar()] }),
      ctx(),
    );
    expect(hidran.assetCode).toBe("Hydrant H-01");
    expect(apar.assetCode).toBe("APAR A-01");
  });

  test("P3K memakai tanggal inspeksi bila ada, createdAt bila tidak", () => {
    const [denganTanggal] = petakanUmpanKeLaporan(
      umpan({ p3k: [umpanP3k({ inspectionDate: "2026-10-09" })] }),
      ctx(),
    );
    expect(denganTanggal.date).toBe("2026-10-09");

    const [tanpaTanggal] = petakanUmpanKeLaporan(
      umpan({ p3k: [umpanP3k({ inspectionDate: null })] }),
      ctx(),
    );
    expect(tanpaTanggal.date).toBe("2026-10-03T00:00:00.000Z");
  });

  test("patroli memakai patrolDate untuk period, bukan createdAt", () => {
    const [laporan] = petakanUmpanKeLaporan(
      umpan({
        patroli: [
          umpanPatroli({
            patrolDate: "2026-09-15",
            createdAt: "2026-10-01T00:00:00.000Z",
          }),
        ],
      }),
      ctx(),
    );
    expect(laporan.period).toBe("2026-09");
  });

  test("APAR memakai detail unit untuk jenis/ukuran/kedaluwarsa, bukan baris inspeksi", () => {
    const [laporan] = petakanUmpanKeLaporan(
      umpan({ apar: [umpanApar()] }),
      ctx(),
    );
    expect(laporan.aparDetails?.jenis).toBe("CO2");
    expect(laporan.aparDetails?.ukuran).toBe("5 kg");
    expect(laporan.aparDetails?.expiredDate).toBe("2027-01-31");
  });

  test("catatan kosong jadi undefined, bukan string kosong", () => {
    const [laporan] = petakanUmpanKeLaporan(
      umpan({ hydrant: [umpanHidran({ notes: null })] }),
      ctx(),
    );
    expect(laporan.summaryNotes).toBeUndefined();
  });

  test("catatan terisi dipakai apa adanya", () => {
    const [laporan] = petakanUmpanKeLaporan(
      umpan({ hydrant: [umpanHidran({ notes: "keran bocor" })] }),
      ctx(),
    );
    expect(laporan.summaryNotes).toBe("keran bocor");
  });
});

describe("petakanTemuanPatroli", () => {
  const temuan = (over: Partial<ApiTemuanPatroli> = {}): ApiTemuanPatroli => ({
    id: "f1",
    companyId: "c1",
    reportId: "t1",
    description: "Kabel terkelupas",
    s3Key: "real/foto.jpg",
    mime: "image/jpeg",
    bytes: 1024,
    sha256: "abc",
    locationNote: null,
    createdAt: "2026-10-07T00:00:00.000Z",
    ...over,
  });

  test("laporan tanpa findings tidak menghasilkan baris", () => {
    expect(petakanTemuanPatroli([laporanPatroli()])).toEqual([]);
  });

  test("temuan nyata memakai URL endpoint foto", () => {
    const [baris] = petakanTemuanPatroli([laporanPatroli({ findings: [temuan()] })]);
    expect(baris.photoUrl).toContain("/api/safety-patrol-reports/findings/f1/photo");
    expect(baris.caption).toBe("Kabel terkelupas");
  });

  test("kunci berawalan draft/ jadi placeholder kosong, bukan URL rusak", () => {
    const [baris] = petakanTemuanPatroli([
      laporanPatroli({ findings: [temuan({ s3Key: "draft/lama.jpg" })] }),
    ]);
    expect(baris.photoUrl).toBe("");
  });

  test("tanggal temuan mengikuti tanggal patroli induknya", () => {
    const [baris] = petakanTemuanPatroli([
      laporanPatroli({ patrolDate: "2026-10-07", findings: [temuan()] }),
    ]);
    expect(baris.tanggal).toBe("2026-10-07");
  });

  test("findings dari beberapa laporan diratakan berurutan", () => {
    const hasil = petakanTemuanPatroli([
      laporanPatroli({ id: "t1", findings: [temuan({ id: "f1" }), temuan({ id: "f2" })] }),
      laporanPatroli({ id: "t2", findings: [temuan({ id: "f3" })] }),
    ]);
    expect(hasil.map((h) => h.id)).toEqual(["f1", "f2", "f3"]);
  });
});
