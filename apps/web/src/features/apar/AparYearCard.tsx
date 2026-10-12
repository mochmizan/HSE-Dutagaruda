import { Lock } from 'lucide-react';
import { parseISO } from 'date-fns';
import { formatIndonesianDate } from '../../lib/dates';
import type { AparUnitItem, AparYearCell, AparYearGrid } from '../../types/hse';

interface AparYearCardProps {
  unit: AparUnitItem;
  period: string; // YYYY-MM — bulan laporan ditandai sebagai baris berjalan
  locked: boolean; // true saat rekam bulan sudah diajukan (bukan Draf)
  year: string;
  onYearChange: (year: string) => void;
  grid: AparYearGrid;
  /** Kartu hanya-tampil: ubah data lewat modal inspeksi (klik baris tabel). */
}

const MONTH_KEYS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const CONDITION_KEYS = [
  { key: 'safetyPin', label: 'Pin' },
  { key: 'corong', label: 'Corong' },
  { key: 'segel', label: 'Segel' },
  { key: 'tekanan', label: 'Tekanan' },
  { key: 'tabung', label: 'Tabung' },
  { key: 'selang', label: 'Selang' },
  { key: 'katupTuas', label: 'Katup' },
] as const;

const fallbackCell = (): AparYearCell => ({
  tanggal: '',
  kondisi: { safetyPin: '', corong: '', segel: '', tekanan: '', tabung: '', selang: '', katupTuas: '' },
  nama: '',
  paraf: '',
});

/**
 * Kartu tahunan APAR — hanya-tampil (read-only).
 * Grid dimiliki halaman (toko `aparCards` di App); isian diperbarui lewat
 * modal inspeksi, kartu hanya menampilkan satu sumber data yang sama.
 */
