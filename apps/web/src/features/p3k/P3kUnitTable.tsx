import React from 'react';
import { AlertCircle, CheckCircle2, Trash2, X } from 'lucide-react';
import { format, isValid, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { KeteranganTeks } from '@/features/pageChrome';
import type { P3kBoxType } from '@/lib/p3kItems';

export interface P3kUnitRow {
  id: string;
  kode: string;
  zoneName: string;
  boxType: P3kBoxType;
  status: 'BELUM_DIPERIKSA' | 'SELESAI';
  standarCount: number;
  tidakStandarCount: number;
  kdCount: number;
  inspectorName: string;
  inspectionDate: string;
  notes: string;
}

function fmtTgl(iso: string): string {
  if (!iso) return 'Bulan Ini';
  const t = parseISO(iso);
  return isValid(t) ? format(t, 'dd MMM yyyy', { locale: idLocale }) : iso;
}

interface P3kUnitTableProps {
  units: P3kUnitRow[];
  onBuka: (unit: P3kUnitRow) => void;
  onHapus: (unit: P3kUnitRow) => void;
}

/**
 * Tabel Kotak P3K (cermin HydrantTable & AparTable):
 * No. | Kode Kotak | Zona / Lantai | Tipe Kotak | Verifikasi 21 Item | Status Standar | Petugas & Tanggal | Keterangan
 */
export const P3kUnitTable: React.FC<P3kUnitTableProps> = ({ units, onBuka, onHapus }) => (
  <div className="overflow-x-auto rounded-[6px] border border-[var(--border)] bg-[var(--bg-main)] shadow-2xs">
    <table className="w-full table-fixed text-center border-collapse text-xs [&_th]:border [&_th]:border-[var(--border)] [&_td]:border [&_td]:border-[var(--border)]">
      <colgroup>
        <col className="w-[60px]" />
        <col className="w-[96px]" />
        <col className="w-[120px]" />
        <col className="w-[120px]" />
        <col className="w-[190px]" />
        <col className="w-[140px]" />
        <col className="w-[180px]" />
        <col className="w-[160px]" />
        <col className="w-[52px]" />
      </colgroup>
      <thead>
        <tr className="border-b border-[var(--border)] bg-[var(--bg-sidebar)]/80 text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wider">
          <th className="py-2.5 px-3 text-center align-middle">No.</th>
          <th className="py-2.5 px-3 text-center align-middle">Kode Kotak</th>
          <th className="py-2.5 px-3 text-center align-middle">Zona / Lantai</th>
          <th className="py-2.5 px-3 text-center align-middle">Tipe Kotak</th>
          <th className="py-2.5 px-3 text-center align-middle">Verifikasi 21 Item</th>
          <th className="py-2.5 px-3 text-center align-middle">Status Standar</th>
          <th className="py-2.5 px-3 text-center align-middle">Petugas &amp; Tanggal</th>
          <th className="py-2.5 px-3 text-center align-middle">Catatan Temuan Tambahan</th>
          <th className="py-2.5 px-3 text-center align-middle print:hidden">Aksi</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[var(--border)] text-xs">
        {units.map((u, idx) => {
          const isCompleted = u.status === 'SELESAI';
          const tidakStandar = isCompleted && (u.tidakStandarCount > 0 || u.kdCount > 0);
          return (
            <tr
              key={u.id}
              onClick={() => onBuka(u)}
              title="Klik baris untuk mengisi atau memperbarui inspeksi Kotak P3K"
              className={`transition-colors cursor-pointer ${
                tidakStandar
                  ? 'bg-gradient-to-r from-[#eb5757]/[0.12] via-[#eb5757]/[0.06] to-[#eb5757]/[0.02] dark:from-[#eb5757]/[0.18] dark:via-[#eb5757]/[0.09] dark:to-[#eb5757]/[0.04] hover:from-[#eb5757]/[0.18] hover:to-[#eb5757]/[0.08]'
                  : isCompleted
                  ? 'bg-gradient-to-r from-emerald-500/[0.12] via-emerald-500/[0.06] to-emerald-500/[0.02] dark:from-emerald-500/[0.18] dark:via-emerald-500/[0.09] dark:to-emerald-500/[0.04] hover:from-emerald-500/[0.18] hover:to-emerald-500/[0.08]'
                  : 'hover:bg-[var(--bg-hover)]/60'
              }`}
            >
              <td className="py-2.5 px-3 text-center align-middle font-mono text-[var(--muted)] tabular-nums">
                <span className="font-mono tabular-nums">{idx + 1}</span>
              </td>

              <td className="py-2.5 px-3 text-center align-middle font-semibold text-[var(--primary)] font-mono">
                {u.kode}
              </td>

              <td className="py-2.5 px-3 text-center align-middle font-semibold text-[var(--primary)]">
                {u.zoneName}
              </td>

              <td className="py-2.5 px-3 text-center align-middle">
                <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-bold bg-[#27ae60]/12 border border-[#27ae60]/30 text-[#27ae60]">
                  Tipe {u.boxType} (≤ {u.boxType === 'A' ? '25' : u.boxType === 'B' ? '50' : '100'})
                </span>
              </td>

              <td className="py-2.5 px-3 text-center align-middle">
                {isCompleted ? (
                  <div className="flex items-center justify-center gap-1 flex-wrap text-[10px] font-mono tabular-nums">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/12 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-semibold">
                      {u.standarCount} Standar
                    </span>
                    {u.tidakStandarCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-red-500/15 border border-red-500/35 text-red-600 dark:text-red-400 font-bold">
                        {u.tidakStandarCount} Tidak Standar
                      </span>
                    )}
                    {u.kdCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/35 text-amber-700 dark:text-amber-300 font-bold">
                        {u.kdCount} KD
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-[11px] text-[var(--muted)]">0 / 21 item</span>
                )}
              </td>

              <td className="py-2.5 px-3 text-center align-middle">
                {tidakStandar ? (
                  <span className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
                    <X size={11} strokeWidth={2.5} /> TIDAK STANDAR
                  </span>
                ) : isCompleted ? (
                  <span className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 size={11} /> STANDAR
                  </span>
                ) : (
                  <span className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-[3px] text-[10px] font-medium bg-[var(--bg-hover)] text-[var(--muted)] border border-[var(--border)]">
                    <AlertCircle size={11} /> Belum Diperiksa
                  </span>
                )}
              </td>

              <td className="py-2.5 px-3 text-center align-middle text-[11px] text-[var(--secondary)]">
                <div className="leading-tight text-center flex flex-col items-center justify-center">
                  <p className="font-medium text-[var(--primary)] truncate max-w-[165px]">
                    {u.inspectorName}
                  </p>
                  <p className="text-[10px] text-[var(--muted)] font-mono mt-0.5 tabular-nums">
                    {isCompleted ? fmtTgl(u.inspectionDate) : 'Bulan Ini'}
                  </p>
                </div>
              </td>

              <td className="py-2.5 px-3 align-middle text-[11px] text-[var(--secondary)]">
                <KeteranganTeks teks={u.notes} />
              </td>

              <td className="py-2.5 px-3 text-center align-middle print:hidden">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onHapus(u);
                  }}
                  title={`Hapus kotak ${u.kode}`}
                  aria-label={`Hapus kotak ${u.kode}`}
                  className="p-1.5 rounded-[4px] text-[var(--muted)] hover:text-[#eb5757] hover:bg-[#eb5757]/10 cursor-pointer pressable"
                >
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);
