/**
 * Konteks lokasi aktif — pengganti CURRENT_SITE dari mock.
 * Satu penyedia di App, halaman membaca lewat useKonteksLokasi().
 */

import React, { createContext, useContext, useMemo } from 'react';
import { useLokasi, useZona, usePerusahaan } from '@/services/api/queries';

export interface NilaiLokasi {
  siteId: string;
  siteName: string;
  clientName: string;
  address: string;
  zonaNamaList: string[];
  zonaIdKeNama: (zoneId: string) => string;
  zonaNamaKeId: (name: string) => string;
}

const bawaan: NilaiLokasi = {
  siteId: '',
  siteName: 'Memuat lokasi…',
  clientName: '–',
  address: '–',
  zonaNamaList: [],
  zonaIdKeNama: () => '–',
  zonaNamaKeId: () => '',
};

const KonteksLokasi = createContext<NilaiLokasi>(bawaan);

export const PenyediaLokasi: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const lokasi = useLokasi();
  const zona = useZona();
  const perusahaan = usePerusahaan();

  const nilai = useMemo<NilaiLokasi>(() => {
    const site = [...(lokasi.data ?? [])].sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
    const zonaSite = (zona.data ?? []).filter((z) => site && z.siteId === site.id);
    return {
      siteId: site?.id ?? '',
      siteName: site?.name ?? 'Memuat lokasi…',
      clientName: perusahaan.data?.name ?? '–',
      address: site?.address ?? '–',
      zonaNamaList: zonaSite.map((z) => z.name),
      zonaIdKeNama: (zoneId) => (zona.data ?? []).find((z) => z.id === zoneId)?.name ?? '–',
      zonaNamaKeId: (name) => (zona.data ?? []).find((z) => z.name === name)?.id ?? '',
    };
  }, [lokasi.data, zona.data, perusahaan.data]);

  return <KonteksLokasi.Provider value={nilai}>{children}</KonteksLokasi.Provider>;
};

export function useKonteksLokasi(): NilaiLokasi {
  return useContext(KonteksLokasi);
}
