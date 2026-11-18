import React, { useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { PrintCustomizationBar } from '@/components/ui';
import { usePrintHeaderImages } from '@/lib/printHeaderConfig';
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
import { ambilButirP3k, type ApiInspeksiP3k } from '@/services/api/klien';
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

  const { config: headerLogos, setConfig: setHeaderLogos } = usePrintHeaderImages();

  // Customizable Header
  const [judulDokumen, setJudulDokumen] = useState('');
  const [unitKerja, setUnitKerja] = useState('HSE');
  const [lokasiKerjaOverride, setLokasiKerjaOverride] = useState('');
  const [keteranganLabel, setKeteranganLabel] = useState(
    'Keterangan: Standar ( ✓ ) | Tidak Standar ( ✗ ) | Kadaluarsa (KD)',
  );

  // Handsign / Penandatangan (kosongkan jika tidak ingin dicetak)
  const [parafOverride, setParafOverride] = useState('');
  const [diperiksaHeader, setDiperiksaHeader] = useState('Diperiksa Oleh :');
  const [diperiksaNama, setDiperiksaNama] = useState('Takamay Jason Hermantika Irsyad');
  const [diperiksaJabatan, setDiperiksaJabatan] = useState('Junior HSE Analyst');
  const [diketahuiHeader, setDiketahuiHeader] = useState('Diketahui Oleh :');
  const [diketahuiNama, setDiketahuiNama] = useState('');
  const [diketahuiJabatan, setDiketahuiJabatan] = useState('');
  const [mengetahuiHeader, setMengetahuiHeader] = useState('Mengetahui / Disetujui Oleh :');
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
    try {
      return new URLSearchParams(window.location.search).get('unit') ?? '';
    } catch {
      return '';
    }
  }, []);

  const kotak = useMemo(() => {
    if (unitIdParam) {
      const exact = daftarKotakSite.find(
        (b) => b.id === unitIdParam && detectP3kBoxType(b.name) === boxType,
      );
      if (exact) return exact;
    }
    const byType = daftarKotakSite.find((b) => detectP3kBoxType(b.name) === boxType);
    return byType ?? daftarKotakSite[0] ?? null;
  }, [daftarKotakSite, boxType, unitIdParam]);

  const itemsCatalog = useMemo(() => getStandardP3kItemsForType(boxType), [boxType]);

  const [hydratedItemsById, setHydratedItemsById] = useState<
    Record<string, NonNullable<ApiInspeksiP3k['items']>>
  >({});
  const [hydratingItems, setHydratingItems] = useState(false);

  const missingItemInspIds = useMemo(() => {
    if (!kotak) return [];
    return (inspeksiQuery.data ?? [])
      .filter(
        (i) =>
          i.boxId === kotak.id &&
          i.period.startsWith(`${year}-`) &&
          (!i.items || i.items.length === 0) &&
          !hydratedItemsById[i.id],
      )
      .map((i) => i.id);
  }, [kotak, inspeksiQuery.data, year, hydratedItemsById]);

  useEffect(() => {
    if (missingItemInspIds.length === 0) return;
    let cancelled = false;
    setHydratingItems(true);
    void Promise.all(
      missingItemInspIds.map(async (id) => {
        try {
          const detail = await ambilButirP3k(id);
          return [id, detail.items ?? []] as const;
        } catch {
          return [id, []] as const;
        }
      }),
    ).then((entries) => {
      if (cancelled) return;
      setHydratedItemsById((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
      setHydratingItems(false);
    });
    return () => {
      cancelled = true;
    };
  }, [missingItemInspIds]);

  const inspeksiWithItems = useMemo(
    () =>
      (inspeksiQuery.data ?? []).map((i) =>
        i.items && i.items.length > 0 ? i : { ...i, items: hydratedItemsById[i.id] ?? [] },
      ),
    [inspeksiQuery.data, hydratedItemsById],
  );

  const grid: P3kYearGrid = useMemo(
    () => (kotak ? petakanGridP3k([kotak], inspeksiWithItems, year)[kotak.id] ?? {} : {}),
    [kotak, inspeksiWithItems, year],
  );

  const defaultLokasiLabel = `${lokasi.siteName || 'Kantor Pusat'} — Kotak Tipe ${boxType}`;

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

    return {
      headerLogos,
      documentTitle: judulDokumen.trim() || `INSPEKSI KOTAK P3K (TIPE ${boxType})`,
      keteranganLabel: keteranganLabel.trim() || undefined,
      tahun: year,
      unitKerja,
      boxType,
      siteName: lokasiKerjaOverride.trim() || defaultLokasiLabel,
      tanggalInspeksi,
      parafInisial,
      items,
      signatures: {
        diperiksaHeader,
        diperiksaNama,
        diperiksaJabatan,
        diketahuiHeader,
        diketahuiNama,
        diketahuiJabatan,
        mengetahuiHeader,
        mengetahuiNama,
        mengetahuiJabatan,
      },
    };
  }, [
    headerLogos,
    judulDokumen,
    keteranganLabel,
    year,
    unitKerja,
    boxType,
    lokasiKerjaOverride,
    defaultLokasiLabel,
    grid,
    itemsCatalog,
    parafOverride,
    diperiksaHeader,
    diperiksaNama,
    diperiksaJabatan,
    diketahuiHeader,
    diketahuiNama,
    diketahuiJabatan,
    mengetahuiHeader,
    mengetahuiNama,
    mengetahuiJabatan,
  ]);

  const sheetsHtml = useMemo(() => renderP3kYearlySheet(payload), [payload]);
  const memuat = kotakQuery.isPending || inspeksiQuery.isPending || hydratingItems;

  useEffect(() => {
    if (!autoPrint || memuat) return;
    const t = window.setTimeout(() => {
      window.print();
    }, 350);
    return () => window.clearTimeout(t);
  }, [autoPrint, memuat]);

  const resetDefaults = () => {
    setJudulDokumen('');
    setUnitKerja('HSE');
    setLokasiKerjaOverride('');
    setKeteranganLabel('Keterangan: Standar ( ✓ ) | Tidak Standar ( ✗ ) | Kadaluarsa (KD)');
    setParafOverride('');
    setDiperiksaHeader('Diperiksa Oleh :');
    setDiperiksaNama('Takamay Jason Hermantika Irsyad');
    setDiperiksaJabatan('Junior HSE Analyst');
    setDiketahuiHeader('Diketahui Oleh :');
    setDiketahuiNama('');
    setDiketahuiJabatan('');
    setMengetahuiHeader('Mengetahui / Disetujui Oleh :');
    setMengetahuiNama('Hizri');
    setMengetahuiJabatan('Governance, Risk, HSE & Quality Group Head');
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen overflow-y-auto bg-[#fafafa] print:bg-white text-neutral-900 px-6 py-4 print:p-0 font-sans select-none">
      <style>{`@page { size: A4 landscape; margin: 0; }\n${PROCEDURAL_PRINT_CSS}`}</style>

      <PrintCustomizationBar
        backLabel="← Kembali ke Halaman Kotak P3K"
        onKembali={onKembali}
        title={`Pratinjau Cetak Inspeksi Kotak P3K — ${P3K_BOX_TYPES[boxType].label}`}
        subtitle={`${lokasi.siteName} · Tahun ${year}`}
        memuat={memuat}
        onPrint={() => window.print()}
        onResetDefaults={resetDefaults}
        onClearSigners={() => {
          setDiperiksaNama('');
          setDiketahuiNama('');
          setMengetahuiNama('');
        }}
        extraControls={
          <div className="flex items-center gap-2 text-xs">
            <label className="font-semibold text-neutral-600">Tipe:</label>
            <select
              value={boxType}
              onChange={(e) => setBoxType(e.target.value as P3kBoxType)}
              className="px-2.5 py-1 rounded-[5px] border border-neutral-200 bg-white text-neutral-900 font-semibold"
            >
              <option value="A">Tipe A (≤ 25 Pekerja)</option>
              <option value="B">Tipe B (≤ 50 Pekerja)</option>
              <option value="C">Tipe C (≤ 100 Pekerja)</option>
            </select>

            <label className="font-semibold text-neutral-600">Tahun:</label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="px-2.5 py-1 rounded-[5px] border border-neutral-200 bg-white text-neutral-900 font-semibold tabular-nums"
            >
              {['2025', '2026', '2027'].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        }
        headerImageConfig={headerLogos}
        onHeaderImageChange={setHeaderLogos}
        headerFields={[
          {
            key: 'judul',
            label: 'Judul Dokumen',
            value: judulDokumen,
            onChange: setJudulDokumen,
            placeholder: `INSPEKSI KOTAK P3K (TIPE ${boxType})`,
          },
          {
            key: 'unitKerja',
            label: 'Unit Kerja',
            value: unitKerja,
            onChange: setUnitKerja,
          },
          {
            key: 'lokasiKerja',
            label: 'Lokasi Kerja',
            value: lokasiKerjaOverride,
            onChange: setLokasiKerjaOverride,
            placeholder: defaultLokasiLabel,
          },
          {
            key: 'keterangan',
            label: 'Teks Keterangan',
            value: keteranganLabel,
            onChange: setKeteranganLabel,
          },
        ]}
        extraSignerControls={
          <label className="block max-w-xs space-y-1">
            <span className="block text-[11px] font-medium text-neutral-600">
              Override Paraf Tabel (opsional)
            </span>
            <input
              type="text"
              value={parafOverride}
              onChange={(e) => setParafOverride(e.target.value)}
              placeholder="Kosongkan untuk pakai paraf per bulan"
              className="w-full px-2.5 py-1 text-xs rounded-[5px] border border-neutral-200 bg-white text-neutral-900"
            />
          </label>
        }
        signerFields={[
          {
            id: 'diperiksa',
            headerLabel: diperiksaHeader,
            onHeaderLabelChange: setDiperiksaHeader,
            nama: diperiksaNama,
            onNamaChange: setDiperiksaNama,
            jabatan: diperiksaJabatan,
            onJabatanChange: setDiperiksaJabatan,
          },
          {
            id: 'diketahui',
            headerLabel: diketahuiHeader,
            onHeaderLabelChange: setDiketahuiHeader,
            nama: diketahuiNama,
            onNamaChange: setDiketahuiNama,
            jabatan: diketahuiJabatan,
            onJabatanChange: setDiketahuiJabatan,
          },
          {
            id: 'mengetahui',
            headerLabel: mengetahuiHeader,
            onHeaderLabelChange: setMengetahuiHeader,
            nama: mengetahuiNama,
            onNamaChange: setMengetahuiNama,
            jabatan: mengetahuiJabatan,
            onJabatanChange: setMengetahuiJabatan,
          },
        ]}
      />

      {memuat ? (
        <p className="no-print text-xs text-neutral-600 tabular-nums text-center py-8">
          Memuat data inspeksi P3K…
        </p>
      ) : (
        <div className="procedural-print-canvas">
          <div dangerouslySetInnerHTML={{ __html: sheetsHtml }} />
          <div id="pdf-ready" data-status="ready"></div>
        </div>
      )}
    </div>
  );
};
