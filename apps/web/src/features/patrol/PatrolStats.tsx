import React from 'react';
import { KartuStatistik } from '@/features/pageChrome';

interface PatrolStatsProps {
  total: number;
  bulanIni: number;
  labelBulan: string;
}

/**
 * Dua kartu ringkas di atas umpan foto: total foto dan foto bulan terpilih.
 *
 * Bentuk sama dengan Hydrant (`grid-cols-2`, angka `text-[26px]`,
 * `tabular-nums`): bilah progres hanya di kartu bulan ini. Kartu total
 * sengaja tanpa bilah: angka bulan sudah muncul di kartu sebelah, jadi bilah
 * kedua mengulang informasi yang sama.
 */
export const PatrolStats: React.FC<PatrolStatsProps> = ({ total, bulanIni, labelBulan }) => {
  const persenBulan = total ? Math.round((bulanIni / total) * 100) : 0;

  return (
    <div className="no-print grid grid-cols-2 gap-3 mb-4">
      <KartuStatistik
        nada="netral"
        judul="Total Foto Terdaftar"
        nilai={total}
        satuan="Foto"
        rincian={`Bulan ${labelBulan} dipilih`}
        ikon="📷"
        kaki="Dokumentasi seluruh periode"
      />
      <KartuStatistik
        nada="hijau"
        judul="Foto Bulan Ini"
        nilai={bulanIni}
        satuan="Foto"
        rincian={`dari ${total} foto terdaftar`}
        ikon="✅"
        lencana="Terbaru"
        kaki="Umpan bulan terpilih"
        isi={
          <div className="mt-2">
            <div className="flex h-1.5 rounded-full overflow-hidden bg-emerald-500/15">
              <div className="bg-emerald-500" style={{ width: `${persenBulan}%` }} />
            </div>
            <div className="mt-1.5 text-[10px] text-[var(--muted)] tabular-nums">
              {persenBulan}% foto ada di bulan ini
            </div>
          </div>
        }
      />
    </div>
  );
};
