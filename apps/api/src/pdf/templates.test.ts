/// <reference types="bun-types" />
import { describe, expect, test } from "bun:test";
import {
  aparMonthly,
  esc,
  formatDaftarTanggal,
  formatTanggalSingkat,
  hydrantLaporan,
  hydrantMonthly,
  p3kYearly,
  statusPenggunaan,
} from "./templates.js";

describe("esc", () => {
  test("escapes the four HTML metacharacters", () => {
    expect(esc(`<a href="x">&</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;");
  });

  test("leaves plain Indonesian text untouched", () => {
    expect(esc("Zona 1 – Lobby")).toBe("Zona 1 – Lobby");
  });
});

describe("hydrantMonthly", () => {
  const report = (siteName: string) =>
    hydrantMonthly({
      siteName,
      periodKey: "2026-09",
      rows: [
        {
          kode: "Hydrant 1",
          zoneName: "Zona 1",
          overallStatus: "TIDAK_LAYAK",
          createdAt: "2026-09-16T08:00:00.000Z",
          buktiSrc: "https://contoh.id/bukti.jpg",
          checklistSrc: null,
        },
      ],
      photos: [],
    });

  test("renders the Indonesian period and the uppercased site name", () => {
    const html = report("JPM Dukuh Atas");
    expect(html).toContain("September 2026");
    expect(html).toContain("JPM DUKUH ATAS");
  });

  test("renders the distinct inspection dates paper-style", () => {
    const html = report("Gedung Utama");
    expect(html).toContain("16 September 2026");
  });

  test("maps overall status to the paper wording with correct spelling", () => {
    expect(report("Gedung Utama")).toContain("Tidak layak digunakan");
    expect(statusPenggunaan("LAYAK")).toBe("Layak digunakan");
    expect(statusPenggunaan("LAYAK_DENGAN_CATATAN")).toBe("Layak digunakan dengan catatan");
  });

  test("never emits a raw script tag from user text", () => {
    const html = report(`<script>alert(1)</script>`);
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).not.toContain("<SCRIPT>ALERT(1)</SCRIPT>");
    expect(html).toContain("&lt;SCRIPT&gt;ALERT(1)&lt;/SCRIPT&gt;");
  });

  test("states that no findings photos exist when the list is empty", () => {
    expect(report("Gedung Utama")).toContain("Tidak ada foto temuan pada periode ini.");
  });

  test("formats the paper date list with Indonesian joins", () => {
    expect(formatDaftarTanggal(["2026-09-16T08:00:00Z", "2026-09-18T08:00:00Z"], "2026-09")).toBe(
      "16 dan 18 September 2026",
    );
    expect(
      formatDaftarTanggal(
        ["2026-09-16T08:00:00Z", "2026-09-17T08:00:00Z", "2026-09-18T08:00:00Z"],
        "2026-09",
      ),
    ).toBe("16, 17 dan 18 September 2026");
    expect(formatTanggalSingkat("2026-09-16T08:00:00.000Z")).toBe("16-Sep-26");
  });
});

describe("hydrantLaporan", () => {
  const laporan = () =>
    hydrantLaporan({
      siteName: "JPM Dukuh Atas",
      periodKey: "2026-09",
      rows: [
        {
          kode: "Hydrant 1",
          components: {
            boxHydrant: "LAYAK",
            fireHose: "HILANG",
            hoseCoupling: "TIDAK_LAYAK",
            hoseRack: "LAYAK",
            nozzle: "LAYAK",
            valvePillar: "LAYAK",
          },
          createdAt: "2026-09-16T08:00:00.000Z",
          notes: "Hose Coupling tidak ada",
        },
      ],
    });

  test("renders the paper header, meta rows and landscape orientation", () => {
    const html = laporan();
    expect(html).toContain("LAPORAN PEMERIKSAAN HYDRANT");
    expect(html).toContain("Tahun Pemeriksaan");
    expect(html).toContain("2026");
    expect(html).toContain("September");
    expect(html).toContain("ITJ JPM DUKUH ATAS");
    expect(html).toContain("Layak Digunakan (✓)");
    expect(html).toContain("size: A4 landscape");
  });

  test("marks components per the paper legend (✓ / X / -)", () => {
    const html = laporan();
    expect(html).toContain("Standar");
    expect(html).toContain("Dibawah Standar");
    expect(html).toContain("16-Sep-26");
    expect(html).toContain("Pengawas K3");
    expect(html).toContain("Hose Coupling tidak ada");
    expect(html).toContain('<td class="hyd-tanda">✓</td>');
    expect(html).toContain('<td class="hyd-tanda">X</td>');
    expect(html).toContain('<td class="hyd-tanda">-</td>');
  });
});

describe("aparMonthly", () => {
  const data = {
    siteName: "Gedung Utama",
    periodKey: "2026-09",
    rows: [
      {
        kode: "APAR 1",
        zoneName: "Zona 1",
        jenis: "POWDER",
        components: {
          safetyPin: "BAIK" as const,
          corong: "BAIK" as const,
          segel: "BAIK" as const,
          tekanan: "BAIK" as const,
          tabung: "BAIK" as const,
          selang: "BAIK" as const,
          katupTuas: "BAIK" as const,
        },
        overallStatus: "LAYAK" as const,
        notes: null,
      },
    ],
    expiring: [],
  };

  test("breaks the sheet into two pages after the component table", () => {
    const html = aparMonthly({ ...data, rows: [...data.rows] });
    expect(html).toContain('<div class="page-break"></div>');
    // Bagian B dan C harus berada sesudah pemisah halaman, bukan di halaman 1.
    const pisah = html.indexOf('<div class="page-break"></div>');
    expect(html.indexOf("B. Kadaluwarsa APAR")).toBeGreaterThan(pisah);
    expect(html.indexOf("C. Catatan Tambahan")).toBeGreaterThan(pisah);
  });

  test("leaves a ruled block for handwritten notes", () => {
    const html = aparMonthly({ ...data, rows: [...data.rows] });
    expect(html).toContain("Catatan :");
    expect(html).toContain("catatan-manual");
  });
});

describe("p3kYearly", () => {
  const kartu = (inspectionDate: string | null) =>
    p3kYearly({
      boxName: "Kotak P3K Utama",
      siteName: "Gedung Utama",
      tahun: 2026,
      inspectionDate,
      items: [
        {
          name: "Kasa Steril",
          standardQty: 10,
          perMonth: Array.from({ length: 12 }, () => null),
        },
      ],
    });

  test("prints the TANGGAL INSPEKSI and PARAF rows required by the paper form", () => {
    const html = kartu("2026-09-01");
    expect(html).toContain("TANGGAL INSPEKSI");
    expect(html).toContain("PARAF PETUGAS");
    expect(html).toContain("September 2026");
  });

  test("leaves the date line blank instead of inventing one", () => {
    const html = kartu(null);
    expect(html).toContain("TANGGAL INSPEKSI");
    expect(html).not.toContain("September 2026");
  });

  test("renders all twelve month columns", () => {
    const html = kartu("2026-09-01");
    for (const bulan of ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]) {
      expect(html).toContain(`>${bulan}</th>`);
    }
  });
});
