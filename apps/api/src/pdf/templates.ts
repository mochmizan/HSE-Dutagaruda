import { formatIndonesianDate, formatIndonesianMonthYear } from "@viaannn/shared";
import { INTER_400_B64, INTER_700_B64 } from "./fonts.js";
import {
  KOP_BANNER_B64,
  KOP_BANNER_MIME,
  LOGO_DUTAGARUDA_B64,
  LOGO_ITJ_B64,
  LOGO_K3_B64,
} from "./logos.js";

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
* { box-sizing: border-box; print-color-adjust: exact !important; -webkit-print-color-adjust: exact !important; color-scheme: light only !important; }
body { margin:0; font-family:'Inter', Arial, Helvetica, sans-serif; font-size:8pt; line-height:1.45; color:#111827 !important; background:#fff !important; }
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
.p3k .doc-head { padding-bottom:4px; margin-bottom:6px; }
.p3k .doc-head h1 { font-size:11pt; }
.p3k .doc-head .std { font-size:6.8pt; margin-bottom:4px; }
.p3k .meta { font-size:7pt; }
.p3k table.grid { table-layout:fixed; font-size:6.8pt; }
.p3k table.grid th { font-size:6.5pt; padding:2px 2px; line-height:1.2; }
.p3k table.grid td { padding:1.5px 2px; line-height:1.25; }
.p3k .chip { font-size:6.5pt; padding:0 2px; margin:0; }
.p3k .sign { margin-top:8px; padding-top:5px; }
.p3k .sign td { font-size:7pt; }
.p3k .sign .space { height:36px; }
.p3k .foot { margin-top:5px; font-size:6.5pt; }
.p3k-paraf { margin-top:6px; }
.p3k-paraf th { text-transform:uppercase; }
.p3k-paraf-cell { height:26px; }
.foot { margin-top:10px; font-size:7pt; color:#6b7280; text-align:right; }
.empty { margin:10px 0; font-size:8pt; color:#6b7280; font-style:italic; }
.page-break { break-before:page; page-break-before:always; }
.catatan-manual { border:1px solid #9ca3af; border-radius:4px; padding:8px 10px; min-height:110px; }
.catatan-label { margin:0 0 6px 0; font-weight:700; font-size:8pt; }
.catatan-lines { display:flex; flex-direction:column; gap:16px; }
.catatan-lines span { display:block; border-bottom:1px dotted #9ca3af; height:0; }
/* Kertas hydrant: kop banner + judul tengah + tabel foto + kop tiga kolom. */
.hyd-kop { display:block; width:100%; max-height:64px; object-fit:contain; margin-bottom:6px; }
.hyd-judul { text-align:center; margin:6px 0 8px 0; }
.hyd-judul h1 { font-size:14pt; font-weight:700; margin:0; letter-spacing:0.02em; }
.hyd-judul p { font-size:10pt; font-weight:700; margin:2px 0 0 0; }
.hyd-meta { font-size:9pt; margin:2px 0; }
table.hyd-tabel td.hyd-foto { width:118px; height:62px; padding:2px; }
table.hyd-tabel td.hyd-foto img { max-width:114px; max-height:58px; object-fit:contain; }
.hyd-kop-tiga { display:table; width:100%; margin-bottom:6px; }
.hyd-kop-tiga > div { display:table-cell; vertical-align:middle; }
.hyd-kop-kiri { width:28%; font-size:8pt; font-weight:700; color:#0f766e; }
.hyd-kop-tengah { width:44%; text-align:center; font-size:12pt; font-weight:700; }
.hyd-kop-kanan { width:28%; text-align:right; font-size:7.5pt; font-weight:700; color:#1e3a8a; }
table.hyd-lap { table-layout:fixed; font-size:6.5pt; }
table.hyd-lap th, table.hyd-lap td { padding:2px 1px; line-height:1.25; }
table.hyd-lap th { font-size:6pt; }
.hyd-tanda { font-weight:700; font-size:8.5pt; }
/* Kertas APAR: kotak judul tengah + tabel tinta hitam tata-letak tetap. */
.apar-box { border:1px solid #111827; border-bottom:none; text-align:center; padding:6px 14px 8px; }
.apar-box h1 { font-size:14pt; font-weight:700; margin:0; letter-spacing:0.02em; }
.apar-box h2 { font-size:10.5pt; font-weight:700; margin:2px 0 6px 0; }
.apar-box .apar-meta { display:flex; justify-content:space-between; gap:8px; padding:0 20px; font-size:9pt; font-weight:500; }
table.apar { table-layout:fixed; border:1px solid #111827; }
table.apar th, table.apar td { border:1px solid #111827; }
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

const BULAN_PANJANG = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const BULAN_PENDEK = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

/** "2026-09-18T.." -> "18-Sep-26", gaya kolom Tanggal Pemeriksaan di kertas. */
export function formatTanggalSingkat(iso: string): string {
  const m = iso.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return "";
  const bulan = BULAN_PENDEK[Number(m[2]) - 1] ?? "";
  return `${Number(m[3])}-${bulan}-${m[1].slice(2)}`;
}

/** Tanggal-tanggal unik gaya kertas: "16 dan 18 September 2026". */
export function formatDaftarTanggal(isoList: string[], periodKey: string): string {
  const hari = [
    ...new Set(
      isoList
        .map((s) => {
          const m = s.match(/\d{4}-\d{2}-(\d{2})/);
          return m ? Number(m[1]) : NaN;
        })
        .filter((n) => Number.isFinite(n)),
    ),
  ].sort((a, b) => a - b);
  const pm = periodKey.match(/(\d{4})-(\d{2})/);
  const label = pm ? `${BULAN_PANJANG[Number(pm[2]) - 1] ?? ""} ${pm[1]}` : "";
  if (hari.length === 0) return label;
  if (hari.length === 1) return `${hari[0]} ${label}`.trim();
  return `${hari.slice(0, -1).join(", ")} dan ${hari[hari.length - 1]} ${label}`.trim();
}

/** Status akhir -> kalimat kolom Status Penggunaan (ejaan K3 baku). */
export function statusPenggunaan(status: Status): string {
  if (status === "LAYAK") return "Layak digunakan";
  if (status === "LAYAK_DENGAN_CATATAN") return "Layak digunakan dengan catatan";
  return "Tidak layak digunakan";
}

/** Daftar kode gaya kertas: "APAR 1", "APAR 1 dan APAR 2", "APAR 1, APAR 2, dan APAR 3". */
export function formatDaftarKode(kodes: string[]): string {
  if (kodes.length === 0) return "–";
  if (kodes.length === 1) return kodes[0];
  if (kodes.length === 2) return `${kodes[0]} dan ${kodes[1]}`;
  return `${kodes.slice(0, -1).join(", ")}, dan ${kodes[kodes.length - 1]}`;
}

function kopBanner(): string {
  return `<img class="hyd-kop" src="data:${KOP_BANNER_MIME};base64,${KOP_BANNER_B64}" alt="JPM Dukuh Atas">`;
}

function selFoto(src: string | null): string {
  return src ? `<img src="${esc(src)}" alt="Dokumentasi hydrant">` : "";
}

export interface HydrantMonthlyData {
  siteName: string;
  periodKey: string;
  rows: {
    kode: string;
    zoneName: string;
    overallStatus: Status;
    createdAt: string;
    buktiSrc: string | null;
    checklistSrc: string | null;
  }[];
  photos: HydrantPhotoView[];
}

export function hydrantMonthly(data: HydrantMonthlyData): string {
  const periode = formatIndonesianMonthYear(`${data.periodKey}-01`);
  const tanggal = formatDaftarTanggal(
    data.rows.map((r) => r.createdAt),
    data.periodKey,
  );
  const rows = data.rows
    .map(
      (r, i) => `<tr>
  <td class="num">${i + 1}</td><td class="left">${esc(r.zoneName)}</td><td class="left"><strong>${esc(r.kode)}</strong></td>
  <td class="hyd-foto">${selFoto(r.buktiSrc)}</td>
  <td class="hyd-foto">${selFoto(r.checklistSrc)}</td>
  <td class="left">${esc(statusPenggunaan(r.overallStatus))}</td>
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
    title: `Checklist Bulanan Hydrant ${data.periodKey}`,
    body: `${kopBanner()}
<div class="hyd-judul"><h1>CHECKLIST BULANAN HYDRANT</h1><p>${esc(data.siteName.toUpperCase() || "-")}</p></div>
<p class="hyd-meta"><strong>Periode : ${esc(periode)}</strong></p>
<p class="hyd-meta"><strong>Tanggal : ${esc(tanggal)}</strong></p>
<h2 class="sec">A. Laporan hasil Inspeksi Hydrant</h2>
<table class="grid hyd-tabel">
  <thead><tr><th style="width:26px">No</th><th style="width:110px">Zona</th><th style="width:80px">Kode Hydrant</th><th>Dokumentasi Pemeriksaan</th><th>Dokumentasi Checklist</th><th style="width:120px">Status Penggunaan</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
<section>
  <h2 class="sec">B. Catatan Hasil temuan</h2>
  ${photoGrid}
</section>
<p class="foot num">Dokumen dihasilkan sistem – ${esc(formatIndonesianDate(new Date()))} · ${data.rows.length} unit</p>`,
  });
}

export interface HydrantLaporanData {
  siteName: string;
  periodKey: string;
  rows: {
    kode: string;
    components: Record<string, Status>;
    createdAt: string;
    notes: string | null;
  }[];
}

export const PETUGAS_HYDRANT = "Pengawas K3";

const HYD_LAPORAN_COMPONENTS = [
  ["boxHydrant", "Box Hydrant"],
  ["fireHose", "Fire Hose"],
  ["hoseCoupling", "Hose Coupling"],
  ["hoseRack", "Hose Rack"],
  ["nozzle", "Nozzle"],
  ["valvePillar", "Valve / Pillar Hydrant"],
] as const;

function tandaLaporan(status: Status | undefined, kolom: "standar" | "bawah"): string {
  if (kolom === "standar") return status === "LAYAK" ? "✓" : "";
  if (status === "TIDAK_LAYAK") return "X";
  if (status === "HILANG") return "-";
  return "";
}

export function hydrantLaporan(data: HydrantLaporanData): string {
  const pm = data.periodKey.match(/(\d{4})-(\d{2})/);
  const tahun = pm ? pm[1] : data.periodKey;
  const bulan = pm ? BULAN_PANJANG[Number(pm[2]) - 1] ?? "" : "";
  const baris = data.rows
    .map(
      (r, i) =>
        `<tr><td class="num">${i + 1}</td><td class="left"><strong>${esc(r.kode)}</strong></td>` +
        HYD_LAPORAN_COMPONENTS.map(
          ([k]) =>
            `<td class="hyd-tanda">${tandaLaporan(r.components[k], "standar")}</td>` +
            `<td class="hyd-tanda">${tandaLaporan(r.components[k], "bawah")}</td>`,
        ).join("") +
        `<td class="num">${esc(formatTanggalSingkat(r.createdAt))}</td>` +
        `<td class="left">${esc(PETUGAS_HYDRANT)}</td>` +
        `<td class="note">${esc(r.notes ?? "–")}</td></tr>`,
    )
    .join("\n");
  return shell({
    title: `Laporan Pemeriksaan Hydrant ${data.periodKey}`,
    landscape: true,
    body: `<div class="hyd-kop-tiga"><div class="hyd-kop-kiri"><img src="${LOGO_DUTAGARUDA_B64}" style="height:28px;vertical-align:middle;margin-right:6px" alt="Dutagaruda">dutagaruda piranti prima</div><div class="hyd-kop-tengah">LAPORAN PEMERIKSAAN HYDRANT</div><div class="hyd-kop-kanan"><img src="${LOGO_ITJ_B64}" style="height:28px;vertical-align:middle;margin-right:6px" alt="ITJ">INTEGRASI TRANSIT JAKARTA</div></div>
<dl class="meta">
<div><dt>Tahun Pemeriksaan</dt><dd><span class="num">${esc(tahun)}</span> | <strong>Bulan :</strong> ${esc(bulan)}</dd></div>
<div><dt>Lokasi Pemeriksaan</dt><dd>ITJ ${esc(data.siteName.toUpperCase() || "-")}</dd></div>
<div><dt>Keterangan</dt><dd>Layak Digunakan (✓), Tidak Layak Digunakan (X), Hilang (-)</dd></div>
</dl>
<table class="grid hyd-lap">
  <thead>
    <tr><th rowspan="2" style="width:24px">No</th><th rowspan="2" style="width:64px">Kode Hydrant</th><th colspan="12">Item Alat</th><th rowspan="2" style="width:62px">Tanggal Pemeriksaan</th><th rowspan="2" style="width:70px">Petugas Pemeriksa</th><th rowspan="2">Keterangan</th></tr>
    <tr>${HYD_LAPORAN_COMPONENTS.map(([, label]) => `<th colspan="2">${esc(label)}</th>`).join("")}</tr>
    <tr><th></th><th></th>${HYD_LAPORAN_COMPONENTS.map(() => `<th>Standar</th><th>Dibawah Standar</th>`).join("")}<th></th><th></th><th></th></tr>
  </thead>
  <tbody>${baris}</tbody>
</table>
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
  const periode = formatIndonesianMonthYear(`${data.periodKey}-01`);
  const tanggalCetak = formatIndonesianDate(new Date());
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
  const kelompok = new Map<string, { iso: string; kode: string[] }>();
  for (const e of data.expiring) {
    const label = formatIndonesianDate(e.expiredDate);
    const g = kelompok.get(label) ?? { iso: e.expiredDate, kode: [] };
    if (e.expiredDate < g.iso) g.iso = e.expiredDate;
    g.kode.push(e.kode);
    kelompok.set(label, g);
  }
  const barisKadaluwarsa = [...kelompok.entries()]
    .sort((a, b) => (a[1].iso < b[1].iso ? -1 : a[1].iso > b[1].iso ? 1 : 0))
    .map(
      ([label, g], i) =>
        `<tr><td class="num">${i + 1}</td><td class="num">${esc(label)}</td><td class="num">${g.kode.length}</td><td class="num">${esc(formatDaftarKode(g.kode))}</td></tr>`,
    )
    .join("\n");
  const kadaluwarsa =
    data.expiring.length === 0
      ? `<p class="empty">Tidak ada unit APAR yang mendekati kedaluwarsa.</p>`
      : `<table class="grid apar">
  <thead><tr><th style="width:30px">No</th><th style="width:150px">Periode Kadaluwarsa</th><th style="width:80px">Total APAR</th><th>No APAR</th></tr></thead>
  <tbody>${barisKadaluwarsa}</tbody>
</table>`;
  return shell({
    title: `Checklist Bulanan APAR ${data.periodKey}`,
    body: `${kopBanner()}
<div class="apar-box"><h1>CHECKLIST BULANAN APAR</h1><h2>${esc(data.siteName.toUpperCase() || "-")}</h2><div class="apar-meta"><span>Periode : ${esc(periode)}</span><span>Tanggal Cetak : <span class="num">${esc(tanggalCetak)}</span></span></div></div>
<table class="grid apar">
  <thead><tr><th style="width:26px">No</th><th style="width:70px">Kode APAR</th><th style="width:110px">Zona / Jenis</th><th>Verifikasi 7 Komponen</th><th style="width:80px">Status</th><th style="width:150px">Catatan / Tindak Lanjut</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
<div class="page-break"></div>
<h2 class="sec">B. Kadaluwarsa APAR</h2>
${kadaluwarsa}
<h2 class="sec">C. Catatan Tambahan</h2>
<div class="catatan-manual">
  <p class="catatan-label">Catatan :</p>
  <div class="catatan-lines"><span></span><span></span><span></span><span></span></div>
</div>
${signatures()}
<p class="foot num">Dokumen dihasilkan sistem – ${esc(tanggalCetak)} · ${data.rows.length} unit</p>`,
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
    if (s === "NA") return `<span class="chip idle">NA</span>`;
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
    body: `<div style="max-width:158mm;margin:0 auto;border:1.5px solid #111827;padding:8px">
<table class="grid" style="margin-bottom:6px">
  <tr>
    <td style="width:24%;text-align:center"><img src="${LOGO_DUTAGARUDA_B64}" style="height:32px" alt="Dutagaruda"></td>
    <td style="width:58%;text-align:center;font-weight:700;font-size:11pt">CHECKLIST PEMERIKSAAN<br>ALAT PEMADAM API RINGAN (APAR)</td>
    <td style="width:18%;text-align:center"><img src="${LOGO_K3_B64}" style="height:34px" alt="K3"></td>
  </tr>
</table>
${head(
  "KARTU TAHUNAN PEMERIKSAAN APAR",
  "Sesuai Standar K3 & Permenakertrans No. 04/MEN/1980",
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
<p class="foot num">Dokumen dihasilkan sistem – ${esc(formatIndonesianDate(new Date()))}</p>
</div>`,
  });
}

export interface P3kYearlyData {
  boxName: string;
  siteName: string;
  tahun: number;
  items: { name: string; standardQty: number; perMonth: (Status | null)[] }[];
  inspectionDate?: string | null;
}

export function p3kYearly(data: P3kYearlyData): string {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const mark = (s: Status | null): string => {
    if (s === "STANDAR") return `<span class="chip ok">✓</span>`;
    if (s === "DIBAWAH_STANDAR") return `<span class="chip bad">✗</span>`;
    if (s === "KADALUARSA") return `<span class="chip bad">KD</span>`;
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
    body: `<div class="p3k">
<table class="grid" style="margin-bottom:6px">
  <tr>
    <td style="width:20%;text-align:center"><img src="${LOGO_DUTAGARUDA_B64}" style="height:30px" alt="Dutagaruda"></td>
    <td style="width:60%;text-align:center;font-weight:700;font-size:12pt">INSPEKSI KOTAK P3K</td>
    <td style="width:20%;text-align:center"><img src="${LOGO_K3_B64}" style="height:30px" alt="K3"></td>
  </tr>
</table>
${head(
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
<table class="grid p3k-paraf">
  <tbody>
    <tr>
      <th style="width:130px; text-align:left">TANGGAL INSPEKSI</th>
      <td class="left num">${esc(data.inspectionDate ? formatIndonesianDate(data.inspectionDate) : "…………………………")}</td>
    </tr>
    <tr>
      <th style="text-align:left">PARAF PETUGAS</th>
      <td class="left p3k-paraf-cell">…………………………</td>
    </tr>
  </tbody>
</table>
${signatures()}
<p class="foot num">Dokumen dihasilkan sistem – ${esc(formatIndonesianDate(new Date()))} · Tanda: ✓ standar · ✗ di bawah standar · KD kedaluwarsa</p></div>`,
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
    body: `<table class="grid" style="margin-bottom:10px">
  <tr>
    <td style="width:30%;text-align:center"><img src="${LOGO_DUTAGARUDA_B64}" style="height:36px" alt="Dutagaruda"></td>
    <td style="width:40%;text-align:center;font-weight:700;font-size:11pt">LAPORAN KEGIATAN<br>SAFETY PATROL<br>${esc(data.siteName)}<br><span class="num">${esc(formatIndonesianDate(data.patrolDate))}</span></td>
    <td style="width:30%;text-align:center"><img src="${LOGO_ITJ_B64}" style="height:38px" alt="ITJ"></td>
  </tr>
</table>
${head("LAPORAN KEGIATAN", "SAFETY PATROL", [
  metaRow("Lokasi", esc(data.siteName)),
  metaRow("Tanggal", `<span class="num">${esc(formatIndonesianDate(data.patrolDate))}</span>`),
])}
${grid}
${signatures()}
<p class="foot num">Dokumen dihasilkan sistem – ${esc(formatIndonesianDate(new Date()))} · ${data.findings.length} temuan foto</p>`,
  });
}
