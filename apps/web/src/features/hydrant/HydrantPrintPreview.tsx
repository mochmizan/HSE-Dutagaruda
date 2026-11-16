import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
  PROCEDURAL_PRINT_CSS,
  renderHydrantLaporanSheet,
  renderHydrantMonthlySheets,
  type HydrantLaporanPrintPayload,
  type HydrantMonthlyPrintPayload,
} from '@/lib/proceduralPrintTemplates';
import { ambilFotoInspeksi, type ApiFoto } from '@/services/api/klien';
import { livePhotoUrl } from '@/services/api/liveClient';
import {
  petakanUnitHidran,
  useFotoInspeksi,
  useInspeksiHidran,
  useUnitHidran,
} from '@/services/api/queries';
import { useKonteksLokasi } from '@/features/konteksLokasi';

export type ModeCetakHydrant = 'checklist' | 'laporan' | 'semua';

interface HydrantPrintPreviewProps {
  /** Kunci bulan YYYY-MM dari query `?bulan=`; bawaan = bulan berjalan. */
  bulan?: string;
  /** Mode cetak awal (`checklist` = Portrait, `laporan` = Landscape, `semua` = keduanya). */
  modeAwal?: ModeCetakHydrant;
  /** Cetak otomatis begitu muatan siap. */
  autoPrint?: boolean;
  onKembali: () => void;
}

function bulanBerjalan(): string {
  return format(new Date(), 'yyyy-MM');
}

const BULAN_PENDEK = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function tanggalSingkat(iso?: string): string {
  if (!iso) return '16-Sep-26';
  const m = iso.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return '16-Sep-26';
  return `${Number(m[3])}-${BULAN_PENDEK[Number(m[2]) - 1] ?? ''}-${m[1].slice(2)}`;
}

function statusTeksHydrant(status?: string): string {
  if (status === 'LAYAK') return 'Layak\ndigunakan';
  if (status === 'LAYAK_DENGAN_CATATAN') return 'Layak di\ngunakan\ndengan\ncatatan';
  return 'Tidak layak\ndigunakan';
}

interface BuktiHydrantSlot {
  pemeriksaan?: string;
  checklist?: string;
}

