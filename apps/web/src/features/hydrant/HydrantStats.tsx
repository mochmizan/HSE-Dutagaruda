import React from 'react';
import { KartuStatistik } from '@/features/pageChrome';

interface HydrantStatsProps {
  totalUnits: number;
  jumlahZona: number;
  completed: number;
}

/**
 * Dua kartu ringkas di atas tabel: total unit dan unit selesai.
 *
 * Bilah progres hanya ada di kartu "Selesai Diperiksa". Kartu total sengaja
 * tanpa bilah: angka selesai sudah muncul di kartu sebelah, jadi bilah kedua
 * mengulang informasi yang sama.
 */
export const HydrantStats: React.FC<HydrantStatsProps> = ({ totalUnits, jumlahZona, completed }) => {
  const persenSelesai = totalUnits ? Math.round((completed / totalUnits) * 100) : 0;

  return (
    <div className="no-print grid grid-cols-2 gap-3 mb-4">
      <KartuStatistik
        nada="netral"
        judul="Total Hydrant Terdaftar"
        nilai={totalUnits}
        rincian={`${jumlahZona} Zona Terpantau`}
        ikon="🏢"
        kaki="Wajib periksa 1x per bulan"
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
