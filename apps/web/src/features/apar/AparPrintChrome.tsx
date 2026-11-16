import React from 'react';
import { formatIndonesianDate } from '../../lib/dates';

interface AparPrintHeaderProps {
  siteName: string;
  monthLabel: string;
}

/**
 * Kop lembar laporan APAR, hanya tampil saat dicetak.
 *
 * Tanggal cetak diambil dari jam sistem saat render.
 */
export const AparPrintHeader: React.FC<AparPrintHeaderProps> = ({ siteName, monthLabel }) => (
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
          LEMBAR LAPORAN PEMERIKSAAN BERKALA APAR GEDUNG
        </h1>
        <p className="text-[10px] text-gray-700">
          Sesuai Standar K3 &amp; Permenakertrans No. 04/MEN/1980
        </p>
      </div>
      <div className="text-right text-[10px] text-gray-800 leading-tight">
        <p>
          <span className="font-semibold">Lokasi Fasilitas:</span> {siteName}
        </p>
        <p>
          <span className="font-semibold">Periode Inspeksi:</span> {monthLabel}
        </p>
        <p>
          <span className="font-semibold">Tanggal Cetak:</span> {formatIndonesianDate(new Date())}
        </p>
      </div>
    </div>
  </div>
);

/** Blok tanda tangan tiga kolom pada lembar cetak APAR. */
export const AparPrintSignatures: React.FC = () => (
  <div className="hidden print:block pt-8 mt-8 border-t border-black print:break-inside-avoid">
    <div className="grid grid-cols-3 gap-6 text-center text-xs text-black">
      <div>
        <p className="font-semibold">Petugas Pemeriksa (Inspector)</p>
        <div className="h-16"></div>
        <p className="font-bold underline">( Takamay Jason Hermantika Irsyad )</p>
        <p className="text-[10px] text-gray-700">Junior HSE Analyst</p>
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
        <p className="font-bold underline">( Hizri )</p>
        <p className="text-[10px] text-gray-700">Governance, Risk, HSE & Quality Group Head</p>
      </div>
    </div>
  </div>
);
