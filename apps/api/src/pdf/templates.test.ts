/// <reference types="bun-types" />
import { describe, expect, test } from "bun:test";
import { aparMonthly, esc, hydrantMonthly, p3kYearly } from "./templates.js";

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
          components: {
            boxHydrant: "LAYAK",
            fireHose: "HILANG",
            hoseCoupling: "LAYAK",
            hoseRack: "LAYAK",
            nozzle: "LAYAK",
            valvePillar: "LAYAK",
          },
          overallStatus: "TIDAK_LAYAK",
          notes: "Selang hilang",
        },
      ],
      photos: [],
    });

  test("renders the Indonesian period and the site name", () => {
    const html = report("Gedung Utama");
    expect(html).toContain("September 2026");
    expect(html).toContain("(2026-09)");
    expect(html).toContain("Gedung Utama");
  });

  test("renders the overall badge for a failing unit", () => {
    expect(report("Gedung Utama")).toContain('<span class="badge tidak">TIDAK LAYAK</span>');
  });

  test("marks a HILANG component and never emits a raw script tag from user text", () => {
    const html = report(`<script>alert(1)</script>`);
    expect(html).toContain("hilang");
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  test("states that no findings photos exist when the list is empty", () => {
    expect(report("Gedung Utama")).toContain("Tidak ada foto temuan pada periode ini.");
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
