import React, { useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
  detectP3kBoxType,
  getStandardP3kItemsForType,
  P3K_BOX_TYPES,
  type P3kBoxType,
} from '@/lib/p3kItems';
import {
  PROCEDURAL_PRINT_CSS,
  renderP3kYearlySheet,
  type P3kYearlyPrintPayload,
} from '@/lib/proceduralPrintTemplates';
import { petakanGridP3k } from './petaApi';
import { useInspeksiP3k, useKotakP3k } from '@/services/api/queries';
import { useKonteksLokasi } from '@/features/konteksLokasi';
import { MONTH_KEYS, MONTH_SHORT, markFor, type P3kYearGrid } from './types';

interface P3kPrintPreviewProps {
  tahun?: string;
  autoPrint?: boolean;
  onKembali: () => void;
}

function fmtTanggalSingkat(iso?: string): string {
  if (!iso) return '';
  try {
    return format(parseISO(iso), 'dd-MMM-yy', { locale: idLocale });
  } catch {
    return iso;
  }
}

function bacaTipeAwal(): P3kBoxType {
  try {
    const p = new URLSearchParams(window.location.search).get('tipe')?.toUpperCase();
    if (p === 'B' || p === 'C') return p;
    return 'A';
  } catch {
    return 'A';
  }
}

