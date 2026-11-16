import React, { useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { formatIndonesianDate } from '@/lib/dates';
import {
  PROCEDURAL_PRINT_CSS,
  renderPatrolReportSheets,
  type PatrolReportPrintPayload,
} from '@/lib/proceduralPrintTemplates';
import { useKonteksLokasi } from '@/features/konteksLokasi';
import { petakanTemuanPatroli, useLaporanPatroli } from '@/services/api/queries';

interface PatrolPrintPreviewProps {
  /** Kunci bulan YYYY-MM dari query `?bulan=`; bawaan = bulan berjalan. */
  bulan?: string;
  /** Cetak otomatis begitu muatan siap. */
  autoPrint?: boolean;
  onKembali: () => void;
}

function bulanBerjalan(): string {
  return format(new Date(), 'yyyy-MM');
}

export const PatrolPrintPreview: React.FC<PatrolPrintPreviewProps> = ({
  bulan,
  autoPrint,
  onKembali,
}) => {
  const period = /^\d{4}-\d{2}$/.test(bulan ?? '') ? (bulan as string) : bulanBerjalan();
  const lokasi = useKonteksLokasi();
  const laporanQuery = useLaporanPatroli();

  const laporanSite = useMemo(
    () => (laporanQuery.data ?? []).filter((l) => l.siteId === lokasi.siteId),
    [laporanQuery.data, lokasi.siteId],
  );
  const findings = useMemo(() => petakanTemuanPatroli(laporanSite), [laporanSite]);

  const umpanBulan = useMemo(
    () =>
      findings
        .filter((f) => f.tanggal.startsWith(period))
        .sort((a, b) => a.tanggal.localeCompare(b.tanggal)),
    [findings, period],
  );

  const monthDate = useMemo(() => {
    const [y, m] = period.split('-').map(Number);
    return new Date(y, m - 1, 1);
  }, [period]);
  const labelBulan = format(monthDate, 'MMMM yyyy', { locale: idLocale });

  const tanggalPatrol = useMemo(() => {
    const terbaru = umpanBulan.at(-1)?.tanggal;
    return terbaru ? formatIndonesianDate(terbaru) : labelBulan;
  }, [umpanBulan, labelBulan]);

  const payload: PatrolReportPrintPayload = useMemo(() => {
    const namaSite = (lokasi.siteName || 'JPM DUKUH ATAS').toUpperCase();
    return {
      siteName: namaSite.startsWith('ITJ') ? namaSite : `ITJ ${namaSite}`,
      patrolDate: tanggalPatrol,
      findings: umpanBulan.map((f, idx) => ({
        no: idx + 1,
        src: f.photoUrl,
        caption: f.caption,
      })),
    };
  }, [lokasi.siteName, tanggalPatrol, umpanBulan]);

  const sheetsHtml = useMemo(() => renderPatrolReportSheets(payload), [payload]);
  const memuat = laporanQuery.isPending;

  useEffect(() => {
    if (!autoPrint || memuat) return;
    const t = window.setTimeout(() => {
      window.print();
    }, 350);
    return () => window.clearTimeout(t);
  }, [autoPrint, memuat]);

  return (
    <div className="flex-1 flex flex-col min-h-screen overflow-y-auto bg-slate-100 text-slate-900 px-6 py-4 font-sans select-none">
      <style>{`@page { size: A4 portrait; margin: 10mm 12mm; }\n${PROCEDURAL_PRINT_CSS}`}</style>

      <div className="no-print flex flex-wrap items-center gap-3 pb-3 mb-4 border-b border-slate-300 bg-white px-4 py-3 rounded-[6px] shadow-xs">
        <button
          type="button"
          onClick={onKembali}
          className="px-3 py-1.5 text-xs font-semibold rounded-[4px] border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 cursor-pointer pressable"
        >
          ← Kembali ke Halaman Patroli
        </button>

        <div className="flex flex-col">
          <h1 className="text-sm font-bold tracking-tight text-slate-900">
            Pratinjau Cetak Laporan Kegiatan Safety Patrol
          </h1>
          <p className="text-xs text-slate-500 tabular-nums">
            {lokasi.siteName} · Periode {period} ({umpanBulan.length} foto temuan)
          </p>
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
        <p className="no-print text-xs text-slate-600 tabular-nums">Memuat data Safety Patrol…</p>
      ) : (
        <div className="procedural-print-canvas">
          <div dangerouslySetInnerHTML={{ __html: sheetsHtml }} />
          <div id="pdf-ready" data-status="ready"></div>
        </div>
      )}
    </div>
  );
};
