import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { MenuAksi } from './sidebarTypes';

interface MenuKonteksProps {
  menu: MenuAksi;
  onSunting: () => void;
  onHapus: () => void;
}

/** Menu konteks klik-kanan (ganti nama / hapus) untuk proyek maupun lokasi. */
export const MenuKonteks: React.FC<MenuKonteksProps> = ({ menu, onSunting, onHapus }) => (
  <div
    data-menu-aksi
    className="fixed z-50 w-44 rounded-[6px] border border-[var(--border)] bg-[var(--bg-sidebar)] p-1 shadow-lg"
    style={{
      left: Math.min(menu.x, window.innerWidth - 184),
      top: Math.min(menu.y, window.innerHeight - 90),
    }}
  >
    <div className="px-2 py-1 text-[11px] text-[var(--muted)] truncate">{menu.nama}</div>
    <button
      type="button"
      onClick={onSunting}
      className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-[4px] text-[var(--secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--primary)] cursor-pointer pressable"
    >
      <Pencil size={13} />
      <span>Ganti nama</span>
    </button>
    <button
      type="button"
      onClick={onHapus}
      className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-[4px] text-red-600 dark:text-red-400 hover:bg-red-500/10 cursor-pointer pressable"
    >
      <Trash2 size={13} />
      <span>Hapus {menu.jenis === 'proyek' ? 'proyek' : 'lokasi'}</span>
    </button>
  </div>
);
