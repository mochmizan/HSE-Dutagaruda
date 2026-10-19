/**
 * Konteks lokasi aktif — pengganti CURRENT_SITE dari mock.
 * Satu penyedia di App, halaman membaca lewat useKonteksLokasi().
 */

import React, { createContext, useContext, useMemo, useState } from 'react';
import { useLokasi, useZona, usePerusahaan } from '@/services/api/queries';
import { useDaftarProyek, useSesi } from '@/features/auth/sesi';

export interface LokasiRingkas {
  id: string;
  name: string;
}

export interface NilaiLokasi {
  siteId: string;
  siteName: string;
  clientName: string;
  address: string;
  zonaNamaList: string[];
  zonaIdKeNama: (zoneId: string) => string;
  zonaNamaKeId: (name: string) => string;
  /** Seluruh lokasi perusahaan (untuk seksi LOKASI sidebar). */
  daftarLokasi: LokasiRingkas[];
  /** Nama proyek pendek untuk header (“PT DUTAGARUDA”). */
  namaProyek: string;
  /** Pindah lokasi aktif; seluruh halaman memfilter data per siteId ini. */
  pilihLokasi: (siteId: string) => void;
}

const bawaan: NilaiLokasi = {
  siteId: '',
  siteName: 'Memuat lokasi…',
  clientName: '–',
  address: '–',
  zonaNamaList: [],
  zonaIdKeNama: () => '–',
  zonaNamaKeId: () => '',
  daftarLokasi: [],
  namaProyek: '–',
  pilihLokasi: () => {},
};

const KonteksLokasi = createContext<NilaiLokasi>(bawaan);

export const PenyediaLokasi: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const lokasi = useLokasi();
  const zona = useZona();
  const perusahaan = usePerusahaan();
  const sesi = useSesi();
  const daftarProyek = useDaftarProyek();
  const [pilihanId, setPilihanId] = useState('');

  const daftar = useMemo<LokasiRingkas[]>(
    () =>
      [...(lokasi.data ?? [])]
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .map((s) => ({ id: s.id, name: s.name })),
    [lokasi.data],
  );

  const nilai = useMemo<NilaiLokasi>(() => {
    const site =
      (lokasi.data ?? []).find((s) => s.id === pilihanId) ??
      [...(lokasi.data ?? [])].sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
    const zonaSite = (zona.data ?? []).filter((z) => site && z.siteId === site.id);
    // Nama proyek mengikuti organisasi aktif sesi, bukan baris pertama companies.
    const namaAktif =
      (daftarProyek.data ?? []).find((p) => p.id === sesi.data?.perusahaanId)?.nama ?? '';
    const namaPerusahaan = namaAktif || perusahaan.data?.name || '';
    return {
      siteId: site?.id ?? '',
      siteName: site?.name ?? 'Memuat lokasi…',
      clientName: namaPerusahaan || '–',
      address: site?.address ?? '–',
      zonaNamaList: zonaSite.map((z) => z.name),
      zonaIdKeNama: (zoneId) => (zona.data ?? []).find((z) => z.id === zoneId)?.name ?? '–',
      zonaNamaKeId: (name) => (zona.data ?? []).find((z) => z.name === name)?.id ?? '',
      daftarLokasi: daftar,
      namaProyek: namaPerusahaan || '–',
      pilihLokasi: setPilihanId,
    };
  }, [lokasi.data, zona.data, perusahaan.data, sesi.data?.perusahaanId, daftarProyek.data, pilihanId, daftar]);

  return <KonteksLokasi.Provider value={nilai}>{children}</KonteksLokasi.Provider>;
};

export function useKonteksLokasi(): NilaiLokasi {
  return useContext(KonteksLokasi);
}
