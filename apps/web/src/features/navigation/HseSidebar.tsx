import React, { useState } from 'react';
import {
  CalendarDays,
  ShieldCheck,
  ChevronsUpDown,
  Sun,
  Moon,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  CheckCircle2,
  LogOut,
  Loader2,
} from 'lucide-react';
import { InspectionCategory, CATEGORY_CONFIG } from '../../types/hse';

interface HseSidebarProps {
  activeCategoryFilter: InspectionCategory | 'ALL';
  onSelectCategoryFilter: (cat: InspectionCategory | 'ALL') => void;
  isDarkMode: boolean;
  onToggleTheme: (e?: React.MouseEvent) => void;
  currentView?: 'dashboard' | 'hydrant' | 'apar' | 'p3k' | 'patrol';
  onNavigateView?: (view: 'dashboard' | 'hydrant' | 'apar' | 'p3k' | 'patrol') => void;
  aparOpenCount?: number;
  hydrantUnitCount?: number;
  siteName: string;
  clientName: string;
  namaPengguna: string;
  onKeluar: () => void;
  keluarBerjalan?: boolean;
}

export const HseSidebar: React.FC<HseSidebarProps> = ({
  activeCategoryFilter,
  onSelectCategoryFilter,
  isDarkMode,
  onToggleTheme,
  currentView = 'dashboard',
  onNavigateView,
  aparOpenCount = 0,
  hydrantUnitCount = 0,
  siteName,
  clientName,
  namaPengguna,
  onKeluar,
  keluarBerjalan = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (isCollapsed) {
    return (
      <aside className="w-12 h-screen border-r border-[var(--border)] bg-[var(--bg-sidebar)] flex flex-col justify-between items-center py-3 select-none flex-shrink-0 z-30 transition-[width] duration-200 ease-[var(--ease-out)]">
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          title="Perluas bilah samping"
          aria-label="Perluas bilah samping"
          className="w-8 h-8 rounded-[4px] flex items-center justify-center hover:bg-[var(--bg-hover)] text-[var(--icon-primary)] cursor-pointer pressable"
        >
          <ChevronsRight size={18} />
        </button>

        <button
          type="button"
          onClick={(e) => onToggleTheme(e)}
          aria-label={isDarkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
          title={isDarkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
          className="w-8 h-8 rounded-[4px] flex items-center justify-center text-[var(--secondary)] hover:text-[var(--primary)] hover:bg-[var(--bg-hover)] cursor-pointer pressable"
        >
          {isDarkMode ? <Sun size={15} strokeWidth={1.75} className="text-amber-400" /> : <Moon size={15} strokeWidth={1.75} />}
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-64 h-screen border-r border-[var(--border)] bg-[var(--bg-sidebar)] flex flex-col justify-between select-none flex-shrink-0 z-30 transition-[width] duration-200 ease-[var(--ease-out)] font-sans">
      {/* Header & Site Selector */}
      <div className="flex flex-col">
        {/* Workspace Switcher / Site Selector */}
        <div className="p-2 border-b border-[var(--border)] flex items-center justify-between group">
          <div className="flex items-center gap-2 flex-1 min-w-0 px-1 py-1 rounded-[4px] hover:bg-[var(--bg-hover)] cursor-pointer pressable-subtle">
            <div className="w-7 h-7 rounded-[4px] bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 flex items-center justify-center text-sm font-bold flex-shrink-0">
              🛡️
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-[var(--primary)] truncate leading-tight">
                {siteName}
              </div>
              <div className="text-[11px] text-[var(--muted)] truncate">
                {clientName}
              </div>
            </div>
            <ChevronsUpDown size={14} className="text-[var(--icon-secondary)] flex-shrink-0" />
          </div>

          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            title="Ciutkan bilah samping"
            aria-label="Ciutkan bilah samping"
            className="w-6 h-6 rounded-[3px] flex items-center justify-center text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--bg-hover)] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer pressable"
          >
            <ChevronsLeft size={15} />
          </button>
        </div>

        {/* Primary Action Button: navigation prompt (penambahan laporan lewat halaman masing-masing) */}
        <div className="p-2.5">
          <button
            type="button"
            onClick={() => onNavigateView?.('dashboard')}
            className="w-full flex items-center justify-center gap-2 py-1.5 ps-2.5 pe-3 bg-[#2383e2] hover:bg-[#1a73cb] text-white text-xs font-semibold rounded-[4px] shadow-xs cursor-pointer pressable"
          >
            <CalendarDays size={14} strokeWidth={2} />
            <span>Buka Kalender Inspeksi</span>
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="px-2 space-y-0.5">
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
            Navigasi Menu
          </div>

          <button
            type="button"
            onClick={() => onNavigateView?.('dashboard')}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs rounded-[4px] font-medium cursor-pointer transition-colors pressable-subtle ${
              currentView === 'dashboard'
                ? 'bg-[var(--bg-active)] font-semibold text-[var(--primary)]'
                : 'text-[var(--secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--primary)]'
            }`}
          >
            <CalendarDays size={15} className={currentView === 'dashboard' ? 'text-[#2383e2]' : ''} />
            <span className="flex-1 text-left truncate">Kalender Inspeksi</span>
            {currentView === 'dashboard' && (
              <span className="text-[10px] bg-[#2383e2]/15 text-[#2383e2] px-1.5 py-0.2 rounded-full font-mono font-semibold">
                Aktif
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onNavigateView?.('hydrant')}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs rounded-[4px] font-medium cursor-pointer transition-colors pressable-subtle ${
              currentView === 'hydrant'
                ? 'bg-[var(--bg-active)] font-semibold text-[var(--primary)]'
                : 'text-[var(--secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--primary)]'
            }`}
          >
            <span className="text-sm leading-none">🧯</span>
            <span className="flex-1 text-left truncate">Inspeksi Hydrant</span>
            <span className="text-[10px] bg-red-500/15 text-red-600 dark:text-red-400 px-1.5 py-0.2 rounded-full font-mono font-bold tabular-nums">
              {hydrantUnitCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateView?.('apar')}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs rounded-[4px] font-medium cursor-pointer transition-colors pressable-subtle ${
              currentView === 'apar'
                ? 'bg-[var(--bg-active)] font-semibold text-[var(--primary)]'
                : 'text-[var(--secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--primary)]'
            }`}
          >
            <ShieldCheck size={15} className={currentView === 'apar' ? 'text-[#f2994a]' : ''} />
            <span className="flex-1 text-left truncate">Inspeksi APAR</span>
            <span className="text-[10px] bg-[#f2994a]/15 text-[#f2994a] px-1.5 py-0.2 rounded-full font-mono font-bold tabular-nums">
              {aparOpenCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateView?.('p3k')}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs rounded-[4px] font-medium cursor-pointer transition-colors pressable-subtle ${
              currentView === 'p3k'
                ? 'bg-[var(--bg-active)] font-semibold text-[var(--primary)]'
                : 'text-[var(--secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--primary)]'
            }`}
          >
            <span className="text-sm leading-none">🩹</span>
            <span className="flex-1 text-left truncate">Inspeksi P3K</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateView?.('patrol')}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs rounded-[4px] font-medium cursor-pointer transition-colors pressable-subtle ${
              currentView === 'patrol'
                ? 'bg-[var(--bg-active)] font-semibold text-[var(--primary)]'
                : 'text-[var(--secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--primary)]'
            }`}
          >
            <span className="text-sm leading-none">🚶</span>
            <span className="flex-1 text-left truncate">Patroli K3</span>
          </button>

        </div>

        {/* Filter Kategori */}
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
      </div>

      {/* Footer & User Profile & Theme Toggle */}
      <div className="p-2 border-t border-[var(--border)] space-y-1">
        <div className="flex items-center justify-between px-2 py-1">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
              {namaPengguna.slice(0, 2).toUpperCase()}
            </div>
            <div className="truncate">
              <div className="text-xs font-semibold text-[var(--primary)] leading-tight truncate">
                {namaPengguna}
              </div>
              <div className="text-[10px] text-[var(--muted)] truncate">Petugas Pemeriksa K3</div>
            </div>
          </div>

          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button
              type="button"
              onClick={(e) => onToggleTheme(e)}
              aria-label={isDarkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
              title={isDarkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
              className="w-6 h-6 rounded-[3px] flex items-center justify-center text-[var(--secondary)] hover:text-[var(--primary)] hover:bg-[var(--bg-hover)] cursor-pointer pressable"
            >
              {isDarkMode ? <Sun size={14} strokeWidth={1.75} className="text-amber-400" /> : <Moon size={14} strokeWidth={1.75} />}
            </button>
            <button
              type="button"
              onClick={onKeluar}
              disabled={keluarBerjalan}
              aria-label="Keluar dari aplikasi"
              title="Keluar"
              className="w-6 h-6 rounded-[3px] flex items-center justify-center text-[var(--secondary)] hover:text-rose-600 hover:bg-[var(--bg-hover)] cursor-pointer pressable disabled:opacity-40"
            >
              {keluarBerjalan ? <Loader2 size={13} className="animate-spin" /> : <LogOut size={13} />}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
