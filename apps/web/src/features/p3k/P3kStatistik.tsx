import React from 'react';
import { KartuStatistik } from '@/features/pageChrome';

interface P3kStatistikProps {
  totalKotak: number;
  jumlahZona: number;
  selesai: number;
}

/**
 * Dua kartu ringkas di atas tabel Kotak P3K: Total Kotak P3K dan Selesai Diperiksa.
 * Menyeragamkan tampilan dengan HydrantStats & AparStats.
 */
export const P3kStatistik: React.FC<P3kStatistikProps> = ({
  totalKotak,
  jumlahZona,
  selesai,
}) => (
  <div className="no-print grid grid-cols-2 gap-3 mb-4">
    <KartuStatistik
      nada="netral"
      judul="Total Kotak P3K"
      nilai={totalKotak}
      rincian={`${jumlahZona} Zona Terpantau · Kantor Pusat`}
      ikon="🩹"
      kaki="Wajib periksa 1x per bulan (Permenakertrans 15/2008)"
    />
    <KartuStatistik
      nada="hijau"
      judul="Selesai Diperiksa"
      nilai={selesai}
      rincian={`dari ${totalKotak} kotak P3K terdaftar`}
      ikon="✅"
      lencana="Terverifikasi"
      kaki="Laporan pemeriksaan telah diterbitkan"
    />
  </div>
);
