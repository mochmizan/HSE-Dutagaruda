#!/usr/bin/env bun
// Probe baseline: muat awal web, latensi API, dan ekspor PDF.
// Dipakai sebelum dan sesudah perubahan supaya klaim punya pembanding.
//
//   bun scripts/bench/probe.ts [--json]
//
// Setiap angka dicetak dengan jumlah run dan rentang. Median dipakai, bukan mean,
// karena satu request dingin bisa menggeser mean jauh.

import { request } from "node:http";
import { brotliDecompressSync, gunzipSync, zstdDecompressSync } from "node:zlib";

const BASE = process.env.BENCH_BASE ?? "http://localhost:8080";
const ORIGIN = BASE;
const EMAIL = process.env.BENCH_EMAIL ?? "pengawas@contoh.id";
const PASSWORD = process.env.BENCH_PASSWORD ?? "Pengawas123";
const COMPANY = process.env.BENCH_COMPANY ?? "seed-perusahaan-1";
const RUNS = Number(process.env.BENCH_RUNS ?? 7);
const JSON_OUT = process.argv.includes("--json");

const jar = new Map();

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
  return { status: res.status, text, bytes: Buffer.byteLength(text) };
}

function ringkas(xs: number[]) {
  const s = [...xs].sort((a, b) => a - b);
  const med = s[Math.floor(s.length / 2)];
  return { med: Math.round(med * 10) / 10, min: Math.round(s[0] * 10) / 10, max: Math.round(s[s.length - 1] * 10) / 10, n: s.length };
}

/** Satu GET tanpa dekompresi otomatis, supaya byte di kabel bisa dihitung. */
function ambilMentah(path: string): Promise<{ encoding: string; kabel: number; body: Buffer }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const req = request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: "GET",
        headers: { "Accept-Encoding": "gzip, br, zstd" },
      },
      (res) => {
        let kabel = 0;
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => {
          kabel += c.length;
          chunks.push(c);
        });
        res.on("end", () =>
          resolve({
            encoding: (res.headers["content-encoding"] as string) ?? "(tidak ada)",
            kabel,
            body: Buffer.concat(chunks),
          }),
        );
      },
    );
    req.on("error", reject);
    req.end();
  });
}

function dekompres(r: { encoding: string; body: Buffer }): Buffer {
  try {
    if (r.encoding === "gzip") return gunzipSync(r.body);
    if (r.encoding === "br") return brotliDecompressSync(r.body);
    if (r.encoding === "zstd") return zstdDecompressSync(r.body);
  } catch {
    return r.body;
  }
  return r.body;
}

const ENDPOINTS: [string, string][] = [
  ["GET", "/api/health"],
  ["GET", "/api/sites"],
  ["GET", "/api/zones"],
  ["GET", "/api/hydrant-units"],
  ["GET", "/api/apar-units"],
  ["GET", "/api/hydrant-inspections"],
  ["GET", "/api/apar-inspections"],
  ["GET", "/api/safety-patrol-reports"],
  ["GET", "/api/dashboard/expiring-apar"],
];

async function probeApi() {
  const signin = await call("POST", "/api/auth/sign-in/email", { email: EMAIL, password: PASSWORD });
  if (signin.status !== 200) throw new Error(`masuk gagal ${signin.status}: ${signin.text.slice(0, 200)}`);
  const active = await call("POST", "/api/auth/organization/set-active", { organizationId: COMPANY });
  if (active.status !== 200) throw new Error(`set-active gagal ${active.status}`);

  const hasil = [];
  for (const [method, path] of ENDPOINTS) {
    const times: number[] = [];
    let last = { status: 0, bytes: 0 };
    let errors = 0;
    for (let i = 0; i < RUNS; i++) {
      const t0 = performance.now();
      const r = await call(method, path);
      times.push(performance.now() - t0);
      last = { status: r.status, bytes: r.bytes };
      if (r.status >= 400) errors++;
    }
    hasil.push({ path, status: last.status, bytes: last.bytes, errors, ...ringkas(times) });
  }
  return hasil;
}

async function probeAset() {
  // Byte di kabel harus diukur dengan http mentah. `fetch` membuka dekompresi
  // otomatis, jadi `arrayBuffer().byteLength` selalu ukuran mentah dan tidak
  // pernah bisa membuktikan kompresi bekerja. Versi pertama probe ini salah
  // karena itu, dan melaporkan 421 KB "dikirim" padahal kabelnya 123 KB.
  const html = await ambilMentah("/");
  const teks = dekompres(html).toString("utf8");
  const refs = [...teks.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1]);
  const rows = [];
  let totalKabel = 0;
  let totalMentah = 0;
  for (const ref of refs) {
    const t0 = performance.now();
    const r = await ambilMentah(ref);
    const mentah = dekompres(r).byteLength;
    totalKabel += r.kabel;
    totalMentah += mentah;
    rows.push({
      aset: ref.split("/").pop(),
      encoding: r.encoding,
      dikirim: r.kabel,
      mentah,
      ms: Math.round(performance.now() - t0),
    });
  }
  return { refs: rows, totalDikirim: totalKabel, totalMentah, html: { encoding: html.encoding, kabel: html.kabel } };
}

async function main() {
  const api = await probeApi();
  const aset = await probeAset();

  if (JSON_OUT) {
    console.log(JSON.stringify({ base: BASE, runs: RUNS, at: new Date().toISOString(), api, aset }, null, 2));
    return;
  }

  console.log(`\nAPI (${RUNS} run per endpoint, median ms)\n`);
  console.log("endpoint".padEnd(38) + "status".padStart(7) + "bytes".padStart(9) + "med".padStart(8) + "min".padStart(8) + "max".padStart(8));
  for (const r of api) {
    console.log(
      r.path.padEnd(38) + String(r.status).padStart(7) + String(r.bytes).padStart(9) +
      String(r.med).padStart(8) + String(r.min).padStart(8) + String(r.max).padStart(8),
    );
  }

  console.log(`\nMuat awal web\n`);
  console.log(`HTML: encoding=${aset.html.encoding}, ${aset.html.kabel} B\n`);
  console.log("aset".padEnd(30) + "encoding".padStart(12) + "dikirim".padStart(10) + "mentah".padStart(10) + "ms".padStart(7));
  for (const r of aset.refs) {
    console.log(
      r.aset.padEnd(30) + r.encoding.padStart(12) + String(r.dikirim).padStart(10) +
      String(r.mentah).padStart(10) + String(r.ms).padStart(7),
    );
  }
  console.log(`\nTotal di kabel: ${aset.totalDikirim.toLocaleString("id-ID")} B (${Math.round(aset.totalDikirim / 1024)} KB)`);
  console.log(`Total mentah:  ${aset.totalMentah.toLocaleString("id-ID")} B (${Math.round(aset.totalMentah / 1024)} KB)`);
  const hemat = aset.totalMentah - aset.totalDikirim;
  console.log(`Hemat:         ${hemat.toLocaleString("id-ID")} B (${Math.round((hemat / aset.totalMentah) * 100)}%)\n`);
}

await main();
