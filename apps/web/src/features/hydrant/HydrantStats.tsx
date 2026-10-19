import React from 'react';
import { KartuStatistik } from '@/features/pageChrome';

interface HydrantStatsProps {
  totalUnits: number;
  jumlahZona: number;
  completed: number;
  onProgress: number;
}

/**
 * Dua kartu ringkas di atas tabel: total unit dan unit selesai.
 *
 * Bentuknya sama dengan kartu APAR — dua kartu selebar grid, masing-masing
 * memakai ruangnya untuk bilah progres, bukan empat kartu sempit yang isinya
 * cuma satu angka.
 */
export const HydrantStats: React.FC<HydrantStatsProps> = ({
  totalUnits,
  jumlahZona,
  completed,
  onProgress,
}) => {
  const persenSelesai = totalUnits ? Math.round((completed / totalUnits) * 100) : 0;
  const persenBerjalan = totalUnits ? Math.round((onProgress / totalUnits) * 100) : 0;

  return (
    <div className="no-print grid grid-cols-2 gap-3 mb-4">
      <KartuStatistik
        nada="netral"
        judul="Total Hydrant Terdaftar"
        nilai={totalUnits}
        rincian={`${jumlahZona} Zona Terpantau`}
        ikon="🏢"
        kaki="Wajib periksa 1x per bulan"
        isi={
          <div className="mt-2 space-y-1.5">
            <div className="flex h-1.5 rounded-full overflow-hidden bg-[var(--bg-hover)]">
              <div
                className="bg-emerald-500"
                style={{ width: `${persenSelesai}%` }}
                title={`${completed} unit selesai`}
              />
              <div
                className="bg-amber-500"
                style={{ width: `${persenBerjalan}%` }}
                title={`${onProgress} unit berjalan`}
              />
            </div>
            <div className="flex items-center gap-3 text-[10px] text-[var(--muted)] tabular-nums">
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {completed} selesai
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {onProgress} berjalan
              </span>
            </div>
          </div>
        }
      />
      <KartuStatistik
        nada="hijau"
        judul="Selesai Diperiksa"
        nilai={completed}
        rincian={`dari ${totalUnits} unit terdaftar`}
        lencana="Lengkap"
        kaki="Laporan telah diterbitkan"
        isi={
          <div className="mt-2">
            <div className="flex h-1.5 rounded-full overflow-hidden bg-emerald-500/15">
              <div className="bg-emerald-500" style={{ width: `${persenSelesai}%` }} />
            </div>
            <div className="mt-1.5 text-[10px] text-[var(--muted)] tabular-nums">
              {persenSelesai}% unit sudah punya laporan terbit
            </div>
          </div>
        }
      />
    </div>
  );
};
