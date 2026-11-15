import React from 'react';
import { formatIndonesianDate } from '../../lib/dates';

interface P3kPrintHeaderProps {
  siteName: string;
  year: string;
  unitKerja: string;
  lokasiKerja: string;
}

/**
 * Kop lembar laporan P3K, hanya tampil saat dicetak (slot `kepalaCetak`
 * cangkang, sama seperti Hydrant). Kop layar interaktif tetap di
 * `P3kKepala` (slot `isi`, `print:hidden`).
 */
export const P3kPrintHeader: React.FC<P3kPrintHeaderProps> = ({
  siteName,
  year,
  unitKerja,
  lokasiKerja,
}) => (
  <div className="hidden print:block pb-3 mb-4 border-b border-black">
    <div className="flex items-center justify-between mb-3">
      <img
        src="/findings/report-header-logos.png"
        alt="Logo Mitra & Pengelola JPM Dukuh Atas"
        className="w-full max-h-16 object-contain"
      />
    </div>
    <div className="flex justify-between items-start pt-1">
      <div>
        <h1 className="text-sm font-extrabold text-black">
          LEMBAR LAPORAN PEMERIKSAAN KOTAK P3K GEDUNG
        </h1>
        <p className="text-[10px] text-gray-700">
          Sesuai Standar K3 &amp; Permenakertrans No. 15/MEN/VIII/2008
        </p>
      </div>
      <div className="text-right text-[10px] text-gray-800 leading-tight tabular-nums">
        <p>
          <span className="font-semibold">Lokasi Fasilitas:</span> {siteName}
        </p>
        <p>
          <span className="font-semibold">Periode Inspeksi:</span> {year}
        </p>
        <p>
          <span className="font-semibold">Unit Kerja:</span> {unitKerja || '–'}
          {' · '}
          <span className="font-semibold">Lokasi Kerja:</span> {lokasiKerja || '–'}
        </p>
        <p>
          <span className="font-semibold">Tanggal Cetak:</span> {formatIndonesianDate(new Date())}
        </p>
      </div>
    </div>
  </div>
);

/** Blok tanda tangan tiga kolom pada lembar cetak P3K. */
export const P3kPrintSignatures: React.FC = () => (
  <div className="hidden print:block pt-8 mt-8 border-t border-black print:break-inside-avoid">
    <div className="grid grid-cols-3 gap-6 text-center text-xs text-black">
      <div>
        <p className="font-semibold">Petugas Pemeriksa (Inspector)</p>
        <div className="h-16"></div>
        <p className="font-bold underline">( Alex Chen )</p>
        <p className="text-[10px] text-gray-700">Staff HSE / Teknisi K3</p>
      </div>
      <div>
        <p className="font-semibold">Diverifikasi Oleh (Supervisor)</p>
        <div className="h-16"></div>
        <p className="font-bold underline">( Budi Santoso )</p>
        <p className="text-[10px] text-gray-700">HSE Officer &amp; Koordinator</p>
      </div>
      <div>
        <p className="font-semibold">Disetujui Oleh (Site Manager)</p>
        <div className="h-16"></div>
        <p className="font-bold underline">( Ir. Hendra Wijaya )</p>
        <p className="text-[10px] text-gray-700">Kepala Operasional Logistik</p>
      </div>
    </div>
  </div>
);