export const AparYearCard: React.FC<AparYearCardProps> = ({
  unit,
  period,
  locked,
  year,
  onYearChange,
  grid,
}) => {
  const [reportYear, reportMonth] = period.split('-');
  // Baris bulan laporan hanya ditandai; sunting lewat modal inspeksi.
  const highlightMonth: string | null = reportYear === year ? reportMonth : null;

  const cellTone = (value: string) => {
    if (value === '✓') return 'text-emerald-600 dark:text-emerald-400 font-bold';
    if (value === 'X') return 'bg-red-500/15 text-red-600 dark:text-red-400 font-bold';
    if (value === 'NA') return 'text-amber-600 dark:text-amber-400 font-semibold';
    return 'text-[var(--muted)]';
  };

  return (
    <section
      id="apar-year-card"
      className="rounded-[6px] border border-[#f2994a]/40 bg-[var(--bg-main)] shadow-xs overflow-hidden print:break-inside-avoid"
    >
      {/* Kepala kartu */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 border-b border-[var(--border)] bg-[#f2994a]/[0.06]">
        <div>
          <h3 className="text-sm font-bold text-[var(--primary)] tracking-tight tabular-nums">
            Kartu Tahunan APAR {unit.kode} <span className="font-medium text-[var(--muted)]">– {unit.zoneName}</span>
          </h3>
          <p className="text-[11px] text-[var(--muted)] mt-0.5">
            Jenis {unit.jenis} • Ukuran {unit.ukuran} • Tahun Pembuatan{' '}
            <span className="tabular-nums">{unit.tahunPembuatan}</span>
            {locked && (
              <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--muted)]">
                <Lock size={10} /> Terkunci (Disetujui)
              </span>
            )}
          </p>
          <p className="no-print text-[10px] text-[var(--muted)] mt-0.5">
            Klik baris tabel di atas untuk mengubah hasil pemeriksaan.
          </p>
        </div>
        <div className="no-print flex items-center gap-1 bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-[4px] p-0.5 text-xs">
          {['2025', '2026'].map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => onYearChange(y)}
              className={`px-2.5 py-1 rounded-[3px] font-semibold tabular-nums cursor-pointer pressable transition-colors ${
                year === y ? 'bg-[#f2994a] text-white shadow-xs' : 'text-[var(--secondary)] hover:text-[var(--primary)]'
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* Grid 12 bulan */}
      <div className="overflow-x-auto">
        <table className="w-full text-center border-collapse text-[11px]">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--bg-sidebar)]/80 text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wider">
              <th className="py-2 px-2 text-center align-middle">Bulan</th>
              <th className="py-2 px-2 text-center align-middle">Tanggal</th>
              {CONDITION_KEYS.map((c) => (
                <th key={c.key} className="py-2 px-1 text-center align-middle">{c.label}</th>
              ))}
              <th className="py-2 px-2 text-center align-middle">Nama</th>
              <th className="py-2 px-2 text-center align-middle">Paraf</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {MONTH_KEYS.map((m, idx) => {
              const cell = grid[m] ?? fallbackCell();
              const isHighlight = m === highlightMonth;
              const hasIssue = Object.values(cell.kondisi).some((v) => v === 'X');
              return (
                <tr
                  key={m}
                  className={
                    hasIssue
                      ? 'bg-red-500/[0.06] dark:bg-red-500/[0.10]'
                      : isHighlight
                      ? 'bg-[#f2994a]/[0.05]'
                      : undefined
                  }
                >
                  <td className="py-1.5 px-2 text-center align-middle font-medium text-[var(--primary)] whitespace-nowrap">
                    {MONTH_NAMES[idx]}
                    {isHighlight && <span className="ml-1 text-[9px] text-[#f2994a] font-bold">●</span>}
                  </td>
                  <td className="py-1.5 px-2 text-center align-middle tabular-nums text-[var(--secondary)]">
                    {cell.tanggal || <span className="text-[var(--muted)]">–</span>}
                  </td>
                  {CONDITION_KEYS.map((c) => (
                    <td key={c.key} className="py-1.5 px-1 text-center align-middle">
                      <span
                        title={`${c.label}: ${cell.kondisi[c.key] || 'belum diperiksa'}`}
                        className={`text-xs tabular-nums ${cellTone(cell.kondisi[c.key])}`}
                      >
                        {cell.kondisi[c.key] || '–'}
                      </span>
                    </td>
                  ))}
                  <td className="py-1.5 px-2 text-center align-middle text-[var(--secondary)]">
                    {cell.nama || <span className="text-[var(--muted)]">–</span>}
                  </td>
                  <td className="py-1.5 px-2 text-center align-middle tabular-nums text-[var(--secondary)]">
                    {cell.paraf || <span className="text-[var(--muted)]">–</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Tindak lanjut baris bermasalah */}
      {MONTH_KEYS.filter((m) => Object.values((grid[m] ?? fallbackCell()).kondisi).some((v) => v === 'X')).map((m) => {
        const cell = grid[m] ?? fallbackCell();
        return (
          <div key={m} className="px-4 py-2.5 border-t border-red-500/25 bg-red-500/[0.05] text-[11px]">
            <p className="font-semibold text-red-600 dark:text-red-400">
              Tindak lanjut – {MONTH_NAMES[Number(m) - 1]}:
            </p>
            <p className="mt-0.5 italic text-[var(--primary)]">“{cell.tindakLanjut || '–'}”</p>
          </div>
        );
      })}

      {/* Kaki kartu: tanggal isi + legenda */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-2.5 border-t border-[var(--border)] text-[11px] text-[var(--secondary)]">
        <div className="flex items-center gap-3 flex-wrap tabular-nums">
          <span>
            <span className="font-medium">Tgl Pengisian Terakhir</span>
            {' : –'}
          </span>
          <span>
            <span className="font-medium">Tgl Isi Ulang</span>
            {' : '}
            {unit.expiredDate ? formatIndonesianDate(parseISO(unit.expiredDate)) : '–'}
          </span>
        </div>
        <p className="text-[10px] text-[var(--muted)] tabular-nums">
          Legenda: <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ Baik</span>
          {' • '}<span className="text-red-600 dark:text-red-400 font-bold">X Tidak Baik</span>
          {' • '}<span className="text-amber-600 dark:text-amber-400 font-semibold">NA Tidak Berlaku</span>
        </p>
      </div>
    </section>
  );
};
