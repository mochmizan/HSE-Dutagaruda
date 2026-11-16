import React from 'react';
import { formatIndonesianDate } from '@/lib/dates';

interface PatrolPrintHeaderProps {
  lokasi: string;
  labelBulan: string;
  /** ISO tanggal temuan terkini; '' = belum ada foto. */
  tanggalTerbaru: string;
}

/**
 * Kop lembar laporan Patroli, hanya tampil saat dicetak.
 *
 * Lokasi dari catatan lokasi kerja (sunting di layar, teks polos di kertas);
 * tanggal terkini = tanggal temuan terbaru, bukan tanggal cetak.
 */
export const PatrolPrintHeader: React.FC<PatrolPrintHeaderProps> = ({
  lokasi,
  labelBulan,
  tanggalTerbaru,
}) => (
  <div className="hidden print:block pb-3 mb-4 border-b border-black">
    <div className="flex items-center justify-between mb-3">
      <img
        src="/findings/report-header-logos.png"
        alt="Logo Mitra & Pengelola"
        className="w-full max-h-16 object-contain"
      />
    </div>
    <div className="flex justify-between items-start pt-1">
      <div>
        <h1 className="text-sm font-extrabold text-black">LAPORAN KEGIATAN</h1>
        <h1 className="text-sm font-extrabold text-black">SAFETY PATROL</h1>
      </div>
      <div className="text-right text-[10px] text-gray-800 leading-tight">
        <p>
          <span className="font-semibold">Lokasi Kerja:</span> {lokasi}
        </p>
        <p>
          <span className="font-semibold">Periode:</span> {labelBulan}
        </p>
        <p>
          <span className="font-semibold">Tanggal Terkini:</span>{' '}
          {tanggalTerbaru ? formatIndonesianDate(tanggalTerbaru) : '–'}
        </p>
        <p>
          <span className="font-semibold">Tanggal Cetak:</span>{' '}
          {formatIndonesianDate(new Date())}
        </p>
      </div>
    </div>
  </div>
);

/** Blok tanda tangan tiga kolom pada lembar cetak Patroli. */
export const PatrolPrintSignatures: React.FC = () => (
  <div className="hidden print:block pt-8 mt-8 border-t border-black print:break-inside-avoid">
    <div className="grid grid-cols-3 gap-6 text-center text-xs text-black">
      <div>
        <p className="font-semibold">Petugas Patroli</p>
        <div className="h-16"></div>
        <p className="font-bold underline">( ........................ )</p>
        <p className="text-[10px] text-gray-700">Junior HSE Analyst</p>
      </div>
      <div>
        <p className="font-semibold">Diverifikasi Oleh (Supervisor)</p>
        <div className="h-16"></div>
        <p className="font-bold underline">( ........................ )</p>
        <p className="text-[10px] text-gray-700">HSE Officer &amp; Koordinator</p>
      </div>
      <div>
        <p className="font-semibold">Disetujui Oleh (Site Manager)</p>
        <div className="h-16"></div>
        <p className="font-bold underline">( ........................ )</p>
        <p className="text-[10px] text-gray-700">Governance, Risk, HSE & Quality Group Head</p>
      </div>
    </div>
  </div>
);
