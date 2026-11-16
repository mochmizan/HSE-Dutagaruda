import React from 'react';
import { KartuStatistik } from '@/features/pageChrome';

interface HydrantStatsProps {
  totalUnits: number;
  jumlahZona: number;
  completed: number;
}

/**
 * Dua kartu ringkas di atas tabel: Total Hydrant dan Selesai Diperiksa.
 * Sesuai revisi: fitur Sedang Berjalan (On Progress) dan Kemajuan Bulan Ini dihapus.
 */
export const HydrantStats: React.FC<HydrantStatsProps> = ({ totalUnits, jumlahZona, completed }) => (
  <div className="no-print grid grid-cols-2 gap-3 mb-4">
    <KartuStatistik
      nada="netral"
      judul="Total Hydrant"
      nilai={totalUnits}
      rincian={`${jumlahZona} Zona Terpantau · Kantor Pusat`}
      ikon="🏢"
      kaki="Wajib periksa 1x per bulan"
    />
    <KartuStatistik
      nada="hijau"
      judul="Selesai Diperiksa"
      nilai={completed}
      rincian={`dari ${totalUnits} unit hydrant terdaftar`}
      ikon="✅"
      lencana="Terverifikasi"
      kaki="Laporan pemeriksaan telah diterbitkan"
    />
  </div>
);
