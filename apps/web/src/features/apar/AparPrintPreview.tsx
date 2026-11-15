import React, { useEffect, useMemo, useState } from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { formatIndonesianDate } from '@/lib/dates';
import { formatNoList } from './kartuApar';
import { ambilFotoInspeksi } from '@/services/api/klien';
import { livePhotoUrl } from '@/services/api/liveClient';
import { petakanUnitApar, useInspeksiApar, useUnitApar } from '@/services/api/queries';
import { useKonteksLokasi } from '@/features/konteksLokasi';

interface AparPrintPreviewProps {
  /** Kunci bulan YYYY-MM dari query `?bulan=`; bawaan = bulan berjalan. */
  bulan?: string;
  onKembali: () => void;
}

function bulanBerjalan(): string {
  return format(new Date(), 'yyyy-MM');
}

/* ============================================================================
   VERBATIM `#print-template-styles` dari berkas rujukan demo
   (checklist_bulanan_apar_procedural_print_generator_gotenberg_templates.html).
   Disalin apa adanya; satu-satunya CSS khusus-kertas.
   ============================================================================ */
const PRINT_TEMPLATE_CSS = `/* ============================================================================
       PROCEDURAL PRINT CSS (Gotenberg 8 + Chromium & Browser Print Ready)
       Matches Inspeksi APAR Juni 2026.pdf & September 2026.pdf 1:1
       ============================================================================ */
    @page {
      size: A4 portrait;
      margin: 10mm 12mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .num {
      font-variant-numeric: tabular-nums;
    }

    /* Print sheet representation on screen & print */
    .print-sheet {
      width: 210mm;
      min-height: 297mm;
      background: #ffffff;
      color: #000000;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      padding: 8mm 12mm 10mm 12mm;
      margin: 0 auto 24px auto;
      box-shadow: 0 10px 30px -5px rgba(15, 23, 42, 0.18), 0 0 1px 1px rgba(15, 23, 42, 0.08);
      position: relative;
      page-break-after: always;
      break-after: page;
    }

    .print-sheet:last-child {
      page-break-after: auto;
      break-after: auto;
    }

    /* Header Kop Logos */
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

    /* Title Box on Page 1 */
    .title-box {
      border: 1px solid #111827;
      border-bottom: none;
      padding: 6px 14px 8px 14px;
      text-align: center;
    }

    .title-box h1 {
      font-size: 31pt;
      font-weight: 600;
      letter-spacing: -0.01em;
      line-height: 1.12;
      margin: 0;
      color: #000000;
    }

    .title-box h2 {
      font-size: 18.5pt;
      font-weight: 500;
      line-height: 1.25;
      margin: 2px 0 8px 0;
      color: #000000;
    }

    .title-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 68px;
      font-size: 11.5pt;
      font-weight: 500;
      color: #000000;
    }

    /* Main Checklist Table */
    table.apar-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      border: 1px solid #111827;
    }

    table.apar-table th,
    table.apar-table td {
      border: 1px solid #111827;
      text-align: center;
      vertical-align: middle;
      padding: 3px 4px;
      color: #000000;
    }

    table.apar-table thead th {
      font-size: 11pt;
      font-weight: 500;
      line-height: 1.2;
      padding: 5px 4px;
      background: #ffffff;
    }

    /* Exact Column Widths matching PDF proportions */
    table.apar-table col.col-no         { width: 6.2%; }
    table.apar-table col.col-zona       { width: 15.8%; }
    table.apar-table col.col-kode       { width: 9.0%; }
    table.apar-table col.col-expired    { width: 11.5%; }
    table.apar-table col.col-kartu      { width: 19.5%; }
    table.apar-table col.col-berat      { width: 17.5%; }
    table.apar-table col.col-pengecekan { width: 20.5%; }

    table.apar-table tbody tr {
      height: 126px;
    }

    table.apar-table.page-1-table tbody tr {
      height: 118px;
    }

    .cell-no {
      font-size: 11.5pt;
      font-weight: 600;
    }

    .cell-zona {
      font-size: 11.5pt;
      font-weight: 400;
    }

    .cell-kode {
      font-size: 11.5pt;
      font-weight: 400;
    }

    .cell-expired {
      font-size: 11.5pt;
      line-height: 1.22;
      padding: 2px 6px;
      white-space: pre-line;
    }

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
      max-height: 114px;
      width: auto;
      height: auto;
      object-fit: contain;
      display: block;
      margin: 0 auto;
    }

    .doc-photo-landscape {
      max-width: 112px;
      max-height: 92px;
    }

    /* Kadaluwarsa APAR Summary Section */
    .kadaluwarsa-section {
      margin-top: 12px;
      padding: 0 24px;
    }

    .kadaluwarsa-title {
      font-size: 11.5pt;
      font-weight: 500;
      margin: 0 0 6px 0;
      color: #000000;
    }

    table.kadaluwarsa-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #111827;
    }

    table.kadaluwarsa-table th,
    table.kadaluwarsa-table td {
      border: 1px solid #111827;
      padding: 5px 8px;
      font-size: 11pt;
      text-align: center;
      vertical-align: middle;
      color: #000000;
    }

    table.kadaluwarsa-table th {
      font-weight: 600;
    }

    /* Catatan & 3-Column Signatures */
    .catatan-sign-section {
      margin-top: 10px;
      padding: 0 24px;
    }

    .catatan-label {
      font-size: 11.5pt;
      font-weight: 500;
      margin: 0 0 12px 0;
      color: #000000;
    }

    .catatan-text {
      font-size: 10.5pt;
      margin: -6px 0 12px 0;
      color: #111827;
      white-space: pre-wrap;
    }

    table.sign-table {
      width: 100%;
      border-collapse: collapse;
      border: none;
    }

    table.sign-table td {
      width: 33.33%;
      border: none;
      vertical-align: top;
      text-align: left;
      padding: 0 8px 0 0;
      font-size: 11pt;
      color: #000000;
    }

    .sign-header {
      margin-bottom: 54px;
      font-weight: 400;
    }

    .sign-name {
      font-weight: 600;
      text-decoration: underline;
      text-underline-offset: 3px;
      line-height: 1.25;
      display: inline-block;
    }

    .sign-role {
      font-weight: 400;
      margin-top: 2px;
    }

    @media print {
      body {
        background: #ffffff !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .no-print {
        display: none !important;
      }
      .print-sheet {
        width: 100% !important;
        min-height: auto !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
      }
    }`;

