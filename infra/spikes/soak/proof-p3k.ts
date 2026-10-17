import { STANDARD_P3K_ITEMS } from "../../../packages/shared/src/p3kCatalog.js";
import { p3kYearly } from "../../../apps/api/src/pdf/templates.js";

const GOTENBERG = process.env.GOTENBERG_URL ?? "http://localhost:3222";
const OUT = new URL("./out/p3k-api.pdf", import.meta.url);

const marks = ["STANDAR", "STANDAR", "STANDAR", "DIBAWAH_STANDAR", "KADALUARSA"] as const;
const items = STANDARD_P3K_ITEMS.map((cat, i) => ({
  name: cat.name,
  standardQty: cat.standardQty,
  perMonth: Array.from({ length: 12 }, (_, m) =>
    m < 9 ? marks[(i + m) % marks.length] : null,
  ),
}));

const html = p3kYearly({ boxName: "Kotak P3K HSE Room", siteName: "Central Warehouse Logistics", tahun: 2026, items });
await Bun.write(new URL("./out/p3k-api.html", import.meta.url), html);

const form = new FormData();
form.append("files", new Blob([html], { type: "text/html" }), "index.html");
form.append("paperWidth", "8.27in");
form.append("paperHeight", "11.69in");
form.append("marginTop", "10mm");
form.append("marginBottom", "10mm");
form.append("marginLeft", "10mm");
form.append("marginRight", "10mm");
form.append("landscape", "true");
form.append("printBackground", "true");
form.append("preferCssPageSize", "true");
form.append("waitForSelector", "#pdf-ready");
form.append("waitDelay", "300ms");
form.append("failOnResourceLoadingFailed", "true");

const res = await fetch(`${GOTENBERG}/forms/chromium/convert/html`, { method: "POST", body: form });
if (!res.ok) throw new Error(`Gotenberg ${res.status}: ${(await res.text()).slice(0, 200)}`);
const bytes = new Uint8Array(await res.arrayBuffer());
await Bun.write(OUT, bytes);
console.log(`pdf=${OUT.pathname} bytes=${bytes.length}`);
