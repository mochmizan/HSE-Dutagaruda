import React, { useEffect, useState } from 'react';
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
  Pencil,
  Trash2,
} from 'lucide-react';
import { InspectionCategory, CATEGORY_CONFIG } from '../../types/hse';
import { useKonteksLokasi } from '../konteksLokasi';
import { useBuatProyek, useDaftarProyek, useHapusProyek, usePindahProyek, useSesi, useUbahProyek } from '../auth/sesi';
import { useBuatLokasi, useHapusLokasi, useUbahLokasi, useUnitHidran, useUnitApar, useKotakP3k } from '@/services/api/queries';

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
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
}

/** Tombol perluas bilah samping untuk baris judul tiap tampilan saat mode ciut. */
export const TombolPerluas: React.FC<{ onKlik: () => void }> = ({ onKlik }) => (
  <button
    type="button"
    onClick={onKlik}
    title="Tampilkan bilah samping"
    aria-label="Tampilkan bilah samping"
    className="w-6 h-6 rounded-[3px] flex items-center justify-center text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--bg-hover)] cursor-pointer pressable flex-shrink-0"
  >
    <ChevronsRight size={15} />
  </button>
);

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
  isCollapsed,
  onToggleCollapsed,
}) => {
  const lokasi = useKonteksLokasi();
  const sesi = useSesi();
  const daftarProyek = useDaftarProyek();
  const pindahProyek = usePindahProyek();
  const [proyekTerbuka, setProyekTerbuka] = useState(false);
  const buatLokasi = useBuatLokasi();
  const ubahLokasi = useUbahLokasi();
  const buatProyek = useBuatProyek();
  const ubahProyek = useUbahProyek();
  const hapusProyek = useHapusProyek();
  const hapusLokasi = useHapusLokasi();

  // Badge hitung per lokasi: unit/kotak terdaftar (patroli tak punya angka wajar).
  const unitHidran = useUnitHidran();
  const unitApar = useUnitApar();
  const kotakP3k = useKotakP3k();
  const hitungLokasi = (siteId: string) => ({
    hydrant: (unitHidran.data ?? []).filter((u) => u.siteId === siteId).length,
    apar: (unitApar.data ?? []).filter((u) => u.siteId === siteId).length,
    p3k: (kotakP3k.data ?? []).filter((b) => b.siteId === siteId).length,
  });

  // Menu konteks klik-kanan untuk hapus proyek / lokasi.
  const [menu, setMenu] = useState<{
    x: number;
    y: number;
    jenis: 'proyek' | 'lokasi';
    id: string;
    nama: string;
  } | null>(null);

  useEffect(() => {
    if (!menu) return;
    const tutup = (e: PointerEvent) => {
      if ((e.target as HTMLElement | null)?.closest?.('[data-menu-aksi]')) return;
      setMenu(null);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenu(null);
    };
    window.addEventListener('pointerdown', tutup);
    window.addEventListener('keydown', esc);
    return () => {
      window.removeEventListener('pointerdown', tutup);
      window.removeEventListener('keydown', esc);
    };
  }, [menu]);

  // Seksi PROYEK: tambah baris dan sunting nama sebaris, pola sama seperti lokasi.
  const [tambahProyek, setTambahProyek] = useState(false);
  const [namaProyekBaru, setNamaProyekBaru] = useState('');
  const [suntingProyekId, setSuntingProyekId] = useState<string | null>(null);
  const [namaProyekSunting, setNamaProyekSunting] = useState('');

  const simpanProyekBaru = () => {
    const nama = namaProyekBaru.trim();
    if (!nama || buatProyek.isPending) return;
    buatProyek.mutate(nama, {
      onSuccess: () => {
        setNamaProyekBaru('');
        setTambahProyek(false);
        setProyekTerbuka(false);
      },
    });
  };

  const simpanNamaProyek = (id: string) => {
    const nama = namaProyekSunting.trim();
    setSuntingProyekId(null);
    if (!nama || ubahProyek.isPending) return;
    ubahProyek.mutate({ id, nama });
  };

  const mulaiSunting = () => {
    if (!menu) return;
    if (menu.jenis === 'lokasi') {
      setSuntingId(menu.id);
      setNamaSunting(menu.nama);
    } else {
      setSuntingProyekId(menu.id);
      setNamaProyekSunting(menu.nama);
    }
    setMenu(null);
  };

  const jalankanHapus = () => {
    if (!menu) return;
    const target = menu;
    setMenu(null);
    if (target.jenis === 'lokasi') {
      hapusLokasi.mutate(target.id, {
        onSuccess: () => {
          if (target.id === lokasi.siteId) {
            const sisa = lokasi.daftarLokasi.filter((s) => s.id !== target.id);
            if (sisa[0]) lokasi.pilihLokasi(sisa[0].id);
          }
          if (target.id === lokasiTerbuka) setLokasiTerbuka(null);
        },
      });
      return;
    }
    const daftar = daftarProyek.data ?? [];
    if (daftar.length <= 1) {
      window.alert('Minimal satu proyek harus tersisa.');
      return;
    }
    if (target.id === sesi.data?.perusahaanId) {
      const ganti = daftar.find((p) => p.id !== target.id);
      if (!ganti) return;
      pindahProyek.mutate(ganti.id, { onSuccess: () => hapusProyek.mutate(target.id) });
    } else {
      hapusProyek.mutate(target.id);
    }
  };

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
    return null;
  }

  return (
    <aside className="w-64 h-screen border-r border-[var(--border)] bg-[var(--bg-sidebar)] flex flex-col justify-between select-none flex-shrink-0 z-30 transition-[width] duration-200 ease-[var(--ease-out)] font-sans">
      {/* Header & Site Selector */}
      <div className="flex flex-col">
        {/* Workspace Switcher / Pengalih Proyek */}
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
              </div>
              <ChevronDown
                size={14}
                className={`text-[var(--icon-secondary)] flex-shrink-0 transition-transform ${proyekTerbuka ? '' : '-rotate-90'}`}
              />
            </button>
            {proyekTerbuka && (
              <div className="mt-1 -ml-7 w-[calc(100%+1.75rem)] space-y-0.5">
                <div className="flex items-center justify-between px-2 pt-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                    Proyek
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setTambahProyek(true);
                      setNamaProyekBaru('');
                    }}
                    title="Tambah proyek"
                    aria-label="Tambah proyek"
                    className="w-5 h-5 rounded-[3px] flex items-center justify-center text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--bg-hover)] cursor-pointer pressable"
                  >
                    <Plus size={13} />
                  </button>
                </div>
                {(daftarProyek.data ?? []).map((p) =>
                  suntingProyekId === p.id ? (
                    <input
                      key={p.id}
                      autoFocus
                      value={namaProyekSunting}
                      onChange={(e) => setNamaProyekSunting(e.target.value)}
                      onBlur={() => simpanNamaProyek(p.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') simpanNamaProyek(p.id);
                        if (e.key === 'Escape') setSuntingProyekId(null);
                      }}
                      aria-label="Nama proyek"
                      className="w-full text-xs bg-[var(--bg-main)] border border-[var(--border)] rounded-[3px] px-2 py-1 text-[var(--primary)] focus:outline-none"
                    />
                  ) : (
                    <div
                      key={p.id}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setMenu({ x: e.clientX, y: e.clientY, jenis: 'proyek', id: p.id, nama: p.nama });
                      }}
                      className={`w-full flex items-center gap-2 px-2 py-1 text-xs rounded-[4px] cursor-pointer pressable-subtle ${
                        p.id === sesi.data?.perusahaanId
                          ? 'bg-[var(--bg-hover)] font-semibold text-[var(--primary)]'
                          : 'text-[var(--secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--primary)]'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (p.id !== sesi.data?.perusahaanId) pindahProyek.mutate(p.id);
                          setProyekTerbuka(false);
                        }}
                        onDoubleClick={() => {
                          setSuntingProyekId(p.id);
                          setNamaProyekSunting(p.nama);
                        }}
                        disabled={pindahProyek.isPending}
                        title="Klik untuk pindah, dobel-klik atau klik-kanan untuk ganti nama"
                        className="flex-1 min-w-0 flex items-center gap-2 cursor-pointer disabled:opacity-40"
                      >
                        <span className="flex-1 text-left truncate">{p.nama}</span>
                        {p.id === sesi.data?.perusahaanId && (
                          <CheckCircle2 size={12} className="text-[#2383e2] flex-shrink-0" />
                        )}
                      </button>
                    </div>
                  ),
                )}
                {tambahProyek && (
                  <input
                    autoFocus
                    value={namaProyekBaru}
                    onChange={(e) => setNamaProyekBaru(e.target.value)}
                    onBlur={() => {
                      if (namaProyekBaru.trim()) simpanProyekBaru();
                      else setTambahProyek(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') simpanProyekBaru();
                      if (e.key === 'Escape') setTambahProyek(false);
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

        {/* Navigation Sections */}
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
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setMenu({ x: e.clientX, y: e.clientY, jenis: 'lokasi', id: site.id, nama: site.name });
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

      {menu && (
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
            onClick={mulaiSunting}
            className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-[4px] text-[var(--secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--primary)] cursor-pointer pressable"
          >
            <Pencil size={13} />
            <span>Ganti nama</span>
          </button>
          <button
            type="button"
            onClick={jalankanHapus}
            className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-[4px] text-red-600 dark:text-red-400 hover:bg-red-500/10 cursor-pointer pressable"
          >
            <Trash2 size={13} />
            <span>Hapus {menu.jenis === 'proyek' ? 'proyek' : 'lokasi'}</span>
          </button>
        </div>
      )}
    </aside>
  );
};