export const P3kPrintPreview: React.FC<P3kPrintPreviewProps> = ({
  tahun,
  autoPrint,
  onKembali,
}) => {
  const [year, setYear] = useState<string>(() =>
    /^\d{4}$/.test(tahun ?? '') ? (tahun as string) : String(new Date().getFullYear()),
  );
  const [boxType, setBoxType] = useState<P3kBoxType>(bacaTipeAwal);
  const [unitKerja, setUnitKerja] = useState('HSE');

  // Handsign / Penandatangan (kosongkan jika tidak ingin dicetak)
  const [parafOverride, setParafOverride] = useState('');
  const [diperiksaNama, setDiperiksaNama] = useState('Takamay Jason Hermantika Irsyad');
  const [diperiksaJabatan, setDiperiksaJabatan] = useState('Junior HSE Analyst');
  const [mengetahuiNama, setMengetahuiNama] = useState('Hizri');
  const [mengetahuiJabatan, setMengetahuiJabatan] = useState('Governance, Risk, HSE & Quality Group Head');

  const lokasi = useKonteksLokasi();
  const kotakQuery = useKotakP3k();
  const inspeksiQuery = useInspeksiP3k();

  const daftarKotakSite = useMemo(
    () => (kotakQuery.data ?? []).filter((b) => b.siteId === lokasi.siteId),
    [kotakQuery.data, lokasi.siteId],
  );

  const unitIdParam = useMemo(() => {
    try { return new URLSearchParams(window.location.search).get('unit') ?? ''; } catch { return ''; }
  }, []);
  const kotak = useMemo(() => {
    if (unitIdParam) {
      const exact = daftarKotakSite.find((b) => b.id === unitIdParam && detectP3kBoxType(b.name) === boxType);
      if (exact) return exact;
    }
    const byType = daftarKotakSite.find((b) => detectP3kBoxType(b.name) === boxType);
    return byType ?? daftarKotakSite[0] ?? null;
  }, [daftarKotakSite, boxType, unitIdParam]);

  const itemsCatalog = useMemo(() => getStandardP3kItemsForType(boxType), [boxType]);

  const grid: P3kYearGrid = useMemo(
    () => (kotak ? petakanGridP3k([kotak], inspeksiQuery.data ?? [], year)[kotak.id] ?? {} : {}),
    [kotak, inspeksiQuery.data, year],
  );

  const payload: P3kYearlyPrintPayload = useMemo(() => {
    const tanggalInspeksi = MONTH_KEYS.map((m) => fmtTanggalSingkat(grid[m]?.tanggal ?? ''));
    const parafInisial = MONTH_KEYS.map((m) => {
      if (parafOverride.trim()) return grid[m]?.tanggal ? parafOverride.trim() : '';
      return (grid[m]?.paraf ?? '').trim();
    });

    const items = itemsCatalog.map((std, idx) => {
      const months = MONTH_KEYS.map((m) => {
        const mark = markFor(std.id, std.standardQty, grid[m]);
        if (mark === 'standar') return 'STANDAR';
        if (mark === 'kurang') return 'DIBAWAH_STANDAR';
        if (mark === 'kd') return 'KADALUARSA';
        return null;
      });
      const kurangMonths: string[] = [];
      const kdMonths: string[] = [];
      MONTH_KEYS.forEach((m, i) => {
        const mark = markFor(std.id, std.standardQty, grid[m]);
        if (mark === 'kurang') kurangMonths.push(MONTH_SHORT[i]);
        else if (mark === 'kd') kdMonths.push(MONTH_SHORT[i]);
      });
      const parts: string[] = [];
      if (kdMonths.length) parts.push(`KD: ${kdMonths.join(', ')}`);
      if (kurangMonths.length) parts.push(`Kurang: ${kurangMonths.join(', ')}`);
      return {
        no: idx + 1,
        itemName: std.displayName || std.name,
        standardQty: std.standardQty,
        months,
        keterangan: parts.join(' · '),
      };
    });

    const lokasiLabel =
      boxType === 'A'
        ? `${lokasi.siteName} — Lantai 2 (Kotak Tipe A)`
        : boxType === 'B'
        ? `${lokasi.siteName} — Lantai 3 (Kotak Tipe B)`
        : `${lokasi.siteName} — Kotak Tipe C`;

    return {
      tahun: year,
      unitKerja,
      boxType,
      siteName: lokasiLabel,
      tanggalInspeksi,
      parafInisial,
      items,
      signatures: {
        diperiksaNama,
        diperiksaJabatan,
        mengetahuiNama,
        mengetahuiJabatan,
      },
    };
  }, [
    year,
    unitKerja,
    boxType,
    lokasi.siteName,
    grid,
    itemsCatalog,
    parafOverride,
    diperiksaNama,
    diperiksaJabatan,
    mengetahuiNama,
    mengetahuiJabatan,
  ]);

  const sheetsHtml = useMemo(() => renderP3kYearlySheet(payload), [payload]);
  const memuat = kotakQuery.isPending || inspeksiQuery.isPending;

  useEffect(() => {
    if (!autoPrint || memuat) return;
    const t = window.setTimeout(() => {
      window.print();
    }, 350);
    return () => window.clearTimeout(t);
  }, [autoPrint, memuat]);

  return (
    <div className="flex-1 flex flex-col min-h-screen overflow-y-auto bg-slate-100 text-slate-900 px-6 py-4 font-sans select-none">
      <style>{`@page { size: A4 landscape; margin: 8mm 10mm; }\n${PROCEDURAL_PRINT_CSS}`}</style>

      <div className="no-print space-y-3 pb-3 mb-4 border-b border-slate-300 bg-white px-4 py-3 rounded-[6px] shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onKembali}
            className="px-3 py-1.5 text-xs font-semibold rounded-[4px] border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 cursor-pointer pressable"
          >
            ← Kembali ke Halaman Kotak P3K
          </button>

          <div className="flex flex-col">
            <h1 className="text-sm font-bold tracking-tight text-slate-900">
              Pratinjau Cetak Inspeksi Kotak P3K — {P3K_BOX_TYPES[boxType].label}
            </h1>
            <p className="text-xs text-slate-500 tabular-nums">
              {lokasi.siteName} · Tahun {year} · {P3K_BOX_TYPES[boxType].floorDefault}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <label className="font-semibold text-slate-700">Tipe Kotak:</label>
            <select
              value={boxType}
              onChange={(e) => setBoxType(e.target.value as P3kBoxType)}
              className="px-2.5 py-1 rounded-[4px] border border-slate-300 bg-white text-slate-900 font-semibold"
            >
              <option value="A">Tipe A (≤ 25 Pekerja)</option>
              <option value="B">Tipe B (≤ 50 Pekerja)</option>
              <option value="C">Tipe C (≤ 100 Pekerja)</option>
            </select>

            <label className="font-semibold text-slate-700">Tahun:</label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="px-2.5 py-1 rounded-[4px] border border-slate-300 bg-white text-slate-900 font-semibold tabular-nums"
            >
              {['2025', '2026', '2027'].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <label className="font-semibold text-slate-700">Unit Kerja:</label>
            <input
              type="text"
              value={unitKerja}
              onChange={(e) => setUnitKerja(e.target.value)}
              className="w-24 px-2 py-1 rounded-[4px] border border-slate-300 bg-white text-slate-900 font-semibold"
            />
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            disabled={memuat}
            className="ml-auto px-4 py-1.5 text-xs font-semibold rounded-[4px] text-white bg-[#2f80ed] hover:bg-[#2b77d4] cursor-pointer pressable disabled:opacity-40 disabled:cursor-not-allowed tabular-nums"
          >
            {memuat ? 'Memuat…' : 'Cetak / Simpan PDF'}
          </button>
        </div>

        {/* Kolom Handsign / Penandatangan — kosongkan jika tidak dicetak */}
        <div className="pt-2.5 border-t border-slate-200 flex flex-wrap items-end gap-2 text-[11px]">
          <span className="font-bold text-slate-700 mr-1 self-center">
            Handsign / Penandatangan <span className="font-normal text-slate-500">(kosongkan jika tidak dicetak):</span>
          </span>
          <input
            type="text"
            value={parafOverride}
            onChange={(e) => setParafOverride(e.target.value)}
            placeholder="Override Paraf Tabel (opsional)"
            className="w-44 px-2 py-1 rounded border border-slate-300 bg-white text-slate-900"
          />
          <input
            type="text"
            value={diperiksaNama}
            onChange={(e) => setDiperiksaNama(e.target.value)}
            placeholder="Diperiksa Oleh"
            className="w-48 px-2 py-1 rounded border border-slate-300 bg-white text-slate-900"
          />
          <input
            type="text"
            value={diperiksaJabatan}
            onChange={(e) => setDiperiksaJabatan(e.target.value)}
            placeholder="Jabatan Diperiksa"
            className="w-36 px-2 py-1 rounded border border-slate-300 bg-white text-slate-900"
          />
          <input
            type="text"
            value={mengetahuiNama}
            onChange={(e) => setMengetahuiNama(e.target.value)}
            placeholder="Mengetahui / Disetujui"
            className="w-40 px-2 py-1 rounded border border-slate-300 bg-white text-slate-900"
          />
          <input
            type="text"
            value={mengetahuiJabatan}
            onChange={(e) => setMengetahuiJabatan(e.target.value)}
            placeholder="Jabatan Mengetahui"
            className="w-52 px-2 py-1 rounded border border-slate-300 bg-white text-slate-900"
          />
        </div>
      </div>

      {memuat ? (
        <p className="no-print text-xs text-slate-600 tabular-nums">Memuat data inspeksi P3K…</p>
      ) : (
        <div className="procedural-print-canvas">
          <div dangerouslySetInnerHTML={{ __html: sheetsHtml }} />
          <div id="pdf-ready" data-status="ready"></div>
        </div>
      )}
    </div>
  );
};
