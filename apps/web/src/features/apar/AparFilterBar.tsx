import React from 'react';
import { Search } from 'lucide-react';
import { ViewToggle } from '@/components/ui';

interface AparFilterBarProps {
  filterTab: 'ALL' | 'ON_PROGRESS' | 'COMPLETED';
  onFilterTab: (tab: 'ALL' | 'ON_PROGRESS' | 'COMPLETED') => void;
  total: number;
  completed: number;
  zona: string[];
  zoneFilter: string;
  onZoneFilter: (zona: string) => void;
  searchQuery: string;
  onSearchQuery: (q: string) => void;
  viewMode: 'TABLE' | 'CARDS';
  onViewMode: (mode: 'TABLE' | 'CARDS') => void;
}

/** Tab filter status, saringan zona, kotak cari, dan pengalih tabel/kartu APAR. */
export const AparFilterBar: React.FC<AparFilterBarProps> = ({
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
}) => {
  const tabs = [
    { key: 'ALL', label: 'Semua Unit', count: total },
    { key: 'ON_PROGRESS', label: 'Sedang Berjalan', count: total - completed },
    { key: 'COMPLETED', label: 'Selesai Diperiksa', count: completed },
  ] as const;
  return (
    <div className="no-print flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 pb-3 mb-3 border-b border-[var(--border)]">
      <div className="flex items-center gap-1 bg-[var(--bg-sidebar)] p-0.5 rounded-[5px] border border-[var(--border)] text-xs flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onFilterTab(tab.key)}
            className={`py-1.5 px-3 rounded-[4px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              filterTab === tab.key
                ? 'bg-white dark:bg-[var(--bg-hover)] text-[var(--primary)] font-semibold shadow-xs'
                : 'text-[var(--secondary)] hover:text-[var(--primary)]'
            }`}
          >
            <span>{tab.label}</span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full tabular-nums bg-[var(--bg-hover)] text-[var(--muted)]">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
        <select
          value={zoneFilter}
          onChange={(e) => onZoneFilter(e.target.value)}
          className="text-xs px-2.5 py-1.5 rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] focus:outline-none"
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
            placeholder="Cari kode, zona, atau petugas…"
            value={searchQuery}
            onChange={(e) => onSearchQuery(e.target.value)}
            className="w-full pl-7 pr-2.5 py-1.5 text-xs bg-[var(--bg-main)] border border-[var(--border)] rounded-[4px] text-[var(--primary)] placeholder-[var(--muted)] focus:outline-none"
          />
        </div>
        <ViewToggle value={viewMode} onChange={onViewMode} />
      </div>
    </div>
  );
};
