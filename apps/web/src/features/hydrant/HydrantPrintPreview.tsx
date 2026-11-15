import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { HydrantPrintKertas, HydrantPrintSignatures } from './HydrantPrintChrome';
import type { HydrantFindingItem } from './types';
import {
  petakanUnitHidran,
  useFotoInspeksi,
  useInspeksiHidran,
  useUnitHidran,
} from '@/services/api/queries';
import { useKonteksLokasi } from '@/features/konteksLokasi';

interface HydrantPrintPreviewProps {
  /** Kunci bulan YYYY-MM dari query `?bulan=`; bawaan = bulan berjalan. */
  bulan?: string;
  onKembali: () => void;
}

function bulanBerjalan(): string {
  return format(new Date(), 'yyyy-MM');
}

/**
 * Pratinjau cetak Hydrant: merender KEDUA kertas resmi (checklist portrait +
 * laporan landscape) dari query live yang sama dengan HydrantPage — tanpa
 * endpoint baru. Kertas adalah komponen yang sama (`HydrantPrintKertas`),
 * jadi pratinjau dan Cetak tidak bisa menyimpang.
 *
 * Kertas memakai tinta hitam di atas putih (kertas terang) walau aplikasi
 * sedang mode gelap; bilah alat disembunyikan saat mencetak (`no-print`).
 */
export const HydrantPrintPreview: React.FC<HydrantPrintPreviewProps> = ({ bulan, onKembali }) => {
  const period = /^\d{4}-\d{2}$/.test(bulan ?? '') ? (bulan as string) : bulanBerjalan();

  const lokasi = useKonteksLokasi();
  const unitQuery = useUnitHidran();
  const inspeksiQuery = useInspeksiHidran();

  // Penyaringan lokasi + bulan sama persis dengan HydrantPage.
  const unitSite = useMemo(
    () => (unitQuery.data ?? []).filter((u) => u.siteId === lokasi.siteId),
    [unitQuery.data, lokasi.siteId],
  );
  const inspeksiSite = useMemo(() => {
    const idUnit = new Set(unitSite.map((u) => u.id));
    return (inspeksiQuery.data ?? []).filter((i) => idUnit.has(i.unitId));
  }, [inspeksiQuery.data, unitSite]);

  const units = useMemo(
    () => petakanUnitHidran(unitSite, inspeksiSite, lokasi.zonaIdKeNama, period),
    [unitSite, inspeksiSite, lokasi.zonaIdKeNama, period],
  );

  const jangkarTemuan = inspeksiSite.find((i) => i.period.startsWith(period))?.id ?? null;
  const fotoTemuan = useFotoInspeksi(jangkarTemuan, 'hydrant');
  const findings: HydrantFindingItem[] = useMemo(
    () =>
      (fotoTemuan.data ?? [])
        .filter((f) => f.temuan)
        .map((f) => ({
          id: f.id,
          imageUrl: f.url,
          description: f.caption || 'Temuan dokumentasi',
        })),
    [fotoTemuan.data],
  );

  const memuat = unitQuery.isPending || inspeksiQuery.isPending;

  return (
    <div className="flex-1 flex flex-col min-h-screen overflow-y-auto bg-[var(--bg-main)] text-[var(--primary)] px-6 py-4 font-sans select-none">
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
          <h1 className="text-sm font-bold tracking-tight">Pratinjau Cetak Hydrant</h1>
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
        <div className="hyd-print-area bg-white text-black rounded-[8px] shadow-sm px-6 py-6 print:shadow-none print:rounded-none print:px-0 print:py-0">
          <HydrantPrintKertas
            siteName={lokasi.siteName}
            period={period}
            units={units}
            inspeksi={inspeksiSite}
            findings={findings}
            selaluTampil
          />
          {/* Jeda halaman sebelum tanda tangan agar ikut kertas 2 (landscape). */}
          <HydrantPrintSignatures selaluTampil />
        </div>
      )}
    </div>
  );
};
