import React from 'react';
import { KartuStatistik } from '@/features/pageChrome';

interface P3kStatistikProps {
  filled: number;
  kurang: number;
  kd: number;
}

/**
 * Dua kartu ringkas di atas grid — bentuknya sama dengan halaman Hydrant
 * (`KartuStatistik`, grid 2 kolom): satu kartu temuan, satu kartu capaian.
 *
 * Sebelumnya P3K memasang tiga kartu buatan sendiri sehingga tinggi, ukuran
 * angka, dan warnanya menyimpang dari halaman master.
 */
export const P3kStatistik: React.FC<P3kStatistikProps> = ({ filled, kurang, kd }) => {
  const persenTerisi = Math.round((filled / 12) * 100);

  return (
    <div className="no-print grid grid-cols-2 gap-3 mb-4">
      <KartuStatistik
        nada="netral"
        judul="Sel Di Bawah Standar"
        nilai={kurang}
        satuan="Sel"
        rincian={`${kd} item kadaluarsa`}
        ikon="⚠️"
        kaki="Isi ulang sesuai jumlah standar"
      />
      <KartuStatistik
        nada="hijau"
        judul="Selesai Diperiksa"
        nilai={filled}
        satuan="Bulan"
        rincian="dari 12 bulan terdaftar"
        ikon="✅"
        lencana="Lengkap"
        kaki="Grid tahunan sudah terisi"
        isi={
          <div className="mt-2">
            <div className="flex h-1.5 rounded-full overflow-hidden bg-emerald-500/15">
              <div className="bg-emerald-500" style={{ width: `${persenTerisi}%` }} />
            </div>
            <div className="mt-1.5 text-[10px] text-[var(--muted)] tabular-nums">
              {persenTerisi}% bulan sudah punya hasil pemeriksaan
            </div>
          </div>
        }
      />
    </div>
  );
};
