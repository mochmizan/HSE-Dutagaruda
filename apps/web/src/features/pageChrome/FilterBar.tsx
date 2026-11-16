import React from 'react';
import { Search } from 'lucide-react';
import { ViewToggle, type ViewMode } from '@/components/ui';

export type FilterTab = 'ALL' | 'ON_PROGRESS' | 'COMPLETED';

interface FilterBarProps {
  filterTab: FilterTab;
  onFilterTab: (tab: FilterTab) => void;
  total: number;
  onProgress?: number;
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

/**
 * Tab filter status (Total Unit & Selesai Diperiksa), saringan zona, kotak cari,
 * dan pengalih tabel/kartu. Sesuai revisi: tab "Sedang Berjalan (On Progress)"
 * dihapus, menyisakan Total Unit dan Selesai Diperiksa.
 */
export const FilterBar: React.FC<FilterBarProps> = ({
  filterTab,
  onFilterTab,
  total,
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
        <span>Total Unit</span>
        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full tabular-nums bg-[var(--bg-hover)] text-[var(--muted)]">
          {total}
        </span>
      </button>

      <button
        type="button"
        onClick={() => onFilterTab('COMPLETED')}
        className={KELAS_TAB(filterTab === 'COMPLETED')}
      >
        <span>Selesai Diperiksa</span>
        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full tabular-nums bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
          {completed}
        </span>
      </button>
    </div>

    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
      <select
        value={zoneFilter}
        onChange={(e) => onZoneFilter(e.target.value)}
        className="text-xs px-2.5 py-1.5 rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] focus:outline-none focus:border-[#2f80ed]"
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
          className="w-full pl-7 pr-2.5 py-1.5 text-xs bg-[var(--bg-main)] border border-[var(--border)] rounded-[4px] text-[var(--primary)] placeholder-[var(--muted)] focus:outline-none focus:border-[#2f80ed]"
        />
      </div>

      <ViewToggle value={viewMode} onChange={onViewMode} />
    </div>
  </div>
);
