import React, { useState } from 'react';
import {
  CalendarDays,
  ShieldCheck,
  Sun,
  Moon,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  Filter,
  CheckCircle2,
  LogOut,
  Loader2,
  MapPin,
  Plus,
} from 'lucide-react';
import { InspectionCategory, CATEGORY_CONFIG } from '../../types/hse';
import { useKonteksLokasi } from '../konteksLokasi';
import { useDaftarProyek, usePindahProyek, useSesi } from '../auth/sesi';
import { useBuatLokasi, useUbahLokasi, useUnitHidran, useUnitApar, useKotakP3k } from '@/services/api/queries';

interface HseSidebarProps {
  activeCategoryFilter: InspectionCategory | 'ALL';
  onSelectCategoryFilter: (cat: InspectionCategory | 'ALL') => void;
  isDarkMode: boolean;
  onToggleTheme: (e?: React.MouseEvent) => void;
  currentView?: 'dashboard' | 'hydrant' | 'apar' | 'p3k' | 'patrol';
  onNavigateView?: (view: 'dashboard' | 'hydrant' | 'apar' | 'p3k' | 'patrol') => void;
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
  namaPengguna,
  onKeluar,
  keluarBerjalan = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const lokasi = useKonteksLokasi();
  const sesi = useSesi();
  const daftarProyek = useDaftarProyek();
  const pindahProyek = usePindahProyek();
  const [proyekTerbuka, setProyekTerbuka] = useState(false);
  const buatLokasi = useBuatLokasi();
  const ubahLokasi = useUbahLokasi();

  // Badge hitung per lokasi: unit/kotak terdaftar (patroli tak punya angka wajar).
  const unitHidran = useUnitHidran();
  const unitApar = useUnitApar();
  const kotakP3k = useKotakP3k();
  const hitungLokasi = (siteId: string) => ({
    hydrant: (unitHidran.data ?? []).filter((u) => u.siteId === siteId).length,
    apar: (unitApar.data ?? []).filter((u) => u.siteId === siteId).length,
    p3k: (kotakP3k.data ?? []).filter((b) => b.siteId === siteId).length,
  });

  // Seksi LOKASI: lokasi mana yang terbuka, tambah baris, dan sunting nama sebaris.
  const [lokasiTerbuka, setLokasiTerbuka] = useState<string | null>(null);
  const [tambahLokasi, setTambahLokasi] = useState(false);
  const [namaBaru, setNamaBaru] = useState('');
  const [suntingId, setSuntingId] = useState<string | null>(null);
  const [namaSunting, setNamaSunting] = useState('');

  const simpanLokasiBaru = () => {
    const nama = namaBaru.trim();
    if (!nama || buatLokasi.isPending) return;
    buatLokasi.mutate(
      { name: nama },
      {
        onSuccess: (row) => {
          lokasi.pilihLokasi(row.id);
          setLokasiTerbuka(row.id);
          setNamaBaru('');
          setTambahLokasi(false);
        },
      },
    );
  };

