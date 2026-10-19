import React from 'react';
import { CalendarDays } from 'lucide-react';
import type { ViewHalaman } from './sidebarTypes';

interface SidebarNavigasiProps {
  currentView: ViewHalaman;
  onNavigateView?: (view: ViewHalaman) => void;
}

/** Menu utama bilah samping: satu baris kalender inspeksi. */
export const SidebarNavigasi: React.FC<SidebarNavigasiProps> = ({ currentView, onNavigateView }) => (
  <div className="px-2 pt-2 space-y-0.5">
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
  </div>
);
