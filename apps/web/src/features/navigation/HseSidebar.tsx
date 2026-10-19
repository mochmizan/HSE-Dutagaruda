import React, { useEffect, useState } from 'react';
import { InspectionCategory } from '../../types/hse';
import { useKonteksLokasi } from '../konteksLokasi';
import { useBuatProyek, useDaftarProyek, useHapusProyek, usePindahProyek, useSesi, useUbahProyek } from '../auth/sesi';
import { useBuatLokasi, useHapusLokasi, useUbahLokasi, useUnitHidran, useUnitApar, useKotakP3k } from '@/services/api/queries';
import { buatAksiSidebar } from './aksiSidebar';
import { MenuKonteks } from './MenuKonteks';
import { SidebarFilter } from './SidebarFilter';
import { SidebarLokasi } from './SidebarLokasi';
import { SidebarNavigasi } from './SidebarNavigasi';
import { SidebarPengguna } from './SidebarPengguna';
import { SidebarProyek } from './SidebarProyek';
import { TombolPerluas } from './TombolPerluas';
import type { MenuAksi, ViewHalaman } from './sidebarTypes';

export { TombolPerluas };

interface HseSidebarProps {
  activeCategoryFilter: InspectionCategory | 'ALL';
  onSelectCategoryFilter: (cat: InspectionCategory | 'ALL') => void;
  isDarkMode: boolean;
  onToggleTheme: (e?: React.MouseEvent) => void;
  currentView?: ViewHalaman;
  onNavigateView?: (view: ViewHalaman) => void;
  namaPengguna: string;
  onKeluar: () => void;
  keluarBerjalan?: boolean;
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
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
  const [menu, setMenu] = useState<MenuAksi | null>(null);

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

  // Seksi LOKASI: lokasi mana yang terbuka, tambah baris, dan sunting nama sebaris.
  const [lokasiTerbuka, setLokasiTerbuka] = useState<string | null>(null);
  const [tambahLokasi, setTambahLokasi] = useState(false);
  const [namaBaru, setNamaBaru] = useState('');
  const [suntingId, setSuntingId] = useState<string | null>(null);
  const [namaSunting, setNamaSunting] = useState('');

  const proyek = {
    terbuka: proyekTerbuka,
    setTerbuka: setProyekTerbuka,
    tambah: tambahProyek,
    setTambah: setTambahProyek,
    namaBaru: namaProyekBaru,
    setNamaBaru: setNamaProyekBaru,
    suntingId: suntingProyekId,
    setSuntingId: setSuntingProyekId,
    namaSunting: namaProyekSunting,
    setNamaSunting: setNamaProyekSunting,
  };

  const lokasiSeksi = {
    terbukaId: lokasiTerbuka,
    setTerbukaId: setLokasiTerbuka,
    tambah: tambahLokasi,
    setTambah: setTambahLokasi,
    namaBaru,
    setNamaBaru,
    suntingId,
    setSuntingId,
    namaSunting,
    setNamaSunting,
  };

  const {
    simpanProyekBaru,
    simpanNamaProyek,
    mulaiSunting,
    jalankanHapus,
    simpanLokasiBaru,
    simpanNamaSunting,
  } = buatAksiSidebar({
    menu,
    setMenu,
    lokasi,
    daftarProyek: daftarProyek.data ?? [],
    perusahaanId: sesi.data?.perusahaanId,
    buatProyek,
    ubahProyek,
    hapusProyek,
    pindahProyek,
    buatLokasi,
    ubahLokasi,
    hapusLokasi,
    proyek,
    lokasiSeksi,
  });

  if (isCollapsed) {
    return null;
  }

  return (
    <aside className="w-64 h-screen border-r border-[var(--border)] bg-[var(--bg-sidebar)] flex flex-col justify-between select-none flex-shrink-0 z-30 transition-[width] duration-200 ease-[var(--ease-out)] font-sans">
      {/* Header & Site Selector */}
      <div className="flex flex-col">
        {/* Workspace Switcher / Pengalih Proyek */}
        <SidebarProyek
          namaProyek={lokasi.namaProyek}
          onToggleCollapsed={onToggleCollapsed}
          keadaan={proyek}
          daftar={daftarProyek.data ?? []}
          perusahaanId={sesi.data?.perusahaanId ?? null}
          pindahBerjalan={pindahProyek.isPending}
          onPindah={(id) => pindahProyek.mutate(id)}
          onBukaMenu={setMenu}
          onSimpanSunting={simpanNamaProyek}
          onSimpanBaru={simpanProyekBaru}
        />

        {/* Navigation Sections */}
        <SidebarNavigasi currentView={currentView} onNavigateView={onNavigateView} />

        {/* Lokasi: tambah + sunting nama sebaris (tanpa popup); tiap baris
            melipat untuk 4 kategori dan memindah lokasi aktif saat dipilih. */}
        <SidebarLokasi
          daftar={lokasi.daftarLokasi}
          siteId={lokasi.siteId}
          onPilih={lokasi.pilihLokasi}
          keadaan={lokasiSeksi}
          currentView={currentView}
          onNavigateView={onNavigateView}
          hitungLokasi={hitungLokasi}
          onBukaMenu={setMenu}
          onSimpanSunting={simpanNamaSunting}
          onSimpanBaru={simpanLokasiBaru}
        />

        {/* Filter Kategori */}
        <SidebarFilter
          activeCategoryFilter={activeCategoryFilter}
          onSelectCategoryFilter={onSelectCategoryFilter}
        />
      </div>

      {/* Footer & User Profile & Theme Toggle */}
      <SidebarPengguna
        namaPengguna={namaPengguna}
        isDarkMode={isDarkMode}
        onToggleTheme={onToggleTheme}
        onKeluar={onKeluar}
        keluarBerjalan={keluarBerjalan}
      />

      {menu && <MenuKonteks menu={menu} onSunting={mulaiSunting} onHapus={jalankanHapus} />}
    </aside>
  );
};
