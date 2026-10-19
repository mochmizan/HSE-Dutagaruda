#!/usr/bin/env bun
// Probe ekspor PDF: ukuran berkas dan waktu dari POST sampai unduhan siap.
//
//   bun scripts/bench/pdf.ts [hydrant-monthly apar-monthly apar-card p3k-yearly patrol-report]
//
// Tanpa argumen, semua kategori dicoba. Kategori tanpa rekam di database
// dilewati dengan alasan, bukan dianggap gagal.
//
// Kenapa ukuran berkas ikut diukur: PDF Hydrant pernah 4,3 MB untuk satu
// halaman karena foto bukti fisik (3,7 MB) ikut tercetak ke Section B yang
// seharusnya hanya memuat foto temuan. Ukuran adalah bukti cacat itu hilang.

const BASE = process.env.BENCH_BASE ?? "http://localhost:8080";
const ORIGIN = BASE;
const EMAIL = process.env.BENCH_EMAIL ?? "pengawas@contoh.id";
const PASSWORD = process.env.BENCH_PASSWORD ?? "Pengawas123";
const COMPANY = process.env.BENCH_COMPANY ?? "seed-perusahaan-1";

const jar = new Map<string, string>();

function cookieHeader(): string {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

function storeCookies(res: Response): void {
  const get = res.headers.getSetCookie?.bind(res.headers);
  const lines = get ? get() : [res.headers.get("set-cookie")].filter((v): v is string => Boolean(v));
  for (const line of lines) {
    const pair = line.split(";")[0];
    const eq = pair.indexOf("=");
    if (eq > 0) jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
  }
}

async function call(method: string, path: string, body?: unknown) {
  const headers: Record<string, string> = { Origin: ORIGIN };
  if (jar.size > 0) headers.Cookie = cookieHeader();
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  storeCookies(res);
  const text = await res.text();
  return { status: res.status, text, json: () => JSON.parse(text) };
}

async function masuk() {
  const r = await call("POST", "/api/auth/sign-in/email", { email: EMAIL, password: PASSWORD });
  if (r.status !== 200) throw new Error(`masuk gagal ${r.status}: ${r.text.slice(0, 200)}`);
  const a = await call("POST", "/api/auth/organization/set-active", { organizationId: COMPANY });
  if (a.status !== 200) throw new Error(`set-active gagal ${a.status}: ${a.text.slice(0, 200)}`);
}

/** Satu rekam per kategori, dipilih dari daftar yang sudah ada. */
async function cariRef(category: string): Promise<string | null> {
  const sumber: Record<string, string> = {
    "hydrant-monthly": "/api/hydrant-inspections",
    "apar-monthly": "/api/apar-inspections",
    "apar-card": "/api/apar-inspections",
    "p3k-yearly": "/api/p3k-inspections",
    "patrol-report": "/api/safety-patrol-reports",
  };
  const path = sumber[category];
  if (!path) return null;
  const r = await call("GET", path);
  if (r.status !== 200) return null;
  const data = r.json() as { items?: { id: string }[] };
  return data.items?.[0]?.id ?? null;
}

async function unduh(url: string): Promise<{ bytes: number; ms: number; buf: Buffer }> {
  const t0 = performance.now();
  const res = await fetch(url.startsWith("http") ? url : `${BASE}${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return { bytes: buf.byteLength, ms: Math.round(performance.now() - t0), buf };
}

const SEMUA = ["hydrant-monthly", "apar-monthly", "apar-card", "p3k-yearly", "patrol-report"];
const diminta = process.argv.slice(2).filter((a) => !a.startsWith("-"));
const kategori = diminta.length > 0 ? diminta : SEMUA;
const simpanKe = process.env.BENCH_PDF_DIR ?? "";

await masuk();

console.log(`\nEkspor PDF (${BASE})\n`);
console.log("kategori".padEnd(18) + "rekam".padStart(8) + "status".padStart(9) + "render".padStart(9) + "unduh".padStart(8) + "ukuran".padStart(12));
let total = 0;
let ada = 0;
for (const cat of kategori) {
  const refId = await cariRef(cat);
  if (!refId) {
    console.log(cat.padEnd(18) + "-".padStart(8) + "lewati".padStart(9) + "  tidak ada rekam");
    continue;
  }
  const t0 = performance.now();
  const r = await call("POST", `/api/export/${cat}/${refId}`);
  const renderMs = Math.round(performance.now() - t0);
  if (r.status >= 400) {
    console.log(cat.padEnd(18) + refId.slice(0, 6).padStart(8) + String(r.status).padStart(9) + "  " + r.text.slice(0, 120));
    continue;
  }
  const { id } = r.json() as { id: string };
  const job = await call("GET", `/api/pdf-jobs/${id}`);
  const info = job.json() as { status: string; downloadUrl: string | null };
  if (!info.downloadUrl) {
    console.log(cat.padEnd(18) + refId.slice(0, 6).padStart(8) + info.status.padStart(9) + "  tanpa unduhan");
    continue;
  }
  const { bytes, ms, buf } = await unduh(info.downloadUrl);
  total += bytes;
  ada++;
  if (simpanKe) {
    await Bun.write(`${simpanKe}/${cat}.pdf`, buf);
  }
  console.log(
    cat.padEnd(18) + refId.slice(0, 6).padStart(8) + info.status.padStart(9) +
    `${renderMs} ms`.padStart(9) + `${ms} ms`.padStart(8) +
    `${(bytes / 1024).toFixed(0)} KB`.padStart(12),
  );
}
console.log(`\n${ada} PDF, total ${(total / 1024).toFixed(0)} KB\n`);
