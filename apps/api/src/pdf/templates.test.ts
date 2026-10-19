/// <reference types="bun-types" />
import { describe, expect, test } from "bun:test";
import { esc, hydrantMonthly } from "./templates.js";

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