/* ── Fungsi render prosedural demo, dipetakan ke data live ─────────────────── */

function esc(val: unknown): string {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Bentuk baris demo: no/zoneName/kode/expiredDate + slot foto per kolom. */
interface BarisCetak {
  no: number;
  zoneName: string;
  kode: string;
  /** Tampilan Indonesia "d MMMM yyyy" (atau mentah bila tak-terurai). */
  expiredDate: string;
  kartuSrc?: string;
  beratSrc?: string;
  pengecekanSrc?: string;
  pengecekanExtraSrc?: string;
}

interface ExpiryRow {
  no: string;
  periodeKadaluwarsa: string;
  totalApar: number;
  noApar: string;
}

interface DokCetak {
  siteName: string;
  periodLabel: string;
  inspectionDate: string;
  notes: string;
  signers: { dibuatNama: string; dibuatJabatan: string; diketahuiNama: string; diketahuiJabatan: string; disetujuiNama: string; disetujuiJabatan: string };
  rows: BarisCetak[];
  expiryRows: ExpiryRow[];
}

function formatMultilineExpired(dateStr: string): string {
  return esc(String(dateStr || '').trim()).replace(/\s+/g, '<br>');
}

function renderKopHeader(): string {
  return `
        <div class="kop-header">
          <img class="kop-logo-right" src="/findings/report-header-logos.png" alt="Logo Mitra &amp; Pengelola" />
        </div>
      `;
}

function renderPhotoCell(src: string | undefined, extraSrc: string | undefined, altText: string, isCo2Col: boolean): string {
  if (!src) return '';
  const cls = isCo2Col ? 'doc-photo doc-photo-landscape' : 'doc-photo';
  return `
        <div class="photo-cell-wrap">
          <img class="${cls}" src="${esc(src)}" alt="${esc(altText)}" />
          ${extraSrc ? `<img class="${cls}" src="${esc(extraSrc)}" alt="${esc(altText)} (2)" />` : ''}
        </div>
      `;
}

function renderTableColGroup(): string {
  return `
        <colgroup>
          <col class="col-no" />
          <col class="col-zona" />
          <col class="col-kode" />
          <col class="col-expired" />
          <col class="col-kartu" />
          <col class="col-berat" />
          <col class="col-pengecekan" />
        </colgroup>
      `;
}

function renderUnitRowsHtml(rowsSlice: BarisCetak[]): string {
  return rowsSlice.map((r) => `
        <tr>
          <td class="cell-no num">${esc(r.no)}</td>
          <td class="cell-zona">${esc(r.zoneName)}</td>
          <td class="cell-kode num">${esc(r.kode)}</td>
          <td class="cell-expired num">${formatMultilineExpired(r.expiredDate)}</td>
          <td>${renderPhotoCell(r.kartuSrc, undefined, 'Kartu Checklist APAR ' + r.kode, false)}</td>
          <td>${renderPhotoCell(r.beratSrc, undefined, 'Berat APAR CO2 ' + r.kode, true)}</td>
          <td>${renderPhotoCell(r.pengecekanSrc, r.pengecekanExtraSrc, 'Pengecekan APAR ' + r.kode, false)}</td>
        </tr>
      `).join('');
}

function renderKadaluwarsaBlock(docData: DokCetak): string {
  const trs = docData.expiryRows.map((row) => `
        <tr>
          <td class="num" style="width: 10%;">${esc(row.no)}</td>
          <td class="num" style="width: 28%;">${esc(row.periodeKadaluwarsa)}</td>
          <td class="num" style="width: 18%;">${esc(row.totalApar)}</td>
          <td class="num" style="width: 44%;">${esc(row.noApar)}</td>
        </tr>
      `).join('');

  return `
        <div class="kadaluwarsa-section">
          <p class="kadaluwarsa-title">Kadaluwarsa APAR</p>
          <table class="kadaluwarsa-table">
            <thead>
              <tr>
                <th style="width: 10%;">No</th>
                <th style="width: 28%;">Periode Kadaluwarsa</th>
                <th style="width: 18%;">Total APAR</th>
                <th style="width: 44%;">No APAR</th>
              </tr>
            </thead>
            <tbody>
              ${trs}
            </tbody>
          </table>
        </div>
      `;
}

function renderCatatanAndSignaturesBlock(docData: DokCetak): string {
  const s = docData.signers;
  const notesHtml = docData.notes && docData.notes.trim()
    ? `<div class="catatan-text">${esc(docData.notes)}</div>`
    : '';
  return `
        <div class="catatan-sign-section">
          <p class="catatan-label">Catatan :</p>
          ${notesHtml}
          <table class="sign-table">
            <tbody>
              <tr>
                <td>
                  <div class="sign-header">Dibuat Oleh :</div>
                  <div class="sign-name">${esc(s.dibuatNama || '').replace(/\n/g, '<br>')}</div>
                  <div class="sign-role">${esc(s.dibuatJabatan || 'Danru')}</div>
                </td>
                <td>
                  <div class="sign-header">Diketahui Oleh :</div>
                  <div class="sign-name">${esc(s.diketahuiNama || '')}</div>
                  <div class="sign-role">${esc(s.diketahuiJabatan || 'Operational & TR')}</div>
                </td>
                <td>
                  <div class="sign-header">Disetujui Oleh :</div>
                  <div class="sign-name">${esc(s.disetujuiNama || '')}</div>
                  <div class="sign-role">${esc(s.disetujuiJabatan || 'Building Management')}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
}

/**
 * Render prosedural demo (renderAparDocumentSheets): hal. 1 menampung 5 baris
 * (karena kotak judul + thead), halaman berikut 6 baris; hal. tabel terakhir
 * memuat blok Kadaluwarsa; tata letak '4-page' menaruh Catatan + tanda tangan
 * di halaman tabel terakhir.
 */
function renderAparDocumentSheets(docData: DokCetak): string {
  const rows = docData.rows || [];
  const chunks: BarisCetak[][] = [];
  if (rows.length > 0) {
    chunks.push(rows.slice(0, 5));
    for (let i = 5; i < rows.length; i += 6) {
      chunks.push(rows.slice(i, i + 6));
    }
  } else {
    chunks.push([]);
  }

  const sheetsHtml: string[] = [];

  chunks.forEach((chunk, pageIndex) => {
    const isFirstPage = pageIndex === 0;
    const isLastTablePage = pageIndex === chunks.length - 1;

    const titleAndHeadHtml = isFirstPage ? `
          <div class="title-box">
            <h1>Checklist Bulanan APAR</h1>
            <h2>${esc(docData.siteName || 'JPM Dukuh Atas')}</h2>
            <div class="title-meta">
              <span>${esc(docData.periodLabel)}</span>
              <span>Tanggal : <span class="num">${esc(docData.inspectionDate)}</span></span>
            </div>
          </div>
        ` : '';

    const theadHtml = isFirstPage ? `
          <thead>
            <tr>
              <th>No</th>
              <th>Zona</th>
              <th>Kode<br>APAR</th>
              <th>Periode<br>Expired</th>
              <th>Dokumentasi<br>Kartu Checklist</th>
              <th>Dokumentasi<br>Berat APAR Co<sup>2</sup></th>
              <th>Dokumentasi<br>Pengecekan</th>
            </tr>
          </thead>
        ` : '';

    let tailHtml = '';
    if (isLastTablePage) {
      tailHtml += renderKadaluwarsaBlock(docData);
      tailHtml += renderCatatanAndSignaturesBlock(docData);
    }

    sheetsHtml.push(`
          <div class="print-sheet">
            ${renderKopHeader()}
            ${titleAndHeadHtml}
            <table class="apar-table ${isFirstPage ? 'page-1-table' : ''}">
              ${renderTableColGroup()}
              ${theadHtml}
              <tbody>
                ${renderUnitRowsHtml(chunk)}
              </tbody>
            </table>
            ${tailHtml}
          </div>
        `);
  });

  return sheetsHtml.join('\n');
}

/* ── Foto live per inspeksi → slot kolom demo ───────────────────────────────── */

interface FotoSlot {
  kartu?: string;
  berat?: string;
  cek: string[];
}

/** Cermin `useBuktiCetak` Hydrant: satu efek untuk N rekam, kunci string stabil. */
function useFotoSlotApar(inspeksiIds: string[]): Record<string, FotoSlot> {
  const [peta, setPeta] = useState<Record<string, FotoSlot>>({});
  const kunci = inspeksiIds.join('|');
  useEffect(() => {
    if (inspeksiIds.length === 0) {
      setPeta({});
      return;
    }
    let batal = false;
    void (async () => {
      const hasil = await Promise.all(
        inspeksiIds.map(async (id) => {
          try {
            const res = await ambilFotoInspeksi('apar', id);
            const slot: FotoSlot = { cek: [] };
            for (const f of res.items) {
              if (f.temuan) continue;
              const caption = (f.caption ?? '').trim().toLowerCase();
              const url = livePhotoUrl(f.id);
              if (caption === 'kartu apar' && !slot.kartu) slot.kartu = url;
              else if (caption === 'penimbangan co2' && !slot.berat) slot.berat = url;
              else if (caption === 'pengecekan fisik') slot.cek.push(url);
            }
            return [id, slot] as const;
          } catch {
            return [id, { cek: [] }] as const;
          }
        }),
      );
      if (!batal) setPeta(Object.fromEntries(hasil));
    })();
    return () => {
      batal = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- kunci string stabil per daftar id
  }, [kunci]);
  return peta;
}

/**
 * Pratinjau cetak APAR: markup demo EXACT (kelas + struktur sama) dengan data
 * live dipetakan ke bentuk demo (units → rows, inspections → tanggal/catatan,
 * expiredDate → blok kadaluwarsa). Tanpa endpoint baru.
 */
export const AparPrintPreview: React.FC<AparPrintPreviewProps> = ({ bulan, onKembali }) => {
  const period = /^\d{4}-\d{2}$/.test(bulan ?? '') ? (bulan as string) : bulanBerjalan();

  const lokasi = useKonteksLokasi();
  const unitQuery = useUnitApar();
  const inspeksiQuery = useInspeksiApar();

  const unitSite = useMemo(
    () => (unitQuery.data ?? []).filter((u) => u.siteId === lokasi.siteId),
    [unitQuery.data, lokasi.siteId],
  );
  const inspeksiSite = useMemo(() => {
    const idUnit = new Set(unitSite.map((u) => u.id));
    return (inspeksiQuery.data ?? []).filter((i) => idUnit.has(i.unitId));
  }, [inspeksiQuery.data, unitSite]);

  const units = useMemo(
    () => petakanUnitApar(unitSite, inspeksiSite, lokasi.zonaIdKeNama, period),
    [unitSite, inspeksiSite, lokasi.zonaIdKeNama, period],
  );

  const inspeksiBulan = useMemo(
    () => inspeksiSite.filter((i) => i.period.startsWith(period)),
    [inspeksiSite, period],
  );
  const inspeksiPerUnit = useMemo(() => {
    const peta = new Map<string, (typeof inspeksiBulan)[number]>();
    for (const i of inspeksiBulan) peta.set(i.unitId, i);
    return peta;
  }, [inspeksiBulan]);

  const inspeksiIds = useMemo(() => inspeksiBulan.map((i) => i.id), [inspeksiBulan]);
  const slotFoto = useFotoSlotApar(inspeksiIds);

  const monthDate = useMemo(() => {
    const [y, m] = period.split('-').map(Number);
    return new Date(y, m - 1, 1);
  }, [period]);
  const monthLabel = format(monthDate, 'MMMM yyyy', { locale: idLocale });

  const tanggalInspeksi = useMemo(() => {
    if (inspeksiBulan.length === 0) return '';
    const terbaru = inspeksiBulan.map((i) => i.createdAt).sort().at(-1) as string;
    return formatIndonesianDate(terbaru);
  }, [inspeksiBulan]);

  const catatan = useMemo(() => {
    const unik: string[] = [];
    for (const i of inspeksiBulan) {
      const t = (i.notes ?? '').trim();
      if (t && !unik.includes(t)) unik.push(t);
    }
    return unik.join('\n');
  }, [inspeksiBulan]);

  const rows: BarisCetak[] = useMemo(
    () =>
      units.map((u, idx) => {
        const insp = inspeksiPerUnit.get(u.id);
        const slot = insp ? slotFoto[insp.id] : undefined;
        const tampil = formatIndonesianDate(u.expiredDate) || u.expiredDate;
        return {
          no: idx + 1,
          zoneName: u.zoneName,
          kode: u.kode,
          expiredDate: tampil,
          kartuSrc: slot?.kartu,
          beratSrc: slot?.berat,
          pengecekanSrc: slot?.cek[0],
          pengecekanExtraSrc: slot?.cek[1],
        };
      }),
    [units, inspeksiPerUnit, slotFoto],
  );

  const expiryRows = useMemo(() => {
    const grup = new Map<string, { kunci: number; no: number[] }>();
    rows.forEach((r) => {
      const key = String(r.expiredDate || '').trim();
      if (!key) return;
      const mentah = units[r.no - 1]?.expiredDate ?? '';
      const t = parseISO(mentah);
      const kunciUrut = isValid(t) ? t.getTime() : Number.POSITIVE_INFINITY;
      const g = grup.get(key) ?? { kunci: kunciUrut, no: [] };
      g.no.push(r.no);
      if (kunciUrut < g.kunci) g.kunci = kunciUrut;
      grup.set(key, g);
    });
    return [...grup.entries()]
      .sort((a, b) => a[1].kunci - b[1].kunci)
      .map(([periodeKadaluwarsa, g], idx) => ({
        no: idx < 3 ? `${idx + 1}.` : `${idx + 1}`,
        periodeKadaluwarsa,
        totalApar: g.no.length,
        noApar: formatNoList(g.no.map(String)),
      }));
  }, [rows, units]);

  const doc: DokCetak = useMemo(
    () => ({
      siteName: lokasi.siteName,
      periodLabel: `Periode : ${monthLabel}`,
      inspectionDate: tanggalInspeksi,
      notes: catatan,
      signers: {
        dibuatNama: '',
        dibuatJabatan: 'Danru',
        diketahuiNama: '',
        diketahuiJabatan: 'Operational & TR',
        disetujuiNama: '',
        disetujuiJabatan: 'Building Management',
      },
      rows,
      expiryRows,
    }),
    [lokasi.siteName, monthLabel, tanggalInspeksi, catatan, rows, expiryRows],
  );

  const sheetsHtml = useMemo(() => renderAparDocumentSheets(doc), [doc]);
  const memuat = unitQuery.isPending || inspeksiQuery.isPending;

  return (
    <div className="flex-1 flex flex-col min-h-screen overflow-y-auto bg-[var(--bg-main)] text-[var(--primary)] px-6 py-4 font-sans select-none">
      <style>{PRINT_TEMPLATE_CSS}</style>
      {/* Bilah alat layar saja — disembunyikan saat mencetak. */}
      <div className="no-print flex items-center gap-3 pb-3 mb-4 border-b border-[var(--border)]">
        <button
          type="button"
          onClick={onKembali}
          className="px-3 py-1.5 text-xs font-semibold rounded-[4px] border border-[var(--border)] hover:bg-[var(--bg-hover)] cursor-pointer pressable"
        >
          ← Kembali
        </button>
        <div className="flex flex-col">
          <h1 className="text-sm font-bold tracking-tight">Pratinjau Cetak APAR</h1>
          <p className="text-xs text-[var(--muted)] tabular-nums">
            {lokasi.siteName} · Periode {period}
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          disabled={memuat}
          className="ml-auto px-4 py-1.5 text-xs font-semibold rounded-[4px] text-white bg-[#2f80ed] cursor-pointer pressable disabled:opacity-40 disabled:cursor-not-allowed tabular-nums"
        >
          {memuat ? 'Memuat…' : 'Cetak / Simpan PDF'}
        </button>
      </div>

      {memuat ? (
        <p className="no-print text-xs text-[var(--muted)] tabular-nums">Memuat data inspeksi…</p>
      ) : (
        <>
          <div dangerouslySetInnerHTML={{ __html: sheetsHtml }} />
          <div id="pdf-ready" data-status="ready"></div>
        </>
      )}
    </div>
  );
};
