import React from 'react';
import { ChevronDown, MapPin, Plus, ShieldCheck } from 'lucide-react';
import type { LokasiRingkas } from '../konteksLokasi';
import type { KeadaanLokasi } from './aksiSidebar';
import type { HitungLokasi, MenuAksi, ViewHalaman } from './sidebarTypes';

interface SidebarLokasiProps {
  daftar: LokasiRingkas[];
  siteId: string;
  onPilih: (siteId: string) => void;
  keadaan: KeadaanLokasi;
  currentView: ViewHalaman;
  onNavigateView?: (view: ViewHalaman) => void;
  hitungLokasi: (siteId: string) => HitungLokasi;
  onBukaMenu: (menu: MenuAksi) => void;
  onSimpanSunting: (id: string) => void;
  onSimpanBaru: () => void;
}

/**
 * Seksi LOKASI: tambah + sunting nama sebaris (tanpa popup); tiap baris
 * melipat untuk 4 kategori dan memindah lokasi aktif saat dipilih.
 */
export const SidebarLokasi: React.FC<SidebarLokasiProps> = ({
  daftar,
  siteId,
  onPilih,
  keadaan,
  currentView,
  onNavigateView,
  hitungLokasi,
  onBukaMenu,
  onSimpanSunting,
  onSimpanBaru,
}) => (
  <div className="px-2 pt-4 space-y-1">
    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] flex items-center justify-between">
      <span>Lokasi</span>
      <button
        type="button"
        onClick={() => {
          keadaan.setTambah(true);
          keadaan.setNamaBaru('');
        }}
        title="Tambah lokasi"
        aria-label="Tambah lokasi"
        className="w-5 h-5 rounded-[3px] flex items-center justify-center text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--bg-hover)] cursor-pointer pressable"
      >
        <Plus size={13} />
      </button>
    </div>

    {daftar.map((site) => {
      const aktif = site.id === siteId;
      const terbuka = site.id === keadaan.terbukaId;
      const sedangSunting = site.id === keadaan.suntingId;

      return (
        <div key={site.id}>
          <div
            onContextMenu={(e) => {
              e.preventDefault();
              onBukaMenu({ x: e.clientX, y: e.clientY, jenis: 'lokasi', id: site.id, nama: site.name });
            }}
            className={`w-full flex items-center gap-2 px-2.5 py-1 text-xs rounded-[4px] cursor-pointer pressable-subtle group ${
              aktif
                ? 'bg-[var(--bg-hover)] font-semibold text-[var(--primary)]'
                : 'text-[var(--secondary)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            {sedangSunting ? (
              <input
                autoFocus
                value={keadaan.namaSunting}
                onChange={(e) => keadaan.setNamaSunting(e.target.value)}
                onBlur={() => onSimpanSunting(site.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSimpanSunting(site.id);
                  if (e.key === 'Escape') keadaan.setSuntingId(null);
                }}
                aria-label="Nama lokasi"
                className="flex-1 min-w-0 text-xs bg-[var(--bg-main)] border border-[var(--border)] rounded-[3px] px-1.5 py-0.5 text-[var(--primary)] focus:outline-none"
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  onPilih(site.id);
                  keadaan.setTerbukaId(terbuka ? null : site.id);
                }}
                title="Klik untuk buka, klik-kanan untuk ganti nama atau hapus"
                className="flex-1 min-w-0 flex items-center gap-2 cursor-pointer"
              >
                <MapPin size={13} className={aktif ? 'text-[#eb5757]' : 'text-[var(--muted)]'} />
                <span className="flex-1 text-left truncate">{site.name}</span>
                <ChevronDown
                  size={12}
                  className={`text-[var(--muted)] transition-transform ${terbuka ? '' : '-rotate-90'}`}
                />
              </button>
            )}
          </div>

          {terbuka && !sedangSunting && (
            <div className="ml-5 mt-0.5 space-y-0.5 border-l border-[var(--border)] pl-1">
              {(
                [
                  { view: 'hydrant', label: 'Inspeksi Hydrant', ikon: <span className="text-xs leading-none">🧯</span>, badge: hitungLokasi(site.id).hydrant, badgeKelas: 'bg-red-500/15 text-red-600 dark:text-red-400' },
                  { view: 'apar', label: 'Inspeksi APAR', ikon: <ShieldCheck size={13} className="text-[#f2994a]" />, badge: hitungLokasi(site.id).apar, badgeKelas: 'bg-[#f2994a]/15 text-[#f2994a]' },
                  { view: 'p3k', label: 'Inspeksi P3K', ikon: <span className="text-xs leading-none">🩹</span>, badge: hitungLokasi(site.id).p3k, badgeKelas: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
                  { view: 'patrol', label: 'Patroli K3', ikon: <span className="text-xs leading-none">🚶</span>, badge: 0, badgeKelas: '' },
                ] as const
              ).map((kat) => (
                <button
                  key={kat.view}
                  type="button"
                  onClick={() => {
                    onPilih(site.id);
                    onNavigateView?.(kat.view);
                  }}
                  className={`w-full flex items-center gap-2 px-2 py-1 text-[11px] rounded-[3px] cursor-pointer pressable-subtle ${
                    aktif && currentView === kat.view
                      ? 'bg-[var(--bg-active)] font-semibold text-[var(--primary)]'
                      : 'text-[var(--secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--primary)]'
                  }`}
                >
                  {kat.ikon}
                  <span className="flex-1 text-left truncate">{kat.label}</span>
                  {kat.badge > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold tabular-nums ${kat.badgeKelas}`}>
                      {kat.badge}
                    </span>
                  )}
                  {(aktif && currentView === kat.view && kat.badge === 0) && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2383e2]" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      );
    })}

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
        placeholder="Nama lokasi baru…"
        aria-label="Nama lokasi baru"
        className="w-full text-xs bg-[var(--bg-main)] border border-[var(--border)] rounded-[4px] px-2.5 py-1 text-[var(--primary)] placeholder-[var(--muted)] focus:outline-none"
      />
    )}
  </div>
);
