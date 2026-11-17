import React from 'react';
import { BriefcaseMedical, CheckCircle2, ChevronRight, ExternalLink, X } from 'lucide-react';
import { format, isValid, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import type { P3kUnitRow } from './P3kUnitTable';

interface P3kCardsProps {
  units: P3kUnitRow[];
  onBuka: (unit: P3kUnitRow) => void;
  aksen: string;
}

function fmtTgl(iso: string): string {
  if (!iso) return 'Bulan Ini';
  const t = parseISO(iso);
  return isValid(t) ? format(t, 'dd MMM yyyy', { locale: idLocale }) : iso;
}

export const P3kCards: React.FC<P3kCardsProps> = ({ units, onBuka, aksen }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
    {units.map((u) => {
      const isCompleted = u.status === 'SELESAI';
      const tidakStandar = isCompleted && (u.tidakStandarCount > 0 || u.kdCount > 0);
      return (
        <div
          key={u.id}
          className={`p-3.5 rounded-[6px] border bg-[var(--bg-main)] hover:shadow-xs transition-all flex flex-col justify-between ${
            tidakStandar
              ? 'border-red-500/40 bg-gradient-to-r from-red-500/[0.04] to-transparent'
              : isCompleted
              ? 'border-emerald-500/30'
              : 'border-[var(--border)]'
          }`}
        >
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-[5px] bg-[#27ae60]/15 border border-[#27ae60]/30 text-[#27ae60] grid place-items-center flex-shrink-0">
                  <BriefcaseMedical size={14} strokeWidth={2.2} />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-[var(--primary)] tracking-tight font-mono">
                    {u.kode}
                  </h3>
                  <span className="text-[11px] text-[var(--secondary)]">
                    {u.zoneName} · Tipe {u.boxType}
                  </span>
                </div>
              </div>

              {tidakStandar ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
                  <X size={11} strokeWidth={2.5} /> TIDAK STANDAR
                </span>
              ) : isCompleted ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={11} /> STANDAR
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] text-[10px] font-medium bg-[var(--bg-hover)] text-[var(--muted)]">
                  Belum Diperiksa
                </span>
              )}
            </div>

            <div className="mt-3 pt-2 border-t border-[var(--border)] flex items-center justify-between text-[11px]">
              <span className="font-semibold text-[var(--primary)]">
                Standar Tipe {u.boxType} (≤ {u.boxType === 'A' ? '25' : u.boxType === 'B' ? '50' : '100'} pekerja)
              </span>
              <span className="font-mono text-[var(--secondary)] tabular-nums">
                {isCompleted ? `${u.standarCount}/21 Standar` : '0/21'}
              </span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-[var(--border)] flex items-center justify-between text-xs">
            <span className="text-[10px] text-[var(--muted)] font-mono tabular-nums">
              {isCompleted ? fmtTgl(u.inspectionDate) : 'Bulan Ini'}
            </span>

            {isCompleted ? (
              <button
                type="button"
                onClick={() => onBuka(u)}
                className="px-2.5 py-1 text-xs font-semibold rounded-[4px] border border-[var(--border)] hover:bg-[var(--bg-hover)] text-[var(--primary)] cursor-pointer flex items-center gap-1 pressable"
              >
                <span>Lihat Laporan</span>
                <ExternalLink size={11} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onBuka(u)}
                style={{ backgroundColor: aksen }}
                className="px-3 py-1 text-xs font-semibold rounded-[4px] text-white shadow-xs cursor-pointer flex items-center gap-1 pressable"
              >
                <span>Mulai Inspeksi</span>
                <ChevronRight size={12} />
              </button>
            )}
          </div>
        </div>
      );
    })}
  </div>
);
