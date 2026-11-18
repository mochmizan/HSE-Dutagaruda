/**
 * Kumpulan fungsi murni generator lembar cetak prosedural K3 (6 dokumen resmi):
 * 1. Checklist Bulanan APAR (`apar-monthly`, A4 Portrait)
 * 2. Kartu Tahunan Pemeriksaan APAR (`apar-card`, A4 Portrait hang-tag)
 * 3. Checklist Bulanan Hydrant (`hydrant-monthly`, A4 Portrait)
 * 4. Laporan Pemeriksaan Hydrant (`hydrant-laporan`, A4 Landscape)
 * 5. Inspeksi Kotak P3K Tahunan (`p3k-yearly`, A4 Landscape)
 * 6. Laporan Kegiatan Safety Patrol (`patrol-report`, A4 Portrait)
 *
 * Seluruh lembar diisolasi penuh dari mode gelap (`color-scheme: light only`,
 * latar `#ffffff !important`, teks `#000000 !important`) dan memakai logo
 * tersemat data-URI dari `printLogos.ts` sehingga nol ketergantungan jaringan.
 */

import type { PrintHeaderImageConfig } from './printHeaderConfig';
import {
  LOGO_DUTAGARUDA_B64,
  LOGO_ITJ_B64,
  LOGO_JPM_B64,
  LOGO_K3_B64,
  LOGO_PARTNERS_B64,
} from './printLogos';

