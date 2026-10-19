import React from 'react';
import { CheckCircle2, Filter } from 'lucide-react';
import { InspectionCategory, CATEGORY_CONFIG } from '../../types/hse';

interface SidebarFilterProps {
  activeCategoryFilter: InspectionCategory | 'ALL';
  onSelectCategoryFilter: (cat: InspectionCategory | 'ALL') => void;
}

/** Seksi FILTER KATEGORI: semua kategori + 4 kategori warna PRD. */
export const SidebarFilter: React.FC<SidebarFilterProps> = ({
  activeCategoryFilter,
  onSelectCategoryFilter,
}) => (
  <div className="px-2 pt-4 space-y-1">
    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] flex items-center justify-between">
      <span>Filter Kategori</span>
      <Filter size={11} />
    </div>

    <button
      type="button"
      onClick={() => onSelectCategoryFilter('ALL')}
      className={`w-full flex items-center gap-2 px-2.5 py-1 text-xs rounded-[4px] cursor-pointer pressable-subtle ${
        activeCategoryFilter === 'ALL'
          ? 'bg-[var(--bg-hover)] font-semibold text-[var(--primary)]'
          : 'text-[var(--secondary)] hover:bg-[var(--bg-hover)]'
      }`}
    >
      <span className="w-2 h-2 rounded-full bg-neutral-400" />
      <span className="flex-1 text-left">Semua Kategori</span>
      {activeCategoryFilter === 'ALL' && <CheckCircle2 size={12} className="text-[#2383e2]" />}
    </button>

    {(['HYDRANT', 'APAR', 'P3K', 'SAFETY_PATROL'] as InspectionCategory[]).map((cat) => {
      const meta = CATEGORY_CONFIG[cat];
      const isSelected = activeCategoryFilter === cat;

      return (
        <button
          key={cat}
          type="button"
          onClick={() => onSelectCategoryFilter(cat)}
          className={`w-full flex items-center gap-2 px-2.5 py-1 text-xs rounded-[4px] cursor-pointer pressable-subtle ${
            isSelected
              ? 'bg-[var(--bg-hover)] font-semibold text-[var(--primary)]'
              : 'text-[var(--secondary)] hover:bg-[var(--bg-hover)]'
          }`}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: meta.colorHex }}
          />
          <span className="flex-1 text-left">{meta.label}</span>
          {isSelected && (
            <CheckCircle2 size={12} style={{ color: meta.colorHex }} />
          )}
        </button>
      );
    })}
  </div>
);
