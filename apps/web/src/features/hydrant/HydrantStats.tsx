import React from 'react';
import { Search } from 'lucide-react';
import { ViewToggle } from '@/components/ui';

type FilterTab = 'ALL' | 'ON_PROGRESS' | 'COMPLETED';
type ViewMode = 'TABLE' | 'CARDS';

interface HydrantStatsProps {
  totalUnits: number;
  jumlahZona: number;
  completed: number;
}

/** Dua kartu ringkas di atas tabel: total unit dan unit selesai. */
export const HydrantStats: React.FC<HydrantStatsProps> = ({ totalUnits, jumlahZona, completed }) => (
  <div className="no-print grid grid-cols-2 gap-3 mb-4">
    <div className="p-3 bg-[var(--bg-main)] border border-[var(--border)] rounded-[6px] shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
          Total Hydrant Terdaftar
        </span>
        <span className="text-xs">🏢</span>
      </div>
      <div className="my-1.5">
        <div className="text-2xl font-bold font-mono text-[var(--primary)] tabular-nums">
          {totalUnits} Unit
        </div>
        <div className="text-[10px] text-[var(--muted)] mt-0.5">{jumlahZona} Zona Terpantau</div>
      </div>
      <div className="text-[10px] text-[var(--muted)] pt-1 border-t border-[var(--border)]">
        Wajib periksa 1x per bulan
      </div>
    </div>

    <div className="p-3 bg-gradient-to-b from-emerald-500/[0.08] to-emerald-500/[0.02] dark:from-emerald-500/[0.14] dark:to-emerald-500/[0.04] border border-emerald-500/30 rounded-[6px] shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
          Selesai Diperiksa
        </span>
        <span className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.2 rounded">
          Lengkap
        </span>
      </div>
      <div className="my-1.5">
        <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
          {completed} Unit
        </div>
        <div className="text-[10px] text-[var(--muted)] mt-0.5">100% Layak beroperasi</div>
      </div>
      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 pt-1 border-t border-emerald-500/20 font-medium">
        Laporan telah diterbitkan
      </div>
    </div>
  </div>
);

interface HydrantFilterBarProps {
  filterTab: FilterTab;
  onFilterTab: (tab: FilterTab) => void;
  totalUnits: number;
  onProgress: number;
  completed: number;
  zona: string[];
  zoneFilter: string;
  onZoneFilter: (zona: string) => void;
  searchQuery: string;
  onSearchQuery: (q: string) => void;
  viewMode: ViewMode;
  onViewMode: (mode: ViewMode) => void;
}

const KELAS_TAB = (aktif: boolean) =>
  `py-1.5 px-3 rounded-[4px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
    aktif
      ? 'bg-white dark:bg-[var(--bg-hover)] text-[var(--primary)] font-semibold shadow-xs'
      : 'text-[var(--secondary)] hover:text-[var(--primary)]'
  }`;

/** Tab filter status, saringan zona, kotak cari, dan pengalih tabel/kartu. */
export const HydrantFilterBar: React.FC<HydrantFilterBarProps> = ({
  filterTab,
  onFilterTab,
  totalUnits,
  onProgress,
  completed,
  zona,
  zoneFilter,
  onZoneFilter,
  searchQuery,
  onSearchQuery,
  viewMode,
  onViewMode,
}) => (
  <div className="no-print flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 pb-3 mb-3 border-b border-[var(--border)]">
    <div className="flex items-center gap-1 bg-[var(--bg-sidebar)] p-0.5 rounded-[5px] border border-[var(--border)] text-xs flex-wrap">
      <button type="button" onClick={() => onFilterTab('ALL')} className={KELAS_TAB(filterTab === 'ALL')}>
        <span>Semua Unit</span>
        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-[var(--bg-hover)] text-[var(--muted)]">
          {totalUnits}
        </span>
      </button>

      <button
        type="button"
        onClick={() => onFilterTab('ON_PROGRESS')}
        className={KELAS_TAB(filterTab === 'ON_PROGRESS')}
      >
        <span>Sedang Berjalan (On Progress)</span>
        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
          {onProgress}
        </span>
      </button>

      <button
        type="button"
        onClick={() => onFilterTab('COMPLETED')}
        className={KELAS_TAB(filterTab === 'COMPLETED')}
      >
        <span>Selesai Diperiksa</span>
        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
          {completed}
        </span>
      </button>
    </div>

    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
      <select
        value={zoneFilter}
        onChange={(e) => onZoneFilter(e.target.value)}
        className="text-xs px-2.5 py-1.5 rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] focus:outline-none focus:border-[#eb5757]"
      >
        <option value="ALL">Semua Zona ({zona.length})</option>
        {zona.map((z) => (
          <option key={z} value={z}>
            {z}
          </option>
        ))}
      </select>

      <div className="relative min-w-[170px] flex-1 sm:flex-initial">
        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
        <input
          type="text"
          placeholder="Cari unit atau zona..."
          value={searchQuery}
          onChange={(e) => onSearchQuery(e.target.value)}
          className="w-full pl-7 pr-2.5 py-1.5 text-xs bg-[var(--bg-main)] border border-[var(--border)] rounded-[4px] text-[var(--primary)] placeholder-[var(--muted)] focus:outline-none focus:border-[#eb5757]"
        />
      </div>

      <ViewToggle value={viewMode} onChange={onViewMode} />
    </div>
  </div>
);
