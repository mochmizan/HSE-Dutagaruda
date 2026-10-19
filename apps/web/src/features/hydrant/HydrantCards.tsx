import React from 'react';
import { Check, CheckCircle2, ChevronRight, Clock, ExternalLink, X } from 'lucide-react';
import type { HydrantUnitItem } from '../../types/hse';
import { detailKomponen, tanggalTampil, unitTidakLayak } from './HydrantTable';

interface HydrantCardsProps {
  units: HydrantUnitItem[];
  onBuka: (unit: HydrantUnitItem) => void;
  /** Warna aksi utama; halaman mengoperaksennya sendiri. */
  aksen: string;
}

/**
 * Tampilan kartu Section A halaman Hydrant.
 *
 * Dipisah dari HydrantPage. Chip komponen memakai helper yang sama dengan
 * tabel, jadi kedua tampilan tidak bisa menyimpulkan status berbeda.
 */
export const HydrantCards: React.FC<HydrantCardsProps> = ({ units, onBuka, aksen }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
    {units.map((unit) => {
      const isCompleted = unit.status === 'SELESAI';
      const isOnProgress = unit.status === 'SEDANG_BERJALAN';
      const komponen = detailKomponen(unit);
      const tidakLayak = unitTidakLayak(unit, komponen);

      return (
        <div
          key={unit.id}
          className={`p-3.5 rounded-[6px] border bg-[var(--bg-main)] hover:shadow-xs transition-all flex flex-col justify-between ${
            tidakLayak
              ? 'border-red-500/40 bg-gradient-to-r from-red-500/[0.04] to-transparent'
              : isOnProgress
              ? 'border-[#eb5757]/40 bg-gradient-to-r from-[#eb5757]/[0.03] to-transparent'
              : isCompleted
              ? 'border-emerald-500/30'
              : 'border-[var(--border)]'
          }`}
        >
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-[var(--primary)] tracking-tight font-mono">
                  {unit.kode}
                </h3>
                <span className="text-[10px] text-[var(--secondary)]">{unit.zoneName}</span>
              </div>

              {tidakLayak ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
                  <X size={11} strokeWidth={2.5} /> TIDAK LAYAK
                </span>
              ) : isCompleted ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={11} /> LAYAK
                </span>
              ) : isOnProgress ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  <Clock size={11} /> Berjalan
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] text-[10px] font-medium bg-[var(--bg-hover)] text-[var(--muted)]">
                  Belum Dimulai
                </span>
              )}
            </div>

            <div className="mt-3 pt-2 border-t border-[var(--border)]">
              <div className="flex flex-wrap gap-1">
                {komponen.map((item) => {
                  const isOk = item.status === 'LAYAK' || (isCompleted && !item.status && !tidakLayak);
                  const isNotLayak = item.status === 'TIDAK_LAYAK' || item.status === 'HILANG';
                  const isChecked = Boolean(item.status) || isCompleted;

                  return (
                    <span
                      key={item.label}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono flex items-center gap-1 border ${
                        isOk
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold'
                          : isNotLayak
                          ? 'bg-red-500/20 border-red-500/40 text-red-600 dark:text-red-400 font-bold'
                          : isChecked
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                          : 'bg-[var(--bg-hover)] border-dashed border-[var(--border)] text-[var(--muted)]'
                      }`}
                    >
                      {isOk ? (
                        <Check size={9} strokeWidth={2.5} />
                      ) : isNotLayak ? (
                        <X size={10} strokeWidth={2.5} className="text-red-600 dark:text-red-400" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                      )}
                      <span>{item.label}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-[var(--border)] flex items-center justify-between text-xs">
            <span className="text-[10px] text-[var(--muted)] font-mono">{tanggalTampil(unit)}</span>

            {isCompleted ? (
              <button
                type="button"
                onClick={() => onBuka(unit)}
                title="Buka form inspeksi bulan ini"
                className="px-2.5 py-1 text-xs font-semibold rounded-[4px] border border-[var(--border)] hover:bg-[var(--bg-hover)] text-[var(--primary)] cursor-pointer flex items-center gap-1 pressable"
              >
                <span>Lihat Laporan</span>
                <ExternalLink size={11} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onBuka(unit)}
                style={{ backgroundColor: aksen }}
                className="px-3 py-1 text-xs font-semibold rounded-[4px] text-white shadow-xs cursor-pointer flex items-center gap-1 pressable disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>{isOnProgress ? 'Lanjutkan' : 'Mulai Inspeksi'}</span>
                <ChevronRight size={12} />
              </button>
            )}
          </div>
        </div>
      );
    })}
  </div>
);