  const simpanNamaSunting = (id: string) => {
    const nama = namaSunting.trim();
    setSuntingId(null);
    if (!nama || ubahLokasi.isPending) return;
    ubahLokasi.mutate({ id, name: nama });
  };

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
        {/* Workspace Switcher / Pengalih Proyek */}
        <div className="p-2 border-b border-[var(--border)] flex items-center justify-between group">
          <div className="flex-1 min-w-0">
            <button
              type="button"
              onClick={() => setProyekTerbuka((v) => !v)}
              title="Ganti proyek"
              aria-label="Ganti proyek"
              className="w-full flex items-center gap-2 px-1 py-1 rounded-[4px] hover:bg-[var(--bg-hover)] cursor-pointer pressable-subtle"
            >
              <div className="w-7 h-7 rounded-[4px] bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 flex items-center justify-center text-sm font-bold flex-shrink-0">
                🛡️
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-[13px] font-semibold text-[var(--primary)] truncate leading-tight">
                  {lokasi.namaProyek}
                </div>
                <div className="text-[11px] text-[var(--muted)] truncate">
                  {lokasi.siteName}
                </div>
              </div>
              <ChevronDown
                size={14}
                className={`text-[var(--icon-secondary)] flex-shrink-0 transition-transform ${proyekTerbuka ? '' : '-rotate-90'}`}
              />
            </button>
            {proyekTerbuka && (
              <div className="mt-1 space-y-0.5">
                {(daftarProyek.data ?? []).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      if (p.id !== sesi.data?.perusahaanId) pindahProyek.mutate(p.id);
                      setProyekTerbuka(false);
                    }}
                    disabled={pindahProyek.isPending}
                    className={`w-full flex items-center gap-2 px-2 py-1 text-xs rounded-[4px] cursor-pointer pressable-subtle disabled:opacity-40 ${
                      p.id === sesi.data?.perusahaanId
                        ? 'bg-[var(--bg-hover)] font-semibold text-[var(--primary)]'
                        : 'text-[var(--secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--primary)]'
                    }`}
                  >
                    <span className="flex-1 text-left truncate">{p.nama}</span>
                    {p.id === sesi.data?.perusahaanId && (
                      <CheckCircle2 size={12} className="text-[#2383e2]" />
                    )}
                  </button>
                ))}
              </div>
            )}
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
        </div>

        {/* Lokasi: tambah + sunting nama sebaris (tanpa popup); tiap baris
            melipat untuk 4 kategori dan memindah lokasi aktif saat dipilih. */}
        <div className="px-2 pt-4 space-y-1">
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] flex items-center justify-between">
            <span>Lokasi</span>
            <button
              type="button"
              onClick={() => {
                setTambahLokasi(true);
                setNamaBaru('');
              }}
              title="Tambah lokasi"
              aria-label="Tambah lokasi"
              className="w-5 h-5 rounded-[3px] flex items-center justify-center text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--bg-hover)] cursor-pointer pressable"
            >
              <Plus size={13} />
            </button>
          </div>

          {lokasi.daftarLokasi.map((site) => {
            const aktif = site.id === lokasi.siteId;
            const terbuka = site.id === lokasiTerbuka;
            const sedangSunting = site.id === suntingId;

            return (
              <div key={site.id}>
                <div
                  className={`w-full flex items-center gap-2 px-2.5 py-1 text-xs rounded-[4px] cursor-pointer pressable-subtle group ${
                    aktif
                      ? 'bg-[var(--bg-hover)] font-semibold text-[var(--primary)]'
                      : 'text-[var(--secondary)] hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  {sedangSunting ? (
                    <input
                      autoFocus
                      value={namaSunting}
                      onChange={(e) => setNamaSunting(e.target.value)}
                      onBlur={() => simpanNamaSunting(site.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') simpanNamaSunting(site.id);
                        if (e.key === 'Escape') setSuntingId(null);
                      }}
                      aria-label="Nama lokasi"
                      className="flex-1 min-w-0 text-xs bg-[var(--bg-main)] border border-[var(--border)] rounded-[3px] px-1.5 py-0.5 text-[var(--primary)] focus:outline-none"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        lokasi.pilihLokasi(site.id);
                        setLokasiTerbuka(terbuka ? null : site.id);
                      }}
                      onDoubleClick={() => {
                        setSuntingId(site.id);
                        setNamaSunting(site.name);
                      }}
                      title="Klik untuk buka, dobel-klik untuk ganti nama"
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
                          lokasi.pilihLokasi(site.id);
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
                        {aktif && currentView === kat.view && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#2383e2]" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {tambahLokasi && (
            <input
              autoFocus
              value={namaBaru}
              onChange={(e) => setNamaBaru(e.target.value)}
              onBlur={() => {
                if (namaBaru.trim()) simpanLokasiBaru();
                else setTambahLokasi(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') simpanLokasiBaru();
                if (e.key === 'Escape') setTambahLokasi(false);
              }}
              placeholder="Nama lokasi baru…"
              aria-label="Nama lokasi baru"
              className="w-full text-xs bg-[var(--bg-main)] border border-[var(--border)] rounded-[4px] px-2.5 py-1 text-[var(--primary)] placeholder-[var(--muted)] focus:outline-none"
            />
          )}
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
