import React from 'react';
import { parseISO } from 'date-fns';
import { formatIndonesianDate } from '../../lib/dates';

/** “20” / “1, 14, dan 15” — koma dengan “dan” sebelum unsur terakhir. */
export function formatNoList(kodes: string[]): string {
  if (kodes.length === 0) return '–';
  if (kodes.length === 1) return kodes[0];
  if (kodes.length === 2) return `${kodes[0]} dan ${kodes[1]}`;
  return `${kodes.slice(0, -1).join(', ')}, dan ${kodes[kodes.length - 1]}`;
}

interface AparPrintHeaderProps {
  siteName: string;
  monthLabel: string;
  inspectionDatesLabel: string;
}

/** Kop lembar cetak APAR bulanan, hanya tampil saat dicetak. */
export const AparPrintHeader: React.FC<AparPrintHeaderProps> = ({
  siteName,
  monthLabel,
  inspectionDatesLabel,
}) => (
  <div className="hidden print:block pb-3 mb-4 border-b border-black">
    <div className="flex justify-between items-start pt-1">
      <div>
        <h1 className="text-sm font-extrabold text-black">CHECKLIST BULANAN APAR — JPM Dukuh Atas</h1>
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
          <span className="font-semibold">Tanggal Inspeksi:</span> {inspectionDatesLabel}
        </p>
      </div>
    </div>
  </div>
);

interface AparExpiryProps {
  groups: { date: string; kodes: string[] }[];
}

/** Rekap kedaluwarsa + blok “Catatan :” gaya dokumen kertas (halaman 2 saat cetak). */
export const AparExpiry: React.FC<AparExpiryProps> = ({ groups }) => (
  <div
    id="kadaluwarsa"
    className="scroll-mt-4 pt-4 bg-white dark:bg-[var(--bg-main)] print:bg-white print:break-before-page print:break-inside-avoid"
  >
    <h2 className="text-sm font-bold text-left text-[var(--primary)] tracking-tight print:text-black print:text-sm print:text-left">
      Kadaluwarsa APAR
    </h2>
    <p className="no-print text-xs text-[var(--muted)] mt-0.5 mb-2">
      Dihitung otomatis dari tanggal kedaluwarsa seluruh unit terdaftar
    </p>
    <div className="overflow-x-auto border border-[var(--border)] print:border-black bg-[var(--bg-main)] dark:bg-[var(--bg-main)] print:bg-white shadow-2xs print:shadow-none rounded-[6px] print:rounded-none">
      <table className="w-full text-center border-collapse text-xs print:text-[10px]">
        <thead>
          <tr className="border-b border-[var(--border)] print:border-black bg-[var(--bg-sidebar)]/80 print:bg-white text-[10px] font-bold text-[var(--muted)] print:text-black uppercase print:normal-case tracking-wider print:tracking-normal">
            <th className="py-2.5 px-3 print:py-1.5 print:px-2 w-12 text-center align-middle border-r border-[var(--border)] print:border-black">
              No
            </th>
            <th className="py-2.5 px-3 print:py-1.5 print:px-2 text-center align-middle border-r border-[var(--border)] print:border-black">
              Periode Kadaluwarsa
            </th>
            <th className="py-2.5 px-3 print:py-1.5 print:px-2 text-center align-middle border-r border-[var(--border)] print:border-black">
              Total APAR
            </th>
            <th className="py-2.5 px-3 print:py-1.5 print:px-2 text-center align-middle">No APAR</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)] print:divide-black tabular-nums">
          {groups.map((g, idx) => (
            <tr key={g.date} className="hover:bg-[var(--bg-hover)]/60 print:hover:bg-white">
              <td className="py-2.5 px-3 print:py-1.5 print:px-2 text-center align-middle font-mono text-[var(--muted)] print:text-black border-r border-[var(--border)] print:border-black">
                {idx + 1}
              </td>
              <td className="py-2.5 px-3 print:py-1.5 print:px-2 text-center align-middle font-medium text-[var(--primary)] print:text-black border-r border-[var(--border)] print:border-black">
                {formatIndonesianDate(parseISO(g.date))}
              </td>
              <td className="py-2.5 px-3 print:py-1.5 print:px-2 text-center align-middle font-bold font-mono text-[var(--primary)] print:text-black border-r border-[var(--border)] print:border-black">
                {g.kodes.length}
              </td>
              <td className="py-2.5 px-3 print:py-1.5 print:px-2 text-center align-middle font-mono text-[var(--secondary)] print:text-black">
                {formatNoList(g.kodes)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="mt-3 print:mt-2 print:break-inside-avoid">
      <p className="text-xs print:text-[10px] font-bold text-[var(--primary)] print:text-black text-left">
        Catatan :
      </p>
      <div className="hidden print:block mt-1 min-h-[56px] border border-black px-2 py-1.5" aria-hidden="true" />
    </div>
  </div>
);

interface AparSignaturesProps {
  names: string[];
  roles: string[];
  onName: (idx: number, value: string) => void;
  onRole: (idx: number, value: string) => void;
}

/** Blok tanda tangan tiga kolom: bisa diketik di layar, tercetak polos. */
export const AparSignatures: React.FC<AparSignaturesProps> = ({ names, roles, onName, onRole }) => {
  const kolom = [
    { caption: 'Dibuat Oleh :', idx: 0 },
    { caption: 'Diketahui Oleh :', idx: 1 },
    { caption: 'Disetujui Oleh :', idx: 2 },
  ];
  return (
    <div className="apar-report-part pt-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left print:grid-cols-3 print:gap-6 print:break-inside-avoid bg-white dark:bg-[var(--bg-main)] print:bg-white px-1">
      {kolom.map((s) => (
        <div key={s.caption} className="text-xs print:text-[10px]">
          <p className="font-semibold text-left text-[var(--secondary)] print:text-black">{s.caption}</p>
          <div className="h-20 print:h-20" />
          <input
            type="text"
            value={names[s.idx]}
            onChange={(e) => onName(s.idx, e.target.value)}
            aria-label={`Nama ${s.caption}`}
            className="no-print w-full bg-transparent text-left font-bold text-[var(--primary)] border-b border-black/70 hover:border-black focus:border-black focus:outline-none read-only:opacity-80 px-0 py-0.5"
          />
          <input
            type="text"
            value={roles[s.idx]}
            onChange={(e) => onRole(s.idx, e.target.value)}
            aria-label={`Jabatan ${s.caption}`}
            className="no-print mt-0.5 w-full bg-transparent text-left text-[11px] text-[var(--muted)] border-b border-transparent hover:border-[var(--border)] focus:border-[var(--border)] focus:outline-none read-only:opacity-80 px-0 py-0.5"
          />
          <p className="hidden print:block text-left font-bold text-black border-b border-black leading-relaxed">
            {names[s.idx] || '\u00A0'}
          </p>
          <p className="hidden print:block text-left text-[9px] text-gray-800 mt-0.5">
            {roles[s.idx] || '\u00A0'}
          </p>
        </div>
      ))}
    </div>
  );
};
