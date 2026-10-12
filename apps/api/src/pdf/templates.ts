import { formatIndonesianDate, formatIndonesianMonthYear } from "@viaannn/shared";
import { INTER_400_B64, INTER_700_B64 } from "./fonts.js";

export function esc(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

interface ShellArgs {
  title: string;
  landscape?: boolean;
  body: string;
}

function shell(args: ShellArgs): string {
  const orient = args.landscape ? "landscape" : "portrait";
  const margin = args.landscape ? "10mm" : "12mm";
  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<title>${esc(args.title)}</title>
<style>
@font-face { font-family:'Inter'; font-style:normal; font-weight:400; src:url(data:font/woff2;base64,${INTER_400_B64}) format('woff2'); }
@font-face { font-family:'Inter'; font-style:normal; font-weight:700; src:url(data:font/woff2;base64,${INTER_700_B64}) format('woff2'); }
@page { size: A4 ${orient}; margin: ${margin}; }
* { box-sizing: border-box; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
body { margin:0; font-family:'Inter', Arial, Helvetica, sans-serif; font-size:8pt; line-height:1.45; color:#111827; background:#fff; }
.num { font-variant-numeric: tabular-nums; }
.doc-head { border-bottom:2px solid #111827; padding-bottom:8px; margin-bottom:10px; }
.doc-head h1 { font-size:13pt; font-weight:700; margin:0 0 2px 0; letter-spacing:0.01em; }
.doc-head .std { font-size:7.5pt; color:#4b5563; margin:0 0 6px 0; }
.meta { display:table; width:100%; font-size:8pt; }
.meta > div { display:table-row; }
.meta dt { display:table-cell; font-weight:700; white-space:nowrap; padding-right:8px; width:130px; }
.meta dd { display:table-cell; margin:0; }
h2.sec { font-size:9.5pt; font-weight:700; text-transform:uppercase; letter-spacing:0.04em; margin:14px 0 6px 0; padding-bottom:3px; border-bottom:1px solid #111827; }
table.grid { width:100%; border-collapse:collapse; font-size:7.5pt; }
table.grid th { background:#f3f4f6; font-weight:700; text-transform:uppercase; letter-spacing:0.03em; font-size:7pt; }
table.grid th, table.grid td { border:1px solid #9ca3af; padding:3px 5px; vertical-align:middle; text-align:center; }
table.grid td.left { text-align:left; }
tr { break-inside: avoid; page-break-inside: avoid; }
.chip { display:inline-block; border:1px solid #9ca3af; border-radius:3px; padding:0 3px; margin:1px 1px 1px 0; font-size:7pt; white-space:nowrap; }
.chip.ok { background:#ecfdf5; border-color:#10b981; color:#047857; font-weight:700; }
.chip.bad { background:#fef2f2; border-color:#ef4444; color:#b91c1c; font-weight:700; }
.chip.idle { background:#f9fafb; color:#6b7280; }
.badge { display:inline-block; border:1px solid #9ca3af; border-radius:3px; padding:1px 6px; font-size:7.5pt; font-weight:700; white-space:nowrap; }
.badge.layak { background:#ecfdf5; border-color:#10b981; color:#047857; }
.badge.tidak { background:#fef2f2; border-color:#ef4444; color:#b91c1c; }
.badge.catatan { background:#fffbeb; border-color:#f59e0b; color:#b45309; }
td.note { font-style:italic; text-align:left; }
.fgrid { width:100%; border-collapse:collapse; }
.fgrid td { width:50%; vertical-align:top; padding:6px; break-inside:avoid; page-break-inside:avoid; }
.photo { height:150px; border:1px solid #9ca3af; border-radius:4px; background:#e5e7eb; display:flex; align-items:center; justify-content:center; text-align:center; color:#374151; font-size:7.5pt; font-weight:700; overflow:hidden; }
.photo img { max-width:100%; max-height:100%; object-fit:contain; }
.fcap { margin:4px 0 0 0; text-align:center; font-size:8pt; }
.fcap .unit { font-weight:700; }
.fcap .date { color:#6b7280; font-size:7.5pt; }
.sign { margin-top:16px; padding-top:8px; border-top:1px solid #111827; break-inside:avoid; page-break-inside:avoid; }
.sign table { width:100%; border-collapse:collapse; }
.sign td { width:33.33%; text-align:center; vertical-align:top; font-size:8pt; }
.sign .role { font-weight:700; }
.sign .space { height:52px; }
.sign .name { font-weight:700; text-decoration:underline; }
.foot { margin-top:10px; font-size:7pt; color:#6b7280; text-align:right; }
.empty { margin:10px 0; font-size:8pt; color:#6b7280; font-style:italic; }
</style>
</head>
<body>
${args.body}
<div id="pdf-ready" data-status="ready"></div>
</body>
</html>`;
}

function metaRow(label: string, value: string): string {
  return `<div><dt>${esc(label)}</dt><dd>${value}</dd></div>`;
}

function signatures(): string {
  const cell = (role: string) =>
    `<td><span class="role">${esc(role)}</span><div class="space"></div><span class="name">( ............................ )</span></td>`;
  return `<footer class="sign"><table><tr>${cell("Dibuat Oleh (Petugas)")}${cell("Diketahui Oleh (Supervisor)")}${cell("Disetujui Oleh (Site Manager)")}</tr></table></footer>`;
}

function head(title: string, std: string, metaRows: string[]): string {
  return `<header class="doc-head"><h1>${esc(title)}</h1><p class="std">${esc(std)}</p><dl class="meta">${metaRows.join("")}</dl></header>`;
}

const HYD_COMPONENTS = [
  ["boxHydrant", "Box Hydrant"],
  ["fireHose", "Fire Hose"],
  ["hoseCoupling", "Hose Coupling"],
  ["hoseRack", "Hose Rack"],
  ["nozzle", "Nozzle"],
  ["valvePillar", "Valve/Pillar"],
] as const;

const APAR_COMPONENTS = [
  ["safetyPin", "Safety Pin"],
  ["corong", "Corong"],
  ["segel", "Segel"],
  ["tekanan", "Tekanan"],
  ["tabung", "Tabung"],
  ["selang", "Selang"],
  ["katupTuas", "Katup/Tuas"],
] as const;

type Status = string;

function chip(label: string, status: Status): string {
  if (status === "BAIK" || status === "LAYAK") return `<span class="chip ok">${esc(label)} ✓</span>`;
  if (status === "TIDAK_BAIK" || status === "TIDAK_LAYAK") return `<span class="chip bad">${esc(label)} ✗</span>`;
  if (status === "HILANG") return `<span class="chip bad">${esc(label)} hilang</span>`;
  return `<span class="chip idle">${esc(label)} •</span>`;
}

function overallBadge(status: Status): string {
  if (status === "LAYAK") return `<span class="badge layak">LAYAK</span>`;
  if (status === "LAYAK_DENGAN_CATATAN") return `<span class="badge catatan">LAYAK DENGAN CATATAN</span>`;
  return `<span class="badge tidak">TIDAK LAYAK</span>`;
}

export interface HydrantPhotoView {
  src: string | null;
  caption: string;
}

export interface HydrantMonthlyData {
  siteName: string;
  periodKey: string;
  rows: {
    kode: string;
    zoneName: string;
    components: Record<string, Status>;
    overallStatus: Status;
    notes: string | null;
  }[];
  photos: HydrantPhotoView[];
}

export function hydrantMonthly(data: HydrantMonthlyData): string {
  const rows = data.rows
    .map(
      (r, i) => `<tr>
  <td class="num">${i + 1}</td><td class="left"><strong>${esc(r.kode)}</strong></td><td class="left">${esc(r.zoneName)}</td>
  <td>${HYD_COMPONENTS.map(([k, label]) => chip(label, r.components[k] ?? "")).join("")}</td>
  <td>${overallBadge(r.overallStatus)}</td>
  <td class="note">${esc(r.notes ?? "–")}</td>
</tr>`,
    )
    .join("\n");
  const photoCells = data.photos
    .map(
      (p) => `<td>
  <div class="photo">${p.src ? `<img src="${esc(p.src)}" alt="Foto temuan">` : "FOTO TEMUAN<br>TIDAK TERSEDIA"}</div>
  <p class="fcap"><span class="unit">${esc(p.caption)}</span></p>
</td>`,
    )
    .join("");
  const photoGrid =
    data.photos.length === 0
      ? `<p class="empty">Tidak ada foto temuan pada periode ini.</p>`
      : `<table class="fgrid">${chunkCells(photoCells, 2)}</table>`;
  return shell({
    title: `Laporan Hydrant ${data.periodKey}`,
    body: `${head(
      "LEMBAR LAPORAN PEMERIKSAAN BERKALA HYDRANT GEDUNG",
      "Sesuai Standar K3, NFPA 25 & Permenakertrans No. 04/MEN/1980",
      [
        metaRow("Lokasi Fasilitas", esc(data.siteName)),
        metaRow("Periode Inspeksi", `<span class="num">${esc(formatIndonesianMonthYear(`${data.periodKey}-01`))} (${esc(data.periodKey)})</span>`),
        metaRow("Tanggal Cetak", `<span class="num">${esc(formatIndonesianDate(new Date()))}</span>`),
      ],
    )}
<h2 class="sec">A. Hasil Pemeriksaan Fisik Unit Hydrant</h2>
<table class="grid">
  <thead><tr><th style="width:26px">No.</th><th style="width:70px">Kode Unit</th><th style="width:110px">Lokasi &amp; Zona</th><th>Verifikasi 6 Komponen</th><th style="width:80px">Status Kelayakan</th><th style="width:150px">Catatan / Temuan</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
<section>
  <h2 class="sec">B. Catatan Hasil Temuan</h2>
  ${photoGrid}
</section>
${signatures()}
<p class="foot num">Dokumen dihasilkan sistem – ${esc(formatIndonesianDate(new Date()))} · ${data.rows.length} unit</p>`,
  });
}

function chunkCells(cells: string, perRow: number): string {
  const items = cells
    .split("</td>")
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .map((part) => `${part}</td>`);
  const rows: string[] = [];
  for (let i = 0; i < items.length; i += perRow) {
    rows.push(`<tr>${items.slice(i, i + perRow).join("")}</tr>`);
  }
  return rows.join("\n");
}

export interface AparMonthlyData {
  siteName: string;
  periodKey: string;
  rows: {
    kode: string;
    zoneName: string;
    jenis: string | null;
    components: Record<string, Status>;
    overallStatus: Status;
    notes: string | null;
  }[];
  expiring: { kode: string; jenis: string | null; ukuran: string | null; expiredDate: string }[];
}

export function aparMonthly(data: AparMonthlyData): string {
  const rows = data.rows
    .map(
      (r, i) => `<tr>
  <td class="num">${i + 1}</td><td class="left"><strong>${esc(r.kode)}</strong></td><td class="left">${esc(r.zoneName)}${r.jenis ? ` · ${esc(r.jenis)}` : ""}</td>
  <td>${APAR_COMPONENTS.map(([k, label]) => chip(label, r.components[k] ?? "")).join("")}</td>
  <td>${overallBadge(r.overallStatus)}</td>
  <td class="note">${esc(r.notes ?? "–")}</td>
</tr>`,
    )
    .join("\n");
  const expiring =
    data.expiring.length === 0
      ? `<p class="empty">Tidak ada unit APAR yang mendekati kedaluwarsa.</p>`
      : `<table class="grid">
  <thead><tr><th style="width:26px">No.</th><th style="width:80px">Kode</th><th style="width:80px">Jenis</th><th style="width:80px">Ukuran</th><th style="width:120px">Tanggal Kedaluwarsa</th></tr></thead>
  <tbody>${data.expiring
    .map(
      (e, i) =>
        `<tr><td class="num">${i + 1}</td><td class="left">${esc(e.kode)}</td><td>${esc(e.jenis ?? "–")}</td><td>${esc(e.ukuran ?? "–")}</td><td class="num">${esc(formatIndonesianDate(e.expiredDate))}</td></tr>`,
    )
    .join("")}</tbody>
</table>`;
  return shell({
    title: `Laporan APAR ${data.periodKey}`,
    body: `${head(
      "LEMBAR LAPORAN PEMERIKSAAN BERKALA APAR",
      "Sesuai Standar K3 & Permenakertrans No. 15/MEN/2008",
      [
        metaRow("Lokasi Fasilitas", esc(data.siteName)),
        metaRow("Periode Inspeksi", `<span class="num">${esc(formatIndonesianMonthYear(`${data.periodKey}-01`))} (${esc(data.periodKey)})</span>`),
        metaRow("Tanggal Cetak", `<span class="num">${esc(formatIndonesianDate(new Date()))}</span>`),
      ],
    )}
<h2 class="sec">A. Hasil Pemeriksaan 7 Komponen Unit APAR</h2>
<table class="grid">
  <thead><tr><th style="width:26px">No.</th><th style="width:70px">Kode</th><th style="width:110px">Zona / Jenis</th><th>Verifikasi 7 Komponen</th><th style="width:80px">Status</th><th style="width:150px">Catatan / Tindak Lanjut</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
<h2 class="sec">B. Kadaluwarsa APAR</h2>
${expiring}
${signatures()}
<p class="foot num">Dokumen dihasilkan sistem – ${esc(formatIndonesianDate(new Date()))} · ${data.rows.length} unit</p>`,
  });
}

export interface AparCardData {
  kode: string;
  siteName: string;
  zoneName: string;
  tahun: number | null;
  jenis: string | null;
  ukuran: string | null;
  expiredDate: string;
  months: (Record<string, Status> & { overallStatus: Status })[];
}

export function aparCard(data: AparCardData): string {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const mark = (s: Status | undefined): string => {
    if (s === "BAIK") return `<span class="chip ok">✓</span>`;
    if (s === "TIDAK_BAIK") return `<span class="chip bad">✗</span>`;
    if (s === "NA") return `<span class="chip idle">–</span>`;
    return `<span class="chip idle">·</span>`;
  };
  const body = data.months
    .map(
      (m, i) =>
        `<tr><td class="num">${monthNames[i]}</td>${APAR_COMPONENTS.map(([k]) => `<td>${mark(m[k])}</td>`).join("")}<td>${mark(m.overallStatus)}</td></tr>`,
    )
    .join("");
  return shell({
    title: `Kartu APAR ${data.kode} ${data.tahun ?? ""}`,
    body: `${head(
      "KARTU TAHUNAN PEMERIKSAAN APAR",
      "Sesuai Standar K3 & Permenakertrans No. 15/MEN/2008",
      [
        metaRow("Kode Unit", `<strong>${esc(data.kode)}</strong>`),
        metaRow("Lokasi", `${esc(data.siteName)} – ${esc(data.zoneName)}`),
        metaRow("Jenis / Ukuran", `${esc(data.jenis ?? "–")} / ${esc(data.ukuran ?? "–")}`),
        metaRow("Kedaluwarsa", `<span class="num">${esc(formatIndonesianDate(data.expiredDate))}</span>`),
        metaRow("Tahun", `<span class="num">${esc(String(data.tahun ?? new Date().getFullYear()))}</span>`),
      ],
    )}
<h2 class="sec">Hasil Pemeriksaan Bulanan</h2>
<table class="grid">
  <thead><tr><th style="width:44px">Bulan</th>${APAR_COMPONENTS.map(([, l]) => `<th>${esc(l)}</th>`).join("")}<th>Status</th></tr></thead>
  <tbody>${body}</tbody>
</table>
${signatures()}
<p class="foot num">Dokumen dihasilkan sistem – ${esc(formatIndonesianDate(new Date()))}</p>`,
  });
}

export interface P3kYearlyData {
  boxName: string;
  siteName: string;
  tahun: number;
  items: { name: string; standardQty: number; perMonth: (Status | null)[] }[];
}

export function p3kYearly(data: P3kYearlyData): string {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const mark = (s: Status | null): string => {
    if (s === "STANDAR") return `<span class="chip ok">✓</span>`;
    if (s === "DIBAWAH_STANDAR") return `<span class="chip bad">✗</span>`;
    if (s === "KADALUARSA") return `<span class="chip bad">K</span>`;
    return `<span class="chip idle">·</span>`;
  };
  const rows = data.items
    .map(
      (it, i) =>
        `<tr><td class="num">${i + 1}</td><td class="left">${esc(it.name)}</td><td class="num">${it.standardQty}</td>${it.perMonth.map((s) => `<td>${mark(s)}</td>`).join("")}</tr>`,
    )
    .join("");
  return shell({
    title: `Kartu P3K ${data.boxName} ${data.tahun}`,
    landscape: true,
    body: `${head(
      "KARTU TAHUNAN PEMERIKSAAN KOTAK P3K",
      "Sesuai Permenkes No. 48 Tahun 2016 tentang Standar Keselamatan Kesehatan Kerja",
      [
        metaRow("Nama Kotak", `<strong>${esc(data.boxName)}</strong>`),
        metaRow("Lokasi", esc(data.siteName)),
        metaRow("Tahun", `<span class="num">${data.tahun}</span>`),
      ],
    )}
<table class="grid">
  <thead><tr><th style="width:26px">No.</th><th style="text-align:left">Nama Barang</th><th style="width:52px">Standar</th>${monthNames.map((m) => `<th style="width:34px">${m}</th>`).join("")}</tr></thead>
  <tbody>${rows}</tbody>
</table>
${signatures()}
<p class="foot num">Dokumen dihasilkan sistem – ${esc(formatIndonesianDate(new Date()))} · Tanda: ✓ standar · ✗ di bawah standar · K kedaluwarsa</p>`,
  });
}

export interface PatrolReportData {
  siteName: string;
  patrolDate: string;
  findings: { src: string | null; caption: string }[];
}

export function patrolReport(data: PatrolReportData): string {
  const cells = data.findings
    .map(
      (f) => `<td>
  <div class="photo">${f.src ? `<img src="${esc(f.src)}" alt="Foto temuan">` : "FOTO TEMUAN<br>TIDAK TERSEDIA"}</div>
  <p class="fcap">${esc(f.caption)}<br><span class="date num">${esc(formatIndonesianDate(data.patrolDate))}</span></p>
</td>`,
    )
    .join("");
  const grid =
    data.findings.length === 0
      ? `<p class="empty">Tidak ada temuan pada laporan ini.</p>`
      : `<table class="fgrid">${chunkCells(cells, 2)}</table>`;
  return shell({
    title: `Laporan Safety Patrol ${data.patrolDate}`,
    body: `${head("LAPORAN KEGIATAN", "SAFETY PATROL", [
      metaRow("Lokasi", esc(data.siteName)),
      metaRow("Tanggal", `<span class="num">${esc(formatIndonesianDate(data.patrolDate))}</span>`),
    ])}
${grid}
${signatures()}
<p class="foot num">Dokumen dihasilkan sistem – ${esc(formatIndonesianDate(new Date()))} · ${data.findings.length} temuan foto</p>`,
  });
}
