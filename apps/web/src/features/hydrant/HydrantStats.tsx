import React from 'react';
import { RingkasanInspeksi } from '@/features/pageChrome';

interface HydrantStatsProps {
  totalUnits: number;
  jumlahZona: number;
  completed: number;
  onProgress: number;
}

/** Dua kartu ringkas di atas tabel: total unit dan unit selesai. */
export const HydrantStats: React.FC<HydrantStatsProps> = ({
  totalUnits,
  jumlahZona,
  completed,
  onProgress,
}) => (
  <RingkasanInspeksi
    judulTotal="Total Hydrant Terdaftar"
    ikon="🏢"
    kakiTotal="Wajib periksa 1x per bulan"
    total={totalUnits}
    selesai={completed}
    berjalan={onProgress}
    jumlahZona={jumlahZona}
    kakiSelesai="Laporan telah diterbitkan"
  />
);
