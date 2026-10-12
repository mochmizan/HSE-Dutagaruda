import React from 'react';
import {
  Check,
} from 'lucide-react';
import { InspectionCategory } from '../../types/hse';

export interface KpiPersegi {
  /** Angka besar (sudah berformat, mis. “5/9”, “3 temuan”). */
  nilai: string;
  /** Lencana kecil di pojok kanan atas. */
  badge: string;
  subtext: string;
  statusText: string;
}

interface KpiGridProps {
  onSelectCategory?: (category: InspectionCategory | 'ALL') => void;
  onOpenCategoryPage?: (category: InspectionCategory) => void;
  hidran: KpiPersegi;
  apar: KpiPersegi;
  p3k: KpiPersegi;
  patroli: KpiPersegi;
}

export const KpiGrid: React.FC<KpiGridProps> = ({ onSelectCategory, onOpenCategoryPage, hidran, apar, p3k, patroli }) => {
  return (
    <div className="grid grid-cols-4 gap-3 mt-3 select-none">
      {/* Square 1: Hydrant (Red - #eb5757) */}
      <div
        onClick={() => {
          onOpenCategoryPage?.('HYDRANT');
          onSelectCategory?.('HYDRANT');
        }}
        className="p-3 bg-gradient-to-b from-[#eb5757]/[0.08] to-[#eb5757]/[0.02] dark:from-[#eb5757]/[0.14] dark:to-[#eb5757]/[0.04] border border-[#eb5757]/25 dark:border-[#eb5757]/35 rounded-[6px] hover:border-[#eb5757] hover:shadow-xs cursor-pointer flex flex-col justify-between group pressable-subtle transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-[3px] bg-[#eb5757]/15 text-[#eb5757] flex items-center justify-center text-xs font-bold">
              🧯
            </span>
            <span className="text-[11px] font-semibold text-[var(--primary)] uppercase tracking-wider">
              Hydrant
            </span>
          </div>
          <span className="text-[9px] bg-red-500/15 text-red-600 dark:text-red-400 font-semibold px-1.5 py-0.2 rounded font-mono tabular-nums">
            {hidran.badge}
          </span>
        </div>

        <div className="my-2">
          <div className="text-xl font-bold text-[var(--primary)] font-mono leading-none tabular-nums">
            {hidran.nilai}
          </div>
          <div className="text-[10px] text-[var(--muted)] mt-1 truncate">
            {hidran.subtext}
          </div>
        </div>

        <div className="flex items-center justify-between pt-1.5 border-t border-[#eb5757]/15 dark:border-[#eb5757]/25 text-[10px]">
          <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5 truncate">
            <Check size={11} /> {hidran.statusText}
          </span>
          <span className="text-[9px] text-[#eb5757] font-semibold opacity-80 group-hover:opacity-100 transition-opacity flex-shrink-0">
            Buka Halaman →
          </span>
        </div>
      </div>

      {/* Square 2: APAR (Orange - #f2994a) */}
      <div
        onClick={() => {
          onOpenCategoryPage?.('APAR');
          onSelectCategory?.('APAR');
        }}
        className="p-3 bg-gradient-to-b from-[#f2994a]/[0.08] to-[#f2994a]/[0.02] dark:from-[#f2994a]/[0.14] dark:to-[#f2994a]/[0.04] border border-[#f2994a]/25 dark:border-[#f2994a]/35 rounded-[6px] hover:border-[#f2994a] hover:shadow-xs cursor-pointer flex flex-col justify-between group pressable-subtle transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-[3px] bg-[#f2994a]/15 text-[#f2994a] flex items-center justify-center text-xs font-bold">
              🔥
            </span>
            <span className="text-[11px] font-semibold text-[var(--primary)] uppercase tracking-wider">
              APAR
            </span>
          </div>
          <span className="text-[9px] bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold px-1.5 py-0.2 rounded tabular-nums">
            {apar.badge}
          </span>
        </div>

        <div className="my-2">
          <div className="text-xl font-bold text-[var(--primary)] font-mono leading-none tabular-nums">
            {apar.nilai}
          </div>
          <div className="text-[10px] text-[var(--muted)] mt-1 truncate">
            {apar.subtext}
          </div>
        </div>

        <div className="flex items-center justify-between pt-1.5 border-t border-[#f2994a]/15 dark:border-[#f2994a]/25 text-[10px]">
          <span className="text-amber-600 dark:text-amber-400 font-medium truncate">
            {apar.statusText}
          </span>
          <span className="text-[9px] text-[#f2994a] font-semibold opacity-80 group-hover:opacity-100 transition-opacity flex-shrink-0">
            Buka Halaman →
          </span>
        </div>
      </div>

      {/* Square 3: Kotak P3K (Green - #27ae60) */}
      <div
        onClick={() => {
          onOpenCategoryPage?.('P3K');
          onSelectCategory?.('P3K');
        }}
        className="p-3 bg-gradient-to-b from-[#27ae60]/[0.08] to-[#27ae60]/[0.02] dark:from-[#27ae60]/[0.14] dark:to-[#27ae60]/[0.04] border border-[#27ae60]/25 dark:border-[#27ae60]/35 rounded-[6px] hover:border-[#27ae60] hover:shadow-xs cursor-pointer flex flex-col justify-between group pressable-subtle transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-[3px] bg-[#27ae60]/15 text-[#27ae60] flex items-center justify-center text-xs font-bold">
              🩹
            </span>
            <span className="text-[11px] font-semibold text-[var(--primary)] uppercase tracking-wider">
              Kotak P3K
            </span>
          </div>
          <span className="text-[9px] bg-rose-500/15 text-rose-600 dark:text-rose-400 font-semibold px-1.5 py-0.2 rounded tabular-nums">
            {p3k.badge}
          </span>
        </div>

        <div className="my-2">
          <div className="text-xl font-bold text-[var(--primary)] font-mono leading-none tabular-nums">
            {p3k.nilai}
          </div>
          <div className="text-[10px] text-[var(--muted)] mt-1 truncate">
            {p3k.subtext}
          </div>
        </div>

        <div className="flex items-center justify-between pt-1.5 border-t border-[#27ae60]/15 dark:border-[#27ae60]/25 text-[10px]">
          <span className="text-rose-600 dark:text-rose-400 font-medium truncate">
            {p3k.statusText}
          </span>
          <span className="text-[9px] text-[#27ae60] font-semibold opacity-80 group-hover:opacity-100 transition-opacity flex-shrink-0">
            Buka Halaman →
          </span>
        </div>
      </div>

      {/* Square 4: Safety Patrol (Blue - #2f80ed) */}
      <div
        onClick={() => {
          onOpenCategoryPage?.('SAFETY_PATROL');
          onSelectCategory?.('SAFETY_PATROL');
        }}
        className="p-3 bg-gradient-to-b from-[#2f80ed]/[0.08] to-[#2f80ed]/[0.02] dark:from-[#2f80ed]/[0.14] dark:to-[#2f80ed]/[0.04] border border-[#2f80ed]/25 dark:border-[#2f80ed]/35 rounded-[6px] hover:border-[#2f80ed] hover:shadow-xs cursor-pointer flex flex-col justify-between group pressable-subtle transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-[3px] bg-[#2f80ed]/15 text-[#2f80ed] flex items-center justify-center text-xs font-bold">
              🚶
            </span>
            <span className="text-[11px] font-semibold text-[var(--primary)] uppercase tracking-wider">
              Patroli K3
            </span>
          </div>
          <span className="text-[9px] bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold px-1.5 py-0.2 rounded tabular-nums">
            {patroli.badge}
          </span>
        </div>

        <div className="my-2">
          <div className="text-xl font-bold text-[var(--primary)] font-mono leading-none tabular-nums">
            {patroli.nilai} <span className="text-xs font-normal">temuan</span>
          </div>
          <div className="text-[10px] text-[var(--muted)] mt-1 truncate">
            {patroli.subtext}
          </div>
        </div>

        <div className="flex items-center justify-between pt-1.5 border-t border-[#2f80ed]/15 dark:border-[#2f80ed]/25 text-[10px]">
          <span className="text-blue-600 dark:text-blue-400 font-medium truncate">
            {patroli.statusText}
          </span>
          <span className="text-[9px] text-[#2f80ed] font-semibold opacity-80 group-hover:opacity-100 transition-opacity flex-shrink-0">
            Buka Halaman →
          </span>
        </div>
      </div>
    </div>
  );
};
