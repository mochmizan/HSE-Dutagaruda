import type { Dispatch, SetStateAction } from 'react';
import type { NilaiLokasi } from '../konteksLokasi';
import type { Proyek, useBuatProyek, useHapusProyek, usePindahProyek, useUbahProyek } from '../auth/sesi';
import type { useBuatLokasi, useHapusLokasi, useUbahLokasi } from '@/services/api/queries';
import type { MenuAksi } from './sidebarTypes';

/** State + setter seksi PROYEK. */
export interface KeadaanProyek {
  terbuka: boolean;
  setTerbuka: Dispatch<SetStateAction<boolean>>;
  tambah: boolean;
  setTambah: Dispatch<SetStateAction<boolean>>;
  namaBaru: string;
  setNamaBaru: Dispatch<SetStateAction<string>>;
  suntingId: string | null;
  setSuntingId: Dispatch<SetStateAction<string | null>>;
  namaSunting: string;
  setNamaSunting: Dispatch<SetStateAction<string>>;
}

/** State + setter seksi LOKASI. */
export interface KeadaanLokasi {
  terbukaId: string | null;
  setTerbukaId: Dispatch<SetStateAction<string | null>>;
  tambah: boolean;
  setTambah: Dispatch<SetStateAction<boolean>>;
  namaBaru: string;
  setNamaBaru: Dispatch<SetStateAction<string>>;
  suntingId: string | null;
  setSuntingId: Dispatch<SetStateAction<string | null>>;
  namaSunting: string;
  setNamaSunting: Dispatch<SetStateAction<string>>;
}

/**
 * Dependensi aksi bilah samping. Seluruh mutasi, state, dan setter diserahkan
 * dari `HseSidebar` supaya hook tetap tinggal di komponen halaman — urutan hook
 * tidak boleh berpindah ke modul ini.
 */
export interface AksiSidebarDeps {
  menu: MenuAksi | null;
  setMenu: Dispatch<SetStateAction<MenuAksi | null>>;
  lokasi: NilaiLokasi;
  daftarProyek: Proyek[];
  perusahaanId: string | null | undefined;
  buatProyek: ReturnType<typeof useBuatProyek>;
  ubahProyek: ReturnType<typeof useUbahProyek>;
  hapusProyek: ReturnType<typeof useHapusProyek>;
  pindahProyek: ReturnType<typeof usePindahProyek>;
  buatLokasi: ReturnType<typeof useBuatLokasi>;
  ubahLokasi: ReturnType<typeof useUbahLokasi>;
  hapusLokasi: ReturnType<typeof useHapusLokasi>;
  proyek: KeadaanProyek;
  lokasiSeksi: KeadaanLokasi;
}

/**
 * Aksi tulis bilah samping: simpan proyek/lokasi, mulai sunting dari menu
 * konteks, dan jalankan hapus. Fungsi biasa — tidak memanggil hook sendiri.
 */
export function buatAksiSidebar(deps: AksiSidebarDeps) {
  const {
    menu,
    setMenu,
    lokasi,
    daftarProyek,
    perusahaanId,
    buatProyek,
    ubahProyek,
    hapusProyek,
    pindahProyek,
    buatLokasi,
    ubahLokasi,
    hapusLokasi,
    proyek,
    lokasiSeksi,
  } = deps;

  const simpanProyekBaru = () => {
    const nama = proyek.namaBaru.trim();
    if (!nama || buatProyek.isPending) return;
    buatProyek.mutate(nama, {
      onSuccess: () => {
        proyek.setNamaBaru('');
        proyek.setTambah(false);
        proyek.setTerbuka(false);
      },
    });
  };

  const simpanNamaProyek = (id: string) => {
    const nama = proyek.namaSunting.trim();
    proyek.setSuntingId(null);
    if (!nama || ubahProyek.isPending) return;
    ubahProyek.mutate({ id, nama });
  };

  const mulaiSunting = () => {
    if (!menu) return;
    if (menu.jenis === 'lokasi') {
      lokasiSeksi.setSuntingId(menu.id);
      lokasiSeksi.setNamaSunting(menu.nama);
    } else {
      proyek.setSuntingId(menu.id);
      proyek.setNamaSunting(menu.nama);
    }
    setMenu(null);
  };

  // Dideklarasikan sebelum `jalankanHapus` karena handler itu menutup lokasi
  // yang baru dihapus.
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
          if (target.id === lokasiSeksi.terbukaId) lokasiSeksi.setTerbukaId(null);
        },
      });
      return;
    }
    if (daftarProyek.length <= 1) {
      window.alert('Minimal satu proyek harus tersisa.');
      return;
    }
    if (target.id === perusahaanId) {
      const ganti = daftarProyek.find((p) => p.id !== target.id);
      if (!ganti) return;
      pindahProyek.mutate(ganti.id, { onSuccess: () => hapusProyek.mutate(target.id) });
    } else {
      hapusProyek.mutate(target.id);
    }
  };

  const simpanLokasiBaru = () => {
    const nama = lokasiSeksi.namaBaru.trim();
    if (!nama || buatLokasi.isPending) return;
    buatLokasi.mutate(
      { name: nama },
      {
        onSuccess: (row) => {
          lokasi.pilihLokasi(row.id);
          lokasiSeksi.setTerbukaId(row.id);
          lokasiSeksi.setNamaBaru('');
          lokasiSeksi.setTambah(false);
        },
      },
    );
  };

  const simpanNamaSunting = (id: string) => {
    const nama = lokasiSeksi.namaSunting.trim();
    lokasiSeksi.setSuntingId(null);
    if (!nama || ubahLokasi.isPending) return;
    ubahLokasi.mutate({ id, name: nama });
  };

  return {
    simpanProyekBaru,
    simpanNamaProyek,
    mulaiSunting,
    jalankanHapus,
    simpanLokasiBaru,
    simpanNamaSunting,
  };
}
