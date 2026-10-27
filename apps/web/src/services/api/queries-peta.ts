/** Peta proyek (denah terunggah): daftar, unggah, pilih, ubah nama, dan hapus. */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as k from './klien';
import { gagal } from './queries-dasar';

/** Prefiks kunci seluruh data peta; mutasi menyegarkan prefiks ini. */
export const kunciPeta = ['peta'] as const;

/** Kunci daftar peta proyek aktif. */
export const kunciDaftarPeta = [...kunciPeta, 'daftar'] as const;

/** Daftar peta proyek, sudah berurutan dari server (`urutan`). */
export function usePetaProyek() {
  return useQuery({
    queryKey: kunciDaftarPeta,
    queryFn: async () => {
      const res = await k.ambilPetaProyek();
      return res.items;
    },
    staleTime: 30_000,
  });
}

/** Unggah satu denah; nama opsional (server memakai nama berkas bila kosong). */
export function useUnggahPeta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { file: File; nama?: string }) => k.unggahPeta(args.file, args.nama),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: kunciPeta });
    },
    onError: (err) => window.alert(gagal(err)),
  });
}

/** Tandai satu peta sebagai denah terpilih (server mencabut pilihan sebelumnya). */
export function usePilihPeta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => k.pilihPeta(id),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: kunciPeta });
    },
    onError: (err) => window.alert(gagal(err)),
  });
}

export function useUbahNamaPeta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; nama: string }) => k.ubahNamaPeta(args.id, args.nama),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: kunciPeta });
    },
    onError: (err) => window.alert(gagal(err)),
  });
}

export function useHapusPeta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => k.hapusPeta(id),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: kunciPeta });
    },
    onError: (err) => window.alert(gagal(err)),
  });
}