export function escPrint(val: unknown): string {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const PROCEDURAL_PRINT_CSS = `
/* ============================================================================
   PROCEDURAL PRINT CSS FOR ALL 6 K3 DOCUMENTS (Browser Print & PDF Ready)
   Strict Light-Paper Isolation — Dark Mode Never Bleeds Into Print Sheets
   ============================================================================ */
* {
  box-sizing: border-box;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

.num {
  font-variant-numeric: tabular-nums;
}

.procedural-print-canvas,
.print-sheet-portrait,
.print-sheet-landscape {
  color-scheme: light only !important;
}

/* Portrait A4 Sheet */
.print-sheet-portrait {
  width: 210mm;
  min-height: 297mm;
  background: #ffffff !important;
  color: #000000 !important;
  font-family: Arial, Helvetica, 'Inter', sans-serif;
  padding: 8mm 12mm 10mm 12mm;
  margin: 0 auto 24px auto;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.06);
  position: relative;
  page-break-after: always;
  break-after: page;
}

/* Landscape A4 Sheet */
.print-sheet-landscape {
  width: 297mm;
  min-height: 210mm;
  background: #ffffff !important;
  color: #000000 !important;
  font-family: Tahoma, Arial, Helvetica, 'Inter', sans-serif;
  padding: 8mm 10mm;
  margin: 0 auto 24px auto;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.06);
  position: relative;
  page-break-after: always;
  break-after: page;
}

.print-sheet-portrait:last-of-type,
.print-sheet-landscape:last-of-type {
  page-break-after: auto;
  break-after: auto;
}

.print-sheet-portrait *,
.print-sheet-landscape * {
  color: #000000;
}

/* Vertical Rotated Text for Table Headers */
.v-text-wrap {
  height: 76px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.v-text {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  white-space: nowrap;
  text-align: center;
  line-height: 1.05;
  font-weight: 700;
  font-size: 7.5pt;
}

/* ============================================================================
   1. APAR MONTHLY (apar-monthly)
   ============================================================================ */
.kop-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px 6px 4px;
  min-height: 64px;
}
.kop-logo-left {
  height: 58px;
  width: auto;
  object-fit: contain;
  display: block;
}
.kop-logo-right {
  height: 52px;
  max-width: 430px;
  width: auto;
  object-fit: contain;
  display: block;
}
.title-box {
  border: 1px solid #111827 !important;
  border-bottom: none !important;
  padding: 6px 14px 8px 14px;
  text-align: center;
  background: #ffffff !important;
}
.title-box h1 {
  font-size: 30pt;
  font-weight: 600;
  letter-spacing: -0.01em;
  line-height: 1.12;
  margin: 0;
  color: #000000 !important;
}
.title-box h2 {
  font-size: 18pt;
  font-weight: 500;
  line-height: 1.25;
  margin: 2px 0 8px 0;
  color: #000000 !important;
}
.title-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 64px;
  font-size: 11.5pt;
  font-weight: 500;
  color: #000000 !important;
}
table.apar-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  border: 1px solid #111827 !important;
  background: #ffffff !important;
}
table.apar-table th,
table.apar-table td {
  border: 1px solid #111827 !important;
  text-align: center;
  vertical-align: middle;
  padding: 3px 4px;
  color: #000000 !important;
  background: #ffffff !important;
}
table.apar-table thead th {
  font-size: 10.5pt !important;
  font-weight: 500 !important;
  line-height: 1.2;
  padding: 5px 4px !important;
  background: #ffffff !important;
}
table.apar-table col.col-no         { width: 6.2%; }
table.apar-table col.col-zona       { width: 15.8%; }
table.apar-table col.col-kode       { width: 9.0%; }
table.apar-table col.col-expired    { width: 11.5%; }
table.apar-table col.col-kartu      { width: 19.5%; }
table.apar-table col.col-berat      { width: 17.5%; }
table.apar-table col.col-pengecekan { width: 20.5%; }
table.apar-table tbody tr           { height: 124px; }
table.apar-table.page-1-table tbody tr { height: 116px; }
.cell-no      { font-size: 11.5pt !important; font-weight: 600; }
.cell-zona    { font-size: 11.5pt !important; }
.cell-kode    { font-size: 11.5pt !important; }
.cell-expired { font-size: 11.5pt !important; line-height: 1.22; white-space: pre-line; }
.photo-cell-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  width: 100%;
  height: 100%;
  padding: 2px;
}
.doc-photo {
  max-width: 96px;
  max-height: 112px;
  width: auto;
  height: auto;
  object-fit: contain;
  display: block;
  margin: 0 auto;
}
.doc-photo-landscape {
  max-width: 110px;
  max-height: 90px;
}
.kadaluwarsa-section {
  margin-top: 12px;
  padding: 0 24px;
}
.kadaluwarsa-title {
  font-size: 11.5pt;
  font-weight: 500;
  margin: 0 0 6px 0;
  color: #000000 !important;
}
table.kadaluwarsa-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #111827 !important;
  background: #ffffff !important;
}
table.kadaluwarsa-table th,
table.kadaluwarsa-table td {
  border: 1px solid #111827 !important;
  padding: 5px 8px !important;
  font-size: 11pt !important;
  text-align: center;
  color: #000000 !important;
  background: #ffffff !important;
}
.catatan-sign-section {
  margin-top: 10px;
  padding: 0 24px;
}
.catatan-label {
  font-size: 11.5pt;
  font-weight: 500;
  margin: 0 0 12px 0;
  color: #000000 !important;
}
.catatan-text {
  font-size: 10.5pt;
  margin: -6px 0 12px 0;
  color: #111827 !important;
  white-space: pre-wrap;
}
table.sign-table {
  width: 100%;
  border-collapse: collapse;
  border: none !important;
}
table.sign-table td {
  width: 33.33%;
  border: none !important;
  vertical-align: top;
  text-align: left;
  padding: 0 8px 0 0 !important;
  font-size: 11pt !important;
  color: #000000 !important;
  background: transparent !important;
}
.sign-header { margin-bottom: 52px; }
.sign-name   { font-weight: 600; text-decoration: underline; text-underline-offset: 3px; }
.sign-role   { margin-top: 2px; }

/* ============================================================================
   2. APAR CARD (apar-card — matches form checklist apar.jpeg)
   ============================================================================ */
.apar-card-outer {
  max-width: 158mm;
  margin: 6mm auto 0 auto;
  border: 1.5px solid #111827 !important;
  padding: 0;
  background: #ffffff !important;
}
table.apar-card-head-table,
table.apar-card-meta-table,
table.apar-card-grid-table {
  width: 100%;
  border-collapse: collapse;
  background: #ffffff !important;
}
table.apar-card-head-table td {
  border: 1px solid #111827 !important;
  vertical-align: middle;
  padding: 6px 8px !important;
  background: #ffffff !important;
}
.apar-card-title {
  font-size: 12pt;
  font-weight: 700;
  text-align: center;
  line-height: 1.25;
  letter-spacing: 0.01em;
  color: #000000 !important;
}
table.apar-card-meta-table td {
  border: 1px solid #111827 !important;
  padding: 4px 8px !important;
  font-size: 9.5pt !important;
  height: 26px;
  color: #000000 !important;
  background: #ffffff !important;
}
table.apar-card-grid-table th,
table.apar-card-grid-table td {
  border: 1px solid #111827 !important;
  text-align: center;
  vertical-align: middle;
  padding: 3px 4px !important;
  font-size: 9.5pt !important;
  color: #000000 !important;
  background: #ffffff !important;
}
table.apar-card-grid-table thead th {
  font-weight: 700 !important;
  font-size: 8.5pt !important;
  background: #ffffff !important;
}
table.apar-card-grid-table tbody tr {
  height: 29px;
}
.apar-card-footer {
  border-top: 1px solid #111827 !important;
  padding: 10px 12px 14px 12px;
  font-size: 9pt;
  background: #ffffff !important;
  color: #000000 !important;
}
.apar-card-ket-table td {
  border: none !important;
  padding: 1px 10px 1px 0 !important;
  font-size: 8.8pt !important;
  text-align: left;
  background: transparent !important;
}
.apar-card-fill-dates {
  margin-top: 10px;
  font-size: 9pt;
}
.apar-card-fill-dates td {
  border: none !important;
  padding: 3px 6px 3px 0 !important;
  font-weight: 600;
  text-align: left;
  background: transparent !important;
}
.dotted-slot {
  display: inline-block;
  min-width: 34px;
  border-bottom: 1.5px dotted #111827;
  text-align: center;
  font-weight: 700;
  padding: 0 4px;
}

/* ============================================================================
   3. P3K YEARLY (p3k-yearly — matches Inspeksi Kotak P3K ... September 2026.pdf)
   ============================================================================ */
.p3k-outer-box {
  border: 2px solid #000000 !important;
  width: 100%;
  background: #ffffff !important;
}
table.p3k-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  background: #ffffff !important;
}
table.p3k-table th,
table.p3k-table td {
  border: 1px solid #000000 !important;
  padding: 1.5px 3px !important;
  font-size: 7.8pt !important;
  line-height: 1.15;
  vertical-align: middle;
  color: #000000 !important;
  background: #ffffff !important;
}
table.p3k-table tr.p3k-double-divider td {
  border-bottom: 3px double #000000 !important;
}
table.p3k-table .p3k-grey-header {
  background-color: #d9e1f2 !important;
  font-weight: 700 !important;
  text-align: center;
}
table.p3k-table .p3k-grey-col {
  background-color: #d9e1f2 !important;
  text-align: center;
}
.p3k-v-wrap {
  height: 58px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.p3k-v-text {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  white-space: nowrap;
  font-size: 6.8pt;
  font-weight: 700;
  line-height: 1.0;
}
.p3k-bottom-note {
  margin-top: 4px;
  font-size: 8pt;
  font-style: italic;
  color: #000000 !important;
}

/* ============================================================================
   4. SAFETY PATROL (patrol-report — matches Safety Patrol Juni 2026.pdf)
   ============================================================================ */
table.patrol-head-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #111827 !important;
  margin-bottom: 18px;
  background: #ffffff !important;
}
table.patrol-head-table td {
  border: 1px solid #111827 !important;
  vertical-align: middle;
  text-align: center;
  padding: 8px 10px !important;
  background: #ffffff !important;
}
.patrol-head-center div {
  font-size: 10.5pt;
  font-weight: 700;
  line-height: 1.45;
  color: #000000 !important;
}
table.patrol-grid-table {
  width: 100%;
  border-collapse: collapse;
  border: none !important;
}
table.patrol-grid-table td {
  width: 50%;
  border: none !important;
  vertical-align: top;
  text-align: center;
  padding: 6px 12px 18px 12px !important;
  background: transparent !important;
}
.patrol-photo-box {
  height: 250px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}
.patrol-photo-box img {
  max-height: 246px;
  max-width: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  display: block;
}
.patrol-caption {
  font-size: 11pt;
  font-weight: 400;
  line-height: 1.35;
  color: #000000 !important;
  white-space: pre-line;
  margin: 0;
}

/* ============================================================================
   5. HYDRANT LAPORAN (hydrant-laporan — matches Checklist Hydrant Bulanan September.pdf)
   ============================================================================ */
table.hyd-lap-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #000000 !important;
  table-layout: fixed;
  background: #ffffff !important;
}
table.hyd-lap-table th,
table.hyd-lap-table td {
  border: 1px solid #000000 !important;
  padding: 4px 5px !important;
  font-size: 8.5pt !important;
  vertical-align: middle;
  text-align: center;
  color: #000000 !important;
  background: #ffffff !important;
}
.hyd-lap-v-wrap {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.hyd-lap-v-text {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  white-space: nowrap;
  font-size: 7pt;
  font-weight: 700;
  line-height: 1.05;
}

/* ============================================================================
   6. HYDRANT MONTHLY (hydrant-monthly — matches Inspeksi Hydrant September.pdf)
   ============================================================================ */
.hyd-mon-title {
  text-align: center;
  margin: 8px 0 14px 0;
}
.hyd-mon-title h1 {
  font-size: 16pt;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: #000000 !important;
}
.hyd-mon-title h2 {
  font-size: 13pt;
  font-weight: 700;
  margin: 0;
  color: #000000 !important;
}
.hyd-mon-meta {
  font-size: 10.5pt;
  margin-bottom: 10px;
  line-height: 1.6;
  color: #000000 !important;
}
.hyd-mon-section-heading {
  font-size: 10.5pt;
  font-weight: 700;
  margin: 8px 0 8px 14px;
  color: #000000 !important;
}
table.hyd-mon-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #111827 !important;
  table-layout: fixed;
  background: #ffffff !important;
}
table.hyd-mon-table th,
table.hyd-mon-table td {
  border: 1px solid #111827 !important;
  padding: 4px 6px !important;
  vertical-align: middle;
  text-align: center;
  font-size: 10.5pt !important;
  color: #000000 !important;
  background: #ffffff !important;
}
table.hyd-mon-table thead th {
  text-align: center !important;
  font-weight: 700 !important;
  background: #ffffff !important;
}
table.hyd-mon-table tbody tr {
  height: 225px;
}
.hyd-mon-photo {
  max-width: 155px;
  max-height: 210px;
  width: auto;
  height: auto;
  object-fit: contain;
  display: block;
  margin: 4px auto;
}

@media print {
  html, body, #root, .procedural-print-canvas {
    background: #ffffff !important;
    color: #000000 !important;
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
    min-height: 0 !important;
    color-scheme: light only !important;
  }
  .no-print {
    display: none !important;
  }
  .print-sheet-portrait,
  .print-sheet-landscape {
    width: 100% !important;
    max-width: 100% !important;
    min-height: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    box-shadow: none !important;
    border: none !important;
    background: #ffffff !important;
    color: #000000 !important;
  }
}
`;


export interface PrintSignerSlot {
  header: string;
  nama?: string;
  jabatan?: string;
  marginBottomPx?: number;
}

function renderDynamicSignTable(slots: PrintSignerSlot[], marginTopPx = 12): string {
  const active = slots.filter((s) => (s.nama ?? '').trim().length > 0);
  if (active.length === 0) return '';
  const widthPct = `${Math.floor(100 / active.length)}%`;
  const tds = active
    .map(
      (s) => `
        <td style="width:${widthPct};">
          <div class="sign-header" style="margin-bottom:${s.marginBottomPx ?? 48}px;">${escPrint(s.header)}</div>
          <div class="sign-name">${escPrint((s.nama ?? '').trim())}</div>
          ${(s.jabatan ?? '').trim() ? `<div class="sign-role">${escPrint((s.jabatan ?? '').trim())}</div>` : ''}
        </td>
      `,
    )
    .join('');
  return `
    <table class="sign-table" style="margin-top:${marginTopPx}px;">
      <tbody><tr>${tds}</tr></tbody>
    </table>
  `;
}

export function renderKopHeaderJpm(headerLogos?: PrintHeaderImageConfig): string {
  const h = headerLogos?.heightPx || 44;
  if (headerLogos?.mode === 'banner' && headerLogos.bannerSrc) {
    return `
      <div class="kop-header" style="justify-content:center;min-height:${h + 8}px;">
        <img src="${escPrint(headerLogos.bannerSrc)}" alt="Header" style="max-height:${h}px;width:100%;object-fit:contain;display:block;margin:0 auto;" />
      </div>
    `;
  }
  const leftSrc = headerLogos?.leftLogoSrc || LOGO_DUTAGARUDA_B64;
  const rightSrc = headerLogos?.rightLogoSrc || LOGO_K3_B64;
  return `
    <div class="kop-header" style="min-height:${h + 8}px;">
      <img class="kop-logo-left" src="${escPrint(leftSrc)}" alt="Logo Kiri" style="height:${h}px;width:auto;object-fit:contain;" />
      <img class="kop-logo-right" src="${escPrint(rightSrc)}" alt="Logo Kanan" style="height:${h}px;width:auto;object-fit:contain;" />
    </div>
  `;
}

/* ============================================================================
   1. APAR CARD (`apar-card`)
   ============================================================================ */

export interface AparCardMonthItem {
  bulan?: string;
  tanggal?: string;
  safetyPin?: string;
  corong?: string;
  segel?: string;
  tekanan?: string;
  tabung?: string;
  selang?: string;
  katupTuas?: string;
  namaPemeriksa?: string;
  paraf?: string;
}

export interface AparCardPrintPayload {
  headerLogos?: PrintHeaderImageConfig;
  documentTitle?: string;
  tahun: number | string;
  ukuran?: string | null;
  kode: string;
  jenis?: string | null;
  zoneName: string;
  siteName?: string;
  tglPengisianTerakhir?: [string, string, string];
  tglPengisianUlang?: [string, string, string];
  months: AparCardMonthItem[];
}

function renderAparCardSymbol(status?: string): string {
  const s = String(status || '').toUpperCase();
  if (s === 'BAIK' || s === '✓' || s === '√') {
    return '<span style="font-weight:700;font-size:10.5pt;">&#10003;</span>';
  }
  if (s === 'TIDAK_BAIK' || s === 'X' || s === '✗') {
    return '<span style="font-weight:700;font-size:9.5pt;">X</span>';
  }
  if (s === 'NA') {
    return '<span style="font-weight:600;font-size:8.5pt;">NA</span>';
  }
  return '';
}

export function renderAparCardSheet(data: AparCardPrintPayload): string {
  const months = data.months || [];
  const defaultMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
  const rowsHtml = defaultMonthNames
    .map((mName, idx) => {
      const m = months[idx] || {};
      return `
        <tr>
          <td class="num" style="font-weight:600;">${escPrint(m.tanggal || '')}</td>
          <td style="text-align:left;padding-left:6px;font-weight:600;">${escPrint(m.bulan || mName)}</td>
          <td>${renderAparCardSymbol(m.safetyPin)}</td>
          <td>${renderAparCardSymbol(m.corong)}</td>
          <td>${renderAparCardSymbol(m.segel)}</td>
          <td>${renderAparCardSymbol(m.tekanan)}</td>
          <td>${renderAparCardSymbol(m.tabung)}</td>
          <td>${renderAparCardSymbol(m.selang)}</td>
          <td>${renderAparCardSymbol(m.katupTuas)}</td>
          <td style="font-size:9pt;">${escPrint(m.namaPemeriksa || '')}</td>
          <td style="font-style:italic;font-family:Georgia,serif;">${escPrint(m.paraf || '')}</td>
        </tr>
      `;
    })
    .join('');

  const tLast = data.tglPengisianTerakhir || ['', '', ''];
  const tRefill = data.tglPengisianUlang || ['', '', ''];

  return `
    <div class="print-sheet-portrait">
      <div class="apar-card-outer">
        <table class="apar-card-head-table">
          <tbody>
            ${data.headerLogos?.mode === 'banner' && data.headerLogos.bannerSrc ? `
            <tr>
              <td colspan="3" style="text-align:center;padding:4px;">
                <img src="${escPrint(data.headerLogos.bannerSrc)}" alt="Header" style="max-height:${data.headerLogos.heightPx || 44}px;width:100%;object-fit:contain;margin:0 auto;display:block;" />
              </td>
            </tr>
            <tr>
              <td colspan="3" style="padding:4px 6px;">
                <div class="apar-card-title">
                  ${data.documentTitle ? escPrint(data.documentTitle) : 'CHECKLIST PEMERIKSAAN<br/>ALAT PEMADAM API RINGAN (APAR)'}
                </div>
              </td>
            </tr>` : `
            <tr>
              <td style="width:24%;text-align:center;">
                <img src="${escPrint(data.headerLogos?.leftLogoSrc || LOGO_DUTAGARUDA_B64)}" alt="Logo Kiri" style="height:${data.headerLogos?.heightPx || 34}px;width:auto;object-fit:contain;margin:0 auto;display:block;" />
              </td>
              <td style="width:58%;">
                <div class="apar-card-title">
                  ${data.documentTitle ? escPrint(data.documentTitle) : 'CHECKLIST PEMERIKSAAN<br/>ALAT PEMADAM API RINGAN (APAR)'}
                </div>
              </td>
              <td style="width:18%;text-align:center;">
                <img src="${escPrint(data.headerLogos?.rightLogoSrc || LOGO_K3_B64)}" alt="Logo Kanan" style="height:${data.headerLogos?.heightPx || 38}px;width:auto;object-fit:contain;margin:0 auto;display:block;" />
              </td>
            </tr>`}
          </tbody>
        </table>

        <table class="apar-card-meta-table" style="margin-top:-1px;">
          <tbody>
            <tr>
              <td style="width:13%;font-weight:600;">Tahun</td>
              <td class="num" style="width:20%;font-weight:700;">${escPrint(data.tahun)}</td>
              <td style="width:13%;font-weight:600;">Ukuran</td>
              <td class="num" style="width:20%;font-weight:700;">${escPrint(data.ukuran ?? '')}</td>
              <td colspan="2" style="width:34%;text-align:center;font-weight:600;">No APAR</td>
            </tr>
            <tr>
              <td style="font-weight:600;">Jenis</td>
              <td style="font-weight:700;">${escPrint(data.jenis ?? '')}</td>
              <td style="font-weight:600;">Lokasi</td>
              <td style="font-weight:700;">${escPrint(data.zoneName || data.siteName || '')}</td>
              <td colspan="2" class="num" style="text-align:center;font-weight:700;font-size:11pt;">${escPrint(data.kode)}</td>
            </tr>
          </tbody>
        </table>

        <table class="apar-card-grid-table" style="margin-top:-1px;">
          <thead>
            <tr>
              <th rowspan="2" style="width:13%;">TANGGAL</th>
              <th rowspan="2" style="width:11%;">BULAN</th>
              <th colspan="7" style="padding:4px;">KONDISI</th>
              <th rowspan="2" style="width:15%;">NAMA<br/>PEMERIKSA</th>
              <th rowspan="2" style="width:14%;">PARAF<br/>PEMERIKSA</th>
            </tr>
            <tr>
              <th style="width:6.7%;"><div class="v-text-wrap"><span class="v-text">Safety Pin</span></div></th>
              <th style="width:6.7%;"><div class="v-text-wrap"><span class="v-text">Corong</span></div></th>
              <th style="width:6.7%;"><div class="v-text-wrap"><span class="v-text">Segel</span></div></th>
              <th style="width:6.7%;"><div class="v-text-wrap"><span class="v-text">Tekanan</span></div></th>
              <th style="width:6.7%;"><div class="v-text-wrap"><span class="v-text">Tabung</span></div></th>
              <th style="width:6.7%;"><div class="v-text-wrap"><span class="v-text">Selang</span></div></th>
              <th style="width:6.7%;"><div class="v-text-wrap"><span class="v-text">Katup/Tuas</span></div></th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="apar-card-footer">
          <div style="font-weight:700;margin-bottom:3px;">Keterangan</div>
          <table class="apar-card-ket-table">
            <tbody>
              <tr>
                <td style="font-weight:700;width:36px;text-align:center;">&#10003;</td>
                <td>Standar</td>
              </tr>
              <tr>
                <td style="font-weight:700;text-align:center;">X</td>
                <td>Tidak Standar</td>
              </tr>
            </tbody>
          </table>

          <table class="apar-card-fill-dates">
            <tbody>
              <tr>
                <td style="width:165px;">Tanggal Refill</td>
                <td>:</td>
                <td class="num">
                  <span class="dotted-slot">${escPrint(tLast[0] || '')}</span> /
                  <span class="dotted-slot">${escPrint(tLast[1] || '')}</span> /
                  <span class="dotted-slot">${escPrint(tLast[2] || '')}</span>
                </td>
              </tr>
              <tr>
                <td>Tgl Pengisian Ulang</td>
                <td>:</td>
                <td class="num">
                  <span class="dotted-slot">${escPrint(tRefill[0] || '')}</span> /
                  <span class="dotted-slot">${escPrint(tRefill[1] || '')}</span> /
                  <span class="dotted-slot">${escPrint(tRefill[2] || '')}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

/* ============================================================================
   2. P3K YEARLY (`p3k-yearly`)
   ============================================================================ */

export interface P3kYearlyPrintItem {
  no?: number;
  itemName: string;
  standardQty: number | string;
  months: Array<'STANDAR' | 'DIBAWAH_STANDAR' | 'KADALUARSA' | null | string>;
  keterangan?: string;
}

export interface P3kYearlyPrintPayload {
  headerLogos?: PrintHeaderImageConfig;
  documentTitle?: string;
  keteranganLabel?: string;
  tahun: number | string;
  unitKerja?: string;
  boxType?: 'A' | 'B' | 'C';
  siteName: string;
  tanggalInspeksi: string[];
  parafInisial: string[];
  items: P3kYearlyPrintItem[];
  signatures?: {
    diperiksaHeader?: string;
    diperiksaNama: string;
    diperiksaJabatan: string;
    mengetahuiHeader?: string;
    mengetahuiNama: string;
    mengetahuiJabatan: string;
  };
}

export function renderP3kYearlySheet(data: P3kYearlyPrintPayload): string {
  const monthHeaders = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'];
  const items = data.items || [];

  const monthTopThs = monthHeaders.map((m) => `<th colspan="2" class="p3k-grey-header">${m}</th>`).join('');
  const monthSubThs = monthHeaders
    .map(
      () => `
        <th style="background:#ffffff !important;"><div class="p3k-v-wrap"><span class="p3k-v-text">Standar</span></div></th>
        <th class="p3k-grey-col"><div class="p3k-v-wrap"><span class="p3k-v-text">Dibawah<br/>Standar</span></div></th>
      `,
    )
    .join('');

  const itemRowsHtml = items
    .map((item, idx) => {
      const mCells: string[] = [];
      for (let m = 0; m < 12; m++) {
        const st = item.months && item.months[m] ? String(item.months[m]).toUpperCase() : '';
        const stdMark = st === 'STANDAR' ? '&#10003;' : st === 'KADALUARSA' ? 'KD' : '';
        const lowMark = st === 'DIBAWAH_STANDAR' ? 'X' : '';
        mCells.push(`
          <td style="text-align:center;font-weight:600;">${stdMark}</td>
          <td class="p3k-grey-col" style="font-weight:600;">${lowMark}</td>
        `);
      }
      return `
        <tr>
          <td class="num" style="text-align:center;">${escPrint(item.no ?? idx + 1)}</td>
          <td style="padding-left:5px;text-align:left;">${escPrint(item.itemName)}</td>
          <td class="num" style="text-align:center;">${escPrint(item.standardQty)}</td>
          ${mCells.join('')}
          <td style="text-align:left;padding-left:4px;">${escPrint(item.keterangan || '')}</td>
        </tr>
      `;
    })
    .join('');

  const tglArr = data.tanggalInspeksi || Array(12).fill('');
  const parafArr = data.parafInisial || Array(12).fill('');

  const tglCells = Array.from(
    { length: 12 },
    (_, m) => `<td colspan="2" class="num" style="text-align:center;font-size:7.3pt;padding:3px 1px;">${escPrint(tglArr[m] || '')}</td>`,
  ).join('');

  const parafCells = Array.from(
    { length: 12 },
    (_, m) => `<td colspan="2" style="text-align:center;font-size:7.5pt;padding:3px 1px;">${escPrint(parafArr[m] || '')}</td>`,
  ).join('');

  return `
    <div class="print-sheet-landscape">
      <div class="p3k-outer-box">
        <table class="p3k-table">
          <colgroup>
            <col style="width:3.2%;" />
            <col style="width:16.8%;" />
            <col style="width:5.5%;" />
            ${Array.from({ length: 24 }, () => '<col style="width:2.75%;" />').join('')}
            <col style="width:8.5%;" />
          </colgroup>
          <tbody>
            ${data.headerLogos?.mode === 'banner' && data.headerLogos.bannerSrc ? `
            <tr>
              <td colspan="28" style="text-align:center;padding:4px 6px;">
                <img src="${escPrint(data.headerLogos.bannerSrc)}" alt="Header" style="max-height:${data.headerLogos.heightPx || 44}px;width:100%;object-fit:contain;margin:0 auto;display:block;" />
              </td>
            </tr>
            <tr>
              <td colspan="28" style="text-align:center;font-size:13.5pt;font-weight:700;letter-spacing:0.02em;padding:4px 6px;">
                ${escPrint(data.documentTitle || `INSPEKSI KOTAK P3K ${data.boxType ? `(TIPE ${escPrint(data.boxType)})` : ''}`)}
              </td>
            </tr>` : `
            <tr>
              <td colspan="3" style="text-align:center;padding:6px 4px;">
                <img src="${escPrint(data.headerLogos?.leftLogoSrc || LOGO_DUTAGARUDA_B64)}" alt="Logo Kiri" style="height:${data.headerLogos?.heightPx || 36}px;width:auto;object-fit:contain;margin:0 auto;display:block;" />
              </td>
              <td colspan="18" style="text-align:center;font-size:13.5pt;font-weight:700;letter-spacing:0.02em;">
                ${escPrint(data.documentTitle || `INSPEKSI KOTAK P3K ${data.boxType ? `(TIPE ${escPrint(data.boxType)})` : ''}`)}
              </td>
              <td colspan="7" style="text-align:center;padding:4px;">
                <img src="${escPrint(data.headerLogos?.rightLogoSrc || LOGO_K3_B64)}" alt="Logo Kanan" style="height:${data.headerLogos?.heightPx || 36}px;width:auto;object-fit:contain;margin:0 auto;display:block;" />
              </td>
            </tr>`}

            <tr class="p3k-double-divider">
              <td colspan="28" style="font-weight:700;padding:3px 6px;font-size:8pt;text-align:left;">
                Periode : <span class="num">${escPrint(data.tahun || 2026)}</span>
              </td>
            </tr>

            <tr>
              <td colspan="2" style="font-weight:700;padding:3px 6px;text-align:left;">
                Unit Kerja : ${escPrint(data.unitKerja || 'HSE')}
              </td>
              <td colspan="11" style="font-weight:700;padding:3px 6px;text-align:left;">
                Lokasi Kerja : ${escPrint(data.siteName || 'ITJ JPM Dukuh Atas')}
              </td>
              <td colspan="15" style="padding:3px 6px;font-size:7.6pt;text-align:left;">
                ${data.keteranganLabel ? escPrint(data.keteranganLabel) : '<strong>Keterangan:</strong> Standar ( &#10003; ) | Tidak Standar ( &#10007; ) | Kadaluarsa (KD)'}
              </td>
            </tr>

            <tr>
              <th rowspan="2" class="p3k-grey-header">NO.</th>
              <th rowspan="2" class="p3k-grey-header">ITEM</th>
              <th rowspan="2" class="p3k-grey-header">JUMLAH<br/>STANDAR</th>
              ${monthTopThs}
              <th rowspan="2" class="p3k-grey-header">KETERANGAN</th>
            </tr>
            <tr>
              ${monthSubThs}
            </tr>

            ${itemRowsHtml}

            <tr>
              <td colspan="3" style="text-align:center;font-weight:400;padding:3px;">TANGGAL INSPEKSI</td>
              ${tglCells}
              <td></td>
            </tr>
            <tr>
              <td colspan="3" style="text-align:center;font-weight:400;padding:3px;">PARAF &amp; INISIAL</td>
              ${parafCells}
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="p3k-bottom-note">
        Catatan: Apabila jumlah dibawah standar, maka harus diisi kembali sesuai dengan jumlah standar yang tercantum
      </div>
      ${renderDynamicSignTable(
        data.signatures
          ? [
              { header: data.signatures.diperiksaHeader || 'Diperiksa Oleh :', nama: data.signatures.diperiksaNama, jabatan: data.signatures.diperiksaJabatan, marginBottomPx: 32 },
              { header: data.signatures.mengetahuiHeader || 'Mengetahui / Disetujui Oleh :', nama: data.signatures.mengetahuiNama, jabatan: data.signatures.mengetahuiJabatan, marginBottomPx: 32 },
            ]
          : [
              { header: 'Diperiksa Oleh :', nama: 'Takamay Jason Hermantika Irsyad', jabatan: 'Junior HSE Analyst', marginBottomPx: 32 },
              { header: 'Mengetahui / Disetujui Oleh :', nama: 'Hizri', jabatan: 'Governance, Risk, HSE & Quality Group Head', marginBottomPx: 32 },
            ],
        8,
      )}
    </div>
  `;
}

/* ============================================================================
   3. SAFETY PATROL (`patrol-report`)
   ============================================================================ */

export interface PatrolFindingPrintItem {
  no?: number;
  src: string | null;
  caption: string;
}

export interface PatrolReportPrintPayload {
  headerLogos?: PrintHeaderImageConfig;
  documentTitle?: string;
  siteName: string;
  patrolDate: string;
  findings: PatrolFindingPrintItem[];
  signatures?: {
    dibuatHeader?: string;
    dibuatNama: string;
    dibuatJabatan: string;
    diketahuiHeader?: string;
    diketahuiNama?: string;
    diketahuiJabatan?: string;
    disetujuiHeader?: string;
    disetujuiNama: string;
    disetujuiJabatan: string;
  };
}

export function renderPatrolReportSheets(data: PatrolReportPrintPayload): string {
  const findings = data.findings || [];
  const pages: PatrolFindingPrintItem[][] = [];
  for (let i = 0; i < findings.length; i += 4) {
    pages.push(findings.slice(i, i + 4));
  }
  if (pages.length === 0) pages.push([]);

  return pages
    .map((pageItems, pIdx) => {
      const isLastPage = pIdx === pages.length - 1;
      const patrolSignHtml =
        isLastPage && data.signatures
          ? renderDynamicSignTable(
              [
                { header: data.signatures.dibuatHeader || 'Dibuat Oleh :', nama: data.signatures.dibuatNama, jabatan: data.signatures.dibuatJabatan, marginBottomPx: 44 },
                { header: data.signatures.diketahuiHeader || 'Diketahui Oleh :', nama: data.signatures.diketahuiNama, jabatan: data.signatures.diketahuiJabatan, marginBottomPx: 44 },
                { header: data.signatures.disetujuiHeader || 'Disetujui Oleh :', nama: data.signatures.disetujuiNama, jabatan: data.signatures.disetujuiJabatan, marginBottomPx: 44 },
              ],
              18,
            )
          : '';
      const rows: string[] = [];
      for (let r = 0; r < pageItems.length; r += 2) {
        const left = pageItems[r];
        const right = pageItems[r + 1];
        rows.push(`
          <tr>
            <td>
              ${
                left
                  ? `
                <div class="patrol-photo-box">
                  ${left.src ? `<img src="${escPrint(left.src)}" alt="Temuan ${escPrint(left.no ?? r + 1)}" />` : '<span>Tidak ada foto</span>'}
                </div>
                <p class="patrol-caption">${escPrint(left.caption)}</p>
              `
                  : ''
              }
            </td>
            <td>
              ${
                right
                  ? `
                <div class="patrol-photo-box">
                  ${right.src ? `<img src="${escPrint(right.src)}" alt="Temuan ${escPrint(right.no ?? r + 2)}" />` : '<span>Tidak ada foto</span>'}
                </div>
                <p class="patrol-caption">${escPrint(right.caption)}</p>
              `
                  : ''
              }
            </td>
          </tr>
        `);
      }

      return `
        <div class="print-sheet-portrait">
          <table class="patrol-head-table">
            <tbody>
              ${data.headerLogos?.mode === 'banner' && data.headerLogos.bannerSrc ? `
              <tr>
                <td colspan="3" style="padding:4px 6px;">
                  <img src="${escPrint(data.headerLogos.bannerSrc)}" alt="Header" style="max-height:${data.headerLogos.heightPx || 56}px;width:100%;object-fit:contain;margin:0 auto;display:block;" />
                </td>
              </tr>
              <tr>
                <td colspan="3" class="patrol-head-center" style="padding:4px 6px;">
                  <div>${escPrint(data.documentTitle || 'LAPORAN KEGIATAN SAFETY PATROL')}</div>
                  <div>${escPrint(data.siteName || 'ITJ JPM DUKUH ATAS')}</div>
                  <div class="num">${escPrint(data.patrolDate || '')}</div>
                </td>
              </tr>` : `
              <tr>
                <td style="width:33%;">
                  <img src="${escPrint(data.headerLogos?.leftLogoSrc || LOGO_DUTAGARUDA_B64)}" alt="Logo Kiri" style="height:${data.headerLogos?.heightPx || 46}px;width:auto;object-fit:contain;margin:0 auto;display:block;" />
                </td>
                <td style="width:34%;" class="patrol-head-center">
                  <div>${escPrint(data.documentTitle || 'LAPORAN KEGIATAN SAFETY PATROL')}</div>
                  <div>${escPrint(data.siteName || 'ITJ JPM DUKUH ATAS')}</div>
                  <div class="num">${escPrint(data.patrolDate || '')}</div>
                </td>
                <td style="width:33%;">
                  <img src="${escPrint(data.headerLogos?.rightLogoSrc || LOGO_K3_B64)}" alt="Logo Kanan" style="height:${data.headerLogos?.heightPx || 48}px;width:auto;object-fit:contain;margin:0 auto;display:block;" />
                </td>
              </tr>`}
            </tbody>
          </table>

          ${
            pageItems.length === 0
              ? '<p style="text-align:center;font-style:italic;font-size:10pt;margin-top:24px;">Tidak ada foto temuan pada periode ini.</p>'
              : `<table class="patrol-grid-table"><tbody>${rows.join('')}</tbody></table>`
          }
          ${patrolSignHtml}
        </div>
      `;
    })
    .join('\n');
}

/* ============================================================================
   4. APAR MONTHLY (`apar-monthly`)
   ============================================================================ */

export interface AparMonthlyPrintRow {
  no: number;
  zoneName: string;
  kode: string;
  expiredDate: string;
  kartuSrc?: string | null;
  beratSrc?: string | null;
  pengecekanSrc?: string | null;
  pengecekanExtraSrc?: string | null;
}

export interface AparMonthlyExpiryRow {
  no: string;
  periodeKadaluwarsa: string;
  totalApar: number;
  noApar: string;
}

export interface AparMonthlyPrintPayload {
  headerLogos?: PrintHeaderImageConfig;
  documentTitle?: string;
  documentSubtitle?: string;
  siteName: string;
  periodLabel: string;
  inspectionDate: string;
  notes?: string;
  signers: {
    dibuatHeader?: string;
    dibuatNama: string;
    dibuatJabatan: string;
    diketahuiHeader?: string;
    diketahuiNama?: string;
    diketahuiJabatan?: string;
    disetujuiHeader?: string;
    disetujuiNama: string;
    disetujuiJabatan: string;
  };
  rows: AparMonthlyPrintRow[];
  expiryRows: AparMonthlyExpiryRow[];
}

export function renderAparMonthlySheets(docData: AparMonthlyPrintPayload): string {
  const rows = docData.rows || [];
  const chunks: AparMonthlyPrintRow[][] = [];
  if (rows.length > 0) {
    chunks.push(rows.slice(0, 5));
    for (let i = 5; i < rows.length; i += 6) {
      chunks.push(rows.slice(i, i + 6));
    }
  } else {
    chunks.push([]);
  }

  const expiryHtml = `
    <div class="kadaluwarsa-section">
      <p class="kadaluwarsa-title">Kadaluwarsa APAR</p>
      <table class="kadaluwarsa-table">
        <thead>
          <tr>
            <th style="width:10%;">No</th>
            <th style="width:28%;">Periode Kadaluwarsa</th>
            <th style="width:18%;">Total APAR</th>
            <th style="width:44%;">No APAR</th>
          </tr>
        </thead>
        <tbody>
          ${docData.expiryRows
            .map(
              (r) => `
            <tr>
              <td class="num">${escPrint(r.no)}</td>
              <td class="num">${escPrint(r.periodeKadaluwarsa)}</td>
              <td class="num">${escPrint(r.totalApar)}</td>
              <td class="num">${escPrint(r.noApar)}</td>
            </tr>
          `,
            )
            .join('')}
        </tbody>
      </table>
    </div>
  `;

  const s = docData.signers;
  const notesHtml =
    docData.notes && docData.notes.trim() ? `<div class="catatan-text">${escPrint(docData.notes)}</div>` : '';
  const aparSignTable = renderDynamicSignTable(
    [
      { header: s.dibuatHeader || 'Petugas Pemeriksa :', nama: s.dibuatNama, jabatan: s.dibuatJabatan, marginBottomPx: 52 },
      { header: s.diketahuiHeader || 'Diketahui Oleh :', nama: s.diketahuiNama, jabatan: s.diketahuiJabatan, marginBottomPx: 52 },
      { header: s.disetujuiHeader || 'Disetujui Oleh :', nama: s.disetujuiNama, jabatan: s.disetujuiJabatan, marginBottomPx: 52 },
    ],
    8,
  );
  const signHtml = `
    <div class="catatan-sign-section">
      <p class="catatan-label">Catatan :</p>
      ${notesHtml}
      ${aparSignTable}
    </div>
  `;

  const sheets: string[] = [];
  chunks.forEach((chunk, pIdx) => {
    const isFirst = pIdx === 0;
    const isLast = pIdx === chunks.length - 1;

    const titleHtml = isFirst
      ? `
      <div class="title-box">
        <h1>${escPrint(docData.documentTitle || 'Checklist Bulanan APAR')}</h1>
        <h2>${escPrint(docData.documentSubtitle || docData.siteName || 'Kantor Pusat')}</h2>
        <div class="title-meta">
          <span>${escPrint(docData.periodLabel)}</span>
          <span>Tanggal : <span class="num">${escPrint(docData.inspectionDate)}</span></span>
        </div>
      </div>
    `
      : '';

    const theadHtml = isFirst
      ? `
      <thead>
        <tr>
          <th>No</th>
          <th>Zona</th>
          <th>Kode<br/>APAR</th>
          <th>Periode<br/>Expired</th>
          <th>Dokumentasi<br/>Kartu Checklist</th>
          <th>Dokumentasi<br/>Berat APAR Co<sup>2</sup></th>
          <th>Dokumentasi<br/>Pengecekan</th>
        </tr>
      </thead>
    `
      : '';

    const tbodyRows = chunk
      .map(
        (r) => `
      <tr>
        <td class="cell-no num">${escPrint(r.no)}</td>
        <td class="cell-zona">${escPrint(r.zoneName)}</td>
        <td class="cell-kode num">${escPrint(r.kode)}</td>
        <td class="cell-expired num">${escPrint(String(r.expiredDate || '').trim()).replace(/\s+/g, '<br/>')}</td>
        <td>${r.kartuSrc ? `<div class="photo-cell-wrap"><img class="doc-photo" src="${escPrint(r.kartuSrc)}" alt="Kartu" /></div>` : ''}</td>
        <td>${r.beratSrc ? `<div class="photo-cell-wrap"><img class="doc-photo doc-photo-landscape" src="${escPrint(r.beratSrc)}" alt="Berat CO2" /></div>` : ''}</td>
        <td>${
          r.pengecekanSrc
            ? `<div class="photo-cell-wrap"><img class="doc-photo" src="${escPrint(r.pengecekanSrc)}" alt="Pengecekan" />${
                r.pengecekanExtraSrc ? `<img class="doc-photo" src="${escPrint(r.pengecekanExtraSrc)}" alt="Pengecekan 2" />` : ''
              }</div>`
            : ''
        }</td>
      </tr>
    `,
      )
      .join('');

    let tail = '';
    if (isLast) {
      tail += expiryHtml + signHtml;
    }

    sheets.push(`
      <div class="print-sheet-portrait">
        ${renderKopHeaderJpm(docData.headerLogos)}
        ${titleHtml}
        <table class="apar-table ${isFirst ? 'page-1-table' : ''}">
          <colgroup>
            <col class="col-no" /><col class="col-zona" /><col class="col-kode" /><col class="col-expired" />
            <col class="col-kartu" /><col class="col-berat" /><col class="col-pengecekan" />
          </colgroup>
          ${theadHtml}
          <tbody>${tbodyRows}</tbody>
        </table>
        ${tail}
      </div>
    `);
  });


  return sheets.join('\n');
}

/* ============================================================================
   5. HYDRANT LAPORAN (`hydrant-laporan` — Landscape)
   ============================================================================ */

export interface HydrantLaporanPrintRow {
  no?: number;
  kode: string;
  box?: string;
  hose?: string;
  coupling?: string;
  rack?: string;
  nozzle?: string;
  valve?: string;
  tanggal: string;
  petugas: string;
  temuan?: string;
  rekomendasi?: string;
  keterangan?: string;
}

export interface HydrantLaporanPrintPayload {
  headerLogos?: PrintHeaderImageConfig;
  documentTitle?: string;
  keteranganLabel?: string;
  tahun: string;
  bulan: string;
  siteName: string;
  rows: HydrantLaporanPrintRow[];
  signatures?: {
    petugasHeader?: string;
    petugasNama?: string;
    petugasJabatan?: string;
    mengetahuiHeader?: string;
    mengetahuiNama?: string;
    mengetahuiJabatan?: string;
  };
}

export function renderHydrantLaporanSheet(data: HydrantLaporanPrintPayload): string {
  const tools = ['Box Hydrant', 'Fire Hose', 'Hose Coupling', 'Hose Rack', 'Nozzle', 'Valve / Pillar Hydrant'];
  const toolKeys: Array<keyof HydrantLaporanPrintRow> = ['box', 'hose', 'coupling', 'rack', 'nozzle', 'valve'];

  const toolHeaders = tools.map((t) => `<th colspan="2" style="font-weight:700;">${t}</th>`).join('');
  const subHeaders = tools
    .map(
      () => `
        <th><div class="hyd-lap-v-wrap"><span class="hyd-lap-v-text">Standar</span></div></th>
        <th><div class="hyd-lap-v-wrap"><span class="hyd-lap-v-text">Tidak<br/>Standar</span></div></th>
      `,
    )
    .join('');

  const rowsHtml = (data.rows || [])
    .map((r, idx) => {
      const toolCells = toolKeys
        .map((k) => {
          const val = String(r[k] || '').toUpperCase();
          const std =
            val === 'STANDAR' || val === 'BAIK' || val === 'LAYAK'
              ? '<span style="font-size:11pt;font-weight:700;">&#10004;</span>'
              : '';
          const low =
            val === 'DIBAWAH' || val === 'TIDAK_BAIK' || val === 'TIDAK_LAYAK'
              ? '<span style="font-size:10pt;font-weight:700;">X</span>'
              : val === 'HILANG'
                ? '<span style="font-weight:700;">-</span>'
                : '';
          return `<td>${std}</td><td>${low}</td>`;
        })
        .join('');

      return `
        <tr style="height:34px;">
          <td class="num" style="font-weight:700;">${escPrint(r.no ?? idx + 1)}</td>
          <td style="font-weight:700;">${escPrint(r.kode)}</td>
          ${toolCells}
          <td class="num" style="font-weight:700;">${escPrint(r.tanggal)}</td>
          <td style="font-weight:700;">${escPrint(r.petugas)}</td>
          <td style="font-size:7pt;font-weight:600;line-height:1.25;padding:3px 5px;text-align:left;">${escPrint(r.temuan ?? r.keterangan ?? '')}</td>
          <td style="font-size:7pt;font-weight:600;line-height:1.25;padding:3px 5px;text-align:left;">${escPrint(r.rekomendasi ?? '')}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <div class="print-sheet-landscape">
      <table class="hyd-lap-table">
        <colgroup>
          <col style="width:3.0%;" />
          <col style="width:7.5%;" />
          ${Array.from({ length: 12 }, () => '<col style="width:3.6%;" />').join('')}
          <col style="width:8.0%;" />
          <col style="width:8.0%;" />
          <col style="width:16.3%;" />
          <col style="width:14.0%;" />
        </colgroup>
        <tbody>
          ${data.headerLogos?.mode === 'banner' && data.headerLogos.bannerSrc ? `
          <tr>
            <td colspan="18" style="padding:4px 6px;">
              <img src="${escPrint(data.headerLogos.bannerSrc)}" alt="Header" style="max-height:${data.headerLogos.heightPx || 44}px;width:100%;object-fit:contain;margin:0 auto;display:block;" />
            </td>
          </tr>
          <tr>
            <td colspan="18" style="font-size:13pt;font-weight:700;padding:5px 6px;">
              ${escPrint(data.documentTitle || 'LAPORAN PEMERIKSAAN HYDRANT')}
            </td>
          </tr>` : `
          <tr>
            <td colspan="4" style="padding:6px;">
              <img src="${escPrint(data.headerLogos?.leftLogoSrc || LOGO_DUTAGARUDA_B64)}" alt="Logo Kiri" style="height:${data.headerLogos?.heightPx || 36}px;width:auto;object-fit:contain;margin:0 auto;display:block;" />
            </td>
            <td colspan="12" style="font-size:13pt;font-weight:700;">
              ${escPrint(data.documentTitle || 'LAPORAN PEMERIKSAAN HYDRANT')}
            </td>
            <td colspan="2" style="padding:6px;">
              <img src="${escPrint(data.headerLogos?.rightLogoSrc || LOGO_K3_B64)}" alt="Logo Kanan" style="height:${data.headerLogos?.heightPx || 36}px;width:auto;object-fit:contain;margin:0 auto;display:block;" />
            </td>
          </tr>`}
          <tr>
            <td colspan="8" style="text-align:left;font-weight:700;padding:5px 6px;">
              Tahun Pemeriksaan : <span class="num">${escPrint(data.tahun || '2026')}</span>
            </td>
            <td colspan="10" style="text-align:left;font-weight:700;padding:5px 6px;">
              Bulan : ${escPrint(data.bulan || 'September')}
            </td>
          </tr>
          <tr>
            <td colspan="8" style="text-align:left;font-weight:700;padding:5px 6px;">
              Lokasi Pemeriksaan : ${escPrint(data.siteName || 'KANTOR PUSAT')}
            </td>
            <td colspan="10" style="text-align:left;font-weight:700;padding:5px 6px;">
              ${escPrint(data.keteranganLabel || 'Keterangan : Standar (✓), Tidak Standar (X)')}
            </td>
          </tr>
          <tr>
            <th rowspan="3">No</th>
            <th rowspan="3">Kode Hydrant</th>
            <th colspan="12" style="padding:5px;font-size:9pt;">Item Alat</th>
            <th rowspan="3">Tanggal<br/>Pemeriksaan</th>
            <th rowspan="3">Petugas<br/>Pemeriksa</th>
            <th rowspan="3">Catatan Temuan<br/>Tambahan</th>
            <th rowspan="3">Tindakan<br/>Rekomendasi</th>
          </tr>
          <tr>${toolHeaders}</tr>
          <tr>${subHeaders}</tr>
          ${rowsHtml}
        </tbody>
      </table>
      ${renderDynamicSignTable(
        data.signatures
          ? [
              { header: data.signatures.petugasHeader || 'Petugas Pemeriksa :', nama: data.signatures.petugasNama, jabatan: data.signatures.petugasJabatan, marginBottomPx: 36 },
              { header: data.signatures.mengetahuiHeader || 'Mengetahui / Disetujui Oleh :', nama: data.signatures.mengetahuiNama, jabatan: data.signatures.mengetahuiJabatan, marginBottomPx: 36 },
            ]
          : [
              { header: 'Petugas Pemeriksa :', nama: 'Takamay Jason Hermantika Irsyad', jabatan: 'Junior HSE Analyst', marginBottomPx: 36 },
              { header: 'Mengetahui / Disetujui Oleh :', nama: 'Hizri', jabatan: 'Governance, Risk, HSE & Quality Group Head', marginBottomPx: 36 },
            ],
        12,
      )}
    </div>
  `;
}

/* ============================================================================
   6. HYDRANT MONTHLY (`hydrant-monthly` — Portrait)
   ============================================================================ */

export interface HydrantMonthlyPrintRow {
  no: number;
  zoneName: string;
  kode: string;
  pemeriksaanSrc?: string | null;
  checklistSrc?: string | null;
  statusText: string;
}

export interface HydrantMonthlyPrintPayload {
  headerLogos?: PrintHeaderImageConfig;
  documentTitle?: string;
  documentSubtitle?: string;
  siteName: string;
  period: string;
  inspectionDate: string;
  rows: HydrantMonthlyPrintRow[];
  temuan: Array<{ no?: number; src: string | null; caption: string }>;
  signatures?: {
    petugasHeader?: string;
    petugasNama?: string;
    petugasJabatan?: string;
    mengetahuiHeader?: string;
    mengetahuiNama?: string;
    mengetahuiJabatan?: string;
  };
}

export function renderHydrantMonthlySheets(data: HydrantMonthlyPrintPayload): string {
  const rows = data.rows || [];
  const temuan = data.temuan || [];
  const chunks: HydrantMonthlyPrintRow[][] = [];
  if (rows.length > 0) {
    chunks.push(rows.slice(0, 2));
    for (let i = 2; i < rows.length; i += 3) {
      chunks.push(rows.slice(i, i + 3));
    }
  } else {
    chunks.push([]);
  }

  const sheets: string[] = [];
  chunks.forEach((chunk, pIdx) => {
    const isFirst = pIdx === 0;
    const headBlock = isFirst
      ? `
      <div class="hyd-mon-title">
        <h1>${escPrint(data.documentTitle || 'CHECKLIST BULANAN HYDRANT')}</h1>
        <h2>${escPrint(data.documentSubtitle || data.siteName || 'KANTOR PUSAT')}</h2>
      </div>
      <div class="hyd-mon-meta">
        <div>Periode : ${escPrint(data.period || 'September 2026')}</div>
        <div>Tanggal : <span class="num">${escPrint(data.inspectionDate || '')}</span></div>
      </div>
      <div class="hyd-mon-section-heading">A. &nbsp;Laporan hasil Inspeksi Hydrant</div>
    `
      : '';

    const theadHtml = isFirst
      ? `
      <thead>
        <tr>
          <th style="width:7%;">No</th>
          <th style="width:10%;">Zona</th>
          <th style="width:12%;">Kode<br/>Hydrant</th>
          <th style="width:27%;">Dokumentasi<br/>Pemeriksaan</th>
          <th style="width:28%;">Dokumentasi Checklist</th>
          <th style="width:16%;">Status<br/>Standar</th>
        </tr>
      </thead>
    `
      : `
      <colgroup>
        <col style="width:7%;" /><col style="width:10%;" /><col style="width:12%;" />
        <col style="width:27%;" /><col style="width:28%;" /><col style="width:16%;" />
      </colgroup>
    `;

    const trs = chunk
      .map(
        (r) => `
      <tr>
        <td class="num">${escPrint(r.no)}</td>
        <td style="white-space:pre-line;">${escPrint(String(r.zoneName || '').replace(' ', '\n'))}</td>
        <td class="num">${escPrint(r.kode)}</td>
        <td style="text-align:center;vertical-align:middle;">
          ${r.pemeriksaanSrc ? `<img class="hyd-mon-photo" src="${escPrint(r.pemeriksaanSrc)}" alt="Pemeriksaan" />` : ''}
        </td>
        <td style="text-align:center;vertical-align:middle;">
          ${r.checklistSrc ? `<img class="hyd-mon-photo" src="${escPrint(r.checklistSrc)}" alt="Checklist" />` : ''}
        </td>
        <td style="white-space:pre-line;">${escPrint(r.statusText || '')}</td>
      </tr>
    `,
      )
      .join('');

    sheets.push(`
      <div class="print-sheet-portrait">
        ${renderKopHeaderJpm(data.headerLogos)}
        ${headBlock}
        <table class="hyd-mon-table">
          ${theadHtml}
          <tbody>${trs}</tbody>
        </table>
      </div>
    `);
  });

  if (temuan.length > 0) {
    const temuanRows: string[] = [];
    for (let i = 0; i < temuan.length; i += 2) {
      const left = temuan[i];
      const right = temuan[i + 1];
      temuanRows.push(`
        <tr>
          <td style="padding:8px 14px 16px 14px;text-align:left;vertical-align:top;width:50%;border:none !important;">
            ${
              left
                ? `
              <div style="height:210px;display:flex;align-items:center;justify-content:center;margin-bottom:6px;">
                ${left.src ? `<img src="${escPrint(left.src)}" alt="Temuan" style="max-height:205px;max-width:100%;object-fit:contain;" />` : ''}
              </div>
              <div style="font-size:10.5pt;text-align:center;">${escPrint(left.caption)}</div>
            `
                : ''
            }
          </td>
          <td style="padding:8px 14px 16px 14px;text-align:left;vertical-align:top;width:50%;border:none !important;">
            ${
              right
                ? `
              <div style="height:210px;display:flex;align-items:center;justify-content:center;margin-bottom:6px;">
                ${right.src ? `<img src="${escPrint(right.src)}" alt="Temuan" style="max-height:205px;max-width:100%;object-fit:contain;" />` : ''}
              </div>
              <div style="font-size:10.5pt;text-align:center;">${escPrint(right.caption)}</div>
            `
                : ''
            }
          </td>
        </tr>
      `);
    }

    sheets.push(`
      <div class="print-sheet-portrait">
        ${renderKopHeaderJpm(data.headerLogos)}
        <div class="hyd-mon-section-heading" style="margin-top:6px;">B. &nbsp;Catatan Temuan Tambahan &amp; Tindakan Rekomendasi</div>
        <table style="width:100%;border-collapse:collapse;border:none !important;">
          <tbody>${temuanRows.join('')}</tbody>
        </table>
      </div>
    `);
  }

  const monSignHtml = data.signatures
    ? renderDynamicSignTable(
        [
          { header: data.signatures.petugasHeader || 'Petugas Pemeriksa :', nama: data.signatures.petugasNama, jabatan: data.signatures.petugasJabatan, marginBottomPx: 44 },
          { header: data.signatures.mengetahuiHeader || 'Mengetahui / Disetujui Oleh :', nama: data.signatures.mengetahuiNama, jabatan: data.signatures.mengetahuiJabatan, marginBottomPx: 44 },
        ],
        16,
      )
    : '';
  if (monSignHtml && sheets.length > 0) {
    const lastIdx = sheets.length - 1;
    sheets[lastIdx] = sheets[lastIdx].replace(/<\/div>\s*$/, `${monSignHtml}
      </div>`);
  }
  return sheets.join('\n');
}