function useBuktiHydrant(inspeksiIds: string[]): { peta: Record<string, BuktiHydrantSlot>; selesai: boolean } {
  const [peta, setPeta] = useState<Record<string, BuktiHydrantSlot>>({});
  const [selesai, setSelesai] = useState(false);
  const kunci = inspeksiIds.join('|');
  useEffect(() => {
    if (inspeksiIds.length === 0) {
      setPeta({});
      setSelesai(true);
      return;
    }
    let batal = false;
    setSelesai(false);
    void (async () => {
      const hasil = await Promise.all(
        inspeksiIds.map(async (id) => {
          try {
            const res = await ambilFotoInspeksi('hydrant', id);
            const items = (res.items as (ApiFoto & { createdAt: string })[])
              .slice()
              .sort((a, b) => (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0));
            const bukti = items.filter((f) => !f.temuan);
            const temuan = items.filter((f) => f.temuan);
            return [
              id,
              {
                pemeriksaan: bukti[0] ? livePhotoUrl(bukti[0].id) : undefined,
                checklist: bukti[1]
                  ? livePhotoUrl(bukti[1].id)
                  : temuan[0]
                    ? livePhotoUrl(temuan[0].id)
                    : undefined,
              },
            ] as const;
          } catch {
            return [id, {}] as const;
          }
        }),
      );
      if (!batal) {
        setPeta(Object.fromEntries(hasil));
        setSelesai(true);
      }
    })();
    return () => {
      batal = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kunci]);
  return { peta, selesai };
}

function mapStatusAlat(st?: string): string {
  if (st === 'LAYAK') return 'STANDAR';
  if (st === 'TIDAK_LAYAK') return 'DIBAWAH';
  if (st === 'HILANG') return 'HILANG';
  return 'STANDAR';
}

export const HydrantPrintPreview: React.FC<HydrantPrintPreviewProps> = ({
  bulan,
  modeAwal = 'checklist',
  autoPrint,
  onKembali,
}) => {
  const period = /^\d{4}-\d{2}$/.test(bulan ?? '') ? (bulan as string) : bulanBerjalan();
  const [mode, setMode] = useState<ModeCetakHydrant>(modeAwal);

  const lokasi = useKonteksLokasi();
  const unitQuery = useUnitHidran();
  const inspeksiQuery = useInspeksiHidran();

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

  const inspeksiBulan = useMemo(
    () => inspeksiSite.filter((i) => i.period.startsWith(period)),
    [inspeksiSite, period],
  );
  const perUnit = useMemo(() => new Map(inspeksiBulan.map((i) => [i.unitId, i])), [inspeksiBulan]);

  const { peta: buktiSlot, selesai: buktiSelesai } = useBuktiHydrant(
    useMemo(() => inspeksiBulan.map((i) => i.id), [inspeksiBulan]),
  );

  const jangkarTemuan = inspeksiBulan[0]?.id ?? null;
  const fotoTemuan = useFotoInspeksi(jangkarTemuan, 'hydrant');

  const monthDate = useMemo(() => {
    const [y, m] = period.split('-').map(Number);
    return new Date(y, m - 1, 1);
  }, [period]);
  const monthLabel = format(monthDate, 'MMMM yyyy', { locale: idLocale });
  const namaBulan = format(monthDate, 'MMMM', { locale: idLocale });
  const tahun = period.slice(0, 4);

  const tanggalDaftar = useMemo(() => {
    const hari = [
      ...new Set(
        inspeksiBulan
          .map((i) => {
            const m = i.createdAt.match(/\d{4}-\d{2}-(\d{2})/);
            return m ? Number(m[1]) : NaN;
          })
          .filter((n) => Number.isFinite(n)),
      ),
    ].sort((a, b) => a - b);
    if (hari.length === 0) return `16 dan 18 ${monthLabel}`;
    if (hari.length === 1) return `${hari[0]} ${monthLabel}`;
    return `${hari.slice(0, -1).join(', ')} dan ${hari[hari.length - 1]} ${monthLabel}`;
  }, [inspeksiBulan, monthLabel]);

  const payloadChecklist: HydrantMonthlyPrintPayload = useMemo(
    () => ({
      siteName: (lokasi.siteName || 'JPM DUKUH ATAS').toUpperCase(),
      period: monthLabel,
      inspectionDate: tanggalDaftar,
      rows: units.map((u, idx) => {
        const insp = perUnit.get(u.id);
        const slot = insp ? buktiSlot[insp.id] : undefined;
        const st = insp?.overallStatus ?? u.completedReport?.overallStatus ?? u.draftDetails?.overallStatus;
        return {
          no: idx + 1,
          zoneName: u.zoneName,
          kode: u.kode.replace(/^Hydrant\s*/i, ''),
          pemeriksaanSrc: slot?.pemeriksaan ?? null,
          checklistSrc: slot?.checklist ?? null,
          statusText: statusTeksHydrant(st),
        };
      }),
      temuan: (fotoTemuan.data ?? [])
        .filter((f) => f.temuan)
        .map((f, idx) => ({
          no: idx + 1,
          src: f.url,
          caption: f.caption || 'Temuan dokumentasi',
        })),
    }),
    [lokasi.siteName, monthLabel, tanggalDaftar, units, perUnit, buktiSlot, fotoTemuan.data],
  );

  const payloadLaporan: HydrantLaporanPrintPayload = useMemo(
    () => ({
      tahun,
      bulan: namaBulan,
      siteName: `ITJ ${(lokasi.siteName || 'JPM DUKUH ATAS').toUpperCase()}`,
      rows: units.map((u, idx) => {
        const insp = perUnit.get(u.id);
        return {
          no: idx + 1,
          kode: u.kode,
          box: mapStatusAlat(insp?.boxHydrant ?? u.draftDetails?.boxHydrant),
          hose: mapStatusAlat(insp?.fireHose ?? u.draftDetails?.fireHose),
          coupling: mapStatusAlat(insp?.hoseCoupling ?? u.draftDetails?.hoseCoupling),
          rack: mapStatusAlat(insp?.hoseRack ?? u.draftDetails?.hoseRack),
          nozzle: mapStatusAlat(insp?.nozzle ?? u.draftDetails?.nozzle),
          valve: mapStatusAlat(insp?.valvePillar ?? u.draftDetails?.valvePillar),
          tanggal: tanggalSingkat(insp?.createdAt),
          petugas: 'Favian',
          keterangan: insp?.notes ?? u.completedReport?.summaryNotes ?? u.draftDetails?.notes ?? '',
        };
      }),
    }),
    [tahun, namaBulan, lokasi.siteName, units, perUnit],
  );

  const sheetsHtml = useMemo(() => {
    if (mode === 'laporan') return renderHydrantLaporanSheet(payloadLaporan);
    if (mode === 'semua') {
      return `${renderHydrantMonthlySheets(payloadChecklist)}\n${renderHydrantLaporanSheet(payloadLaporan)}`;
    }
    return renderHydrantMonthlySheets(payloadChecklist);
  }, [mode, payloadChecklist, payloadLaporan]);

  const isLandscape = mode === 'laporan';
  const memuat = unitQuery.isPending || inspeksiQuery.isPending || !buktiSelesai;

  useEffect(() => {
    if (!autoPrint || memuat) return;
    const t = window.setTimeout(() => {
      window.print();
    }, 350);
    return () => window.clearTimeout(t);
  }, [autoPrint, memuat]);

  return (
    <div className="flex-1 flex flex-col min-h-screen overflow-y-auto bg-slate-100 text-slate-900 px-6 py-4 font-sans select-none">
      <style>{`@page { size: A4 ${isLandscape ? 'landscape' : 'portrait'}; margin: ${
        isLandscape ? '8mm 10mm' : '10mm 12mm'
      }; }\n${PROCEDURAL_PRINT_CSS}`}</style>

      <div className="no-print flex flex-wrap items-center gap-3 pb-3 mb-4 border-b border-slate-300 bg-white px-4 py-3 rounded-[6px] shadow-xs">
        <button
          type="button"
          onClick={onKembali}
          className="px-3 py-1.5 text-xs font-semibold rounded-[4px] border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 cursor-pointer pressable"
        >
          ← Kembali ke Halaman Hydrant
        </button>

        <div className="flex flex-col">
          <h1 className="text-sm font-bold tracking-tight text-slate-900">
            {mode === 'checklist'
              ? 'Pratinjau Cetak Checklist Bulanan Hydrant'
              : mode === 'laporan'
                ? 'Pratinjau Cetak Laporan Pemeriksaan Hydrant'
                : 'Pratinjau Cetak Hydrant Lengkap'}
          </h1>
          <p className="text-xs text-slate-500 tabular-nums">
            {lokasi.siteName} · Periode {period}
          </p>
        </div>

        {/* Pengalih 2 Dokumen Hydrant: Checklist Bulanan (Portrait) vs Laporan Pemeriksaan (Landscape) */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-[5px] border border-slate-300 text-xs">
          <button
            type="button"
            onClick={() => setMode('checklist')}
            className={`px-3 py-1 rounded-[4px] font-semibold cursor-pointer pressable ${
              mode === 'checklist' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            1. Checklist Bulanan (Portrait)
          </button>
          <button
            type="button"
            onClick={() => setMode('laporan')}
            className={`px-3 py-1 rounded-[4px] font-semibold cursor-pointer pressable ${
              mode === 'laporan' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            2. Laporan Pemeriksaan (Landscape)
          </button>
          <button
            type="button"
            onClick={() => setMode('semua')}
            className={`px-3 py-1 rounded-[4px] font-semibold cursor-pointer pressable ${
              mode === 'semua' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Gabungan Keduanya
          </button>
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

      {memuat ? (
        <p className="no-print text-xs text-slate-600 tabular-nums">Memuat data inspeksi Hydrant…</p>
      ) : (
        <div className="procedural-print-canvas">
          <div dangerouslySetInnerHTML={{ __html: sheetsHtml }} />
          <div id="pdf-ready" data-status="ready"></div>
        </div>
      )}
    </div>
  );
};
