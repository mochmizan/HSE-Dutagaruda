import React from 'react';
import { CheckCircle2, ChevronDown, ChevronsLeft, Plus } from 'lucide-react';
import type { Proyek } from '../auth/sesi';
import type { KeadaanProyek } from './aksiSidebar';
import type { MenuAksi } from './sidebarTypes';

interface SidebarProyekProps {
  namaProyek: string;
  onToggleCollapsed: () => void;
  keadaan: KeadaanProyek;
  daftar: Proyek[];
  perusahaanId: string | null;
  pindahBerjalan: boolean;
  onPindah: (id: string) => void;
  onBukaMenu: (menu: MenuAksi) => void;
  onSimpanSunting: (id: string) => void;
  onSimpanBaru: () => void;
}

/**
 * Header bilah samping: tombol ciutkan + pengalih proyek.
 * Daftar proyek terbuka sebaris di bawah judul (tanpa popup); ganti nama dan
 * tambah proyek memakai input sebaris dengan pola yang sama seperti lokasi.
 */
export const SidebarProyek: React.FC<SidebarProyekProps> = ({
  namaProyek,
  onToggleCollapsed,
  keadaan,
  daftar,
  perusahaanId,
  pindahBerjalan,
  onPindah,
  onBukaMenu,
  onSimpanSunting,
  onSimpanBaru,
}) => (
  <div className="p-2 border-b border-[var(--border)] flex items-start gap-1">
    <button
      type="button"
      onClick={onToggleCollapsed}
      title="Ciutkan bilah samping"
      aria-label="Ciutkan bilah samping"
      className="w-6 h-6 mt-1 rounded-[3px] flex items-center justify-center text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--bg-hover)] cursor-pointer pressable flex-shrink-0"
    >
      <ChevronsLeft size={15} />
    </button>
    <div className="flex-1 min-w-0">
      <button
        type="button"
        onClick={() => keadaan.setTerbuka((v) => !v)}
        title="Ganti proyek"
        aria-label="Ganti proyek"
        className="w-full flex items-center gap-2 px-1 py-1 rounded-[4px] hover:bg-[var(--bg-hover)] cursor-pointer pressable-subtle"
      >
        <div className="w-7 h-7 rounded-[4px] bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 flex items-center justify-center text-sm font-bold flex-shrink-0">
          🛡️
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="text-[13px] font-semibold text-[var(--primary)] truncate leading-tight">
            {namaProyek}
          </div>
        </div>
        <ChevronDown
          size={14}
          className={`text-[var(--icon-secondary)] flex-shrink-0 transition-transform ${keadaan.terbuka ? '' : '-rotate-90'}`}
        />
      </button>
      {keadaan.terbuka && (
        <div className="mt-1 -ml-7 w-[calc(100%+1.75rem)] space-y-0.5">
          <div className="flex items-center justify-between px-2 pt-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
              Proyek
            </span>
            <button
              type="button"
              onClick={() => {
                keadaan.setTambah(true);
                keadaan.setNamaBaru('');
              }}
              title="Tambah proyek"
              aria-label="Tambah proyek"
              className="w-5 h-5 rounded-[3px] flex items-center justify-center text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--bg-hover)] cursor-pointer pressable"
            >
              <Plus size={13} />
            </button>
          </div>
          {daftar.map((p) =>
            keadaan.suntingId === p.id ? (
              <input
                key={p.id}
                autoFocus
                value={keadaan.namaSunting}
                onChange={(e) => keadaan.setNamaSunting(e.target.value)}
                onBlur={() => onSimpanSunting(p.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSimpanSunting(p.id);
                  if (e.key === 'Escape') keadaan.setSuntingId(null);
                }}
                aria-label="Nama proyek"
                className="w-full text-xs bg-[var(--bg-main)] border border-[var(--border)] rounded-[3px] px-2 py-1 text-[var(--primary)] focus:outline-none"
              />
            ) : (
              <div
                key={p.id}
                onContextMenu={(e) => {
                  e.preventDefault();
                  onBukaMenu({ x: e.clientX, y: e.clientY, jenis: 'proyek', id: p.id, nama: p.nama });
                }}
                className={`w-full flex items-center gap-2 px-2 py-1 text-xs rounded-[4px] cursor-pointer pressable-subtle ${
                  p.id === perusahaanId
                    ? 'bg-[var(--bg-hover)] font-semibold text-[var(--primary)]'
                    : 'text-[var(--secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--primary)]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (p.id !== perusahaanId) onPindah(p.id);
                    keadaan.setTerbuka(false);
                  }}
                  onDoubleClick={() => {
                    keadaan.setSuntingId(p.id);
                    keadaan.setNamaSunting(p.nama);
                  }}
                  disabled={pindahBerjalan}
                  title="Klik untuk pindah, dobel-klik atau klik-kanan untuk ganti nama"
                  className="flex-1 min-w-0 flex items-center gap-2 cursor-pointer disabled:opacity-40"
                >
                  <span className="flex-1 text-left truncate">{p.nama}</span>
                  {p.id === perusahaanId && (
                    <CheckCircle2 size={12} className="text-[#2383e2] flex-shrink-0" />
                  )}
                </button>
              </div>
            ),
          )}
          {keadaan.tambah && (
            <input
              autoFocus
              value={keadaan.namaBaru}
              onChange={(e) => keadaan.setNamaBaru(e.target.value)}
              onBlur={() => {
                if (keadaan.namaBaru.trim()) onSimpanBaru();
                else keadaan.setTambah(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSimpanBaru();
                if (e.key === 'Escape') keadaan.setTambah(false);
              }}
              placeholder="Nama proyek baru…"
              aria-label="Nama proyek baru"
              className="w-full text-xs bg-[var(--bg-main)] border border-[var(--border)] rounded-[4px] px-2 py-1 text-[var(--primary)] placeholder-[var(--muted)] focus:outline-none"
            />
          )}
        </div>
      )}
    </div>
  </div>
);
