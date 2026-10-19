import React from 'react';
import { Loader2, LogOut, Moon, Sun } from 'lucide-react';

interface SidebarPenggunaProps {
  namaPengguna: string;
  isDarkMode: boolean;
  onToggleTheme: (e?: React.MouseEvent) => void;
  onKeluar: () => void;
  keluarBerjalan?: boolean;
}

/** Footer bilah samping: identitas pengguna, pengalih tema, dan tombol keluar. */
export const SidebarPengguna: React.FC<SidebarPenggunaProps> = ({
  namaPengguna,
  isDarkMode,
  onToggleTheme,
  onKeluar,
  keluarBerjalan = false,
}) => (
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
);
