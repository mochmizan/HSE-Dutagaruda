/** Query baca (lokasi, zona, unit, inspeksi, umpan) dan mutasi lokasi. */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as k from './klien';
import { gagal, kunci, type Period } from './queries-dasar';

export function useLokasi() {
  return useQuery({
    queryKey: kunci.lokasi,
    queryFn: () => k.ambilLokasi(),
  });
}

export function useBuatLokasi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { name: string }) => k.buatLokasi(args),
    onSettled: () => void qc.invalidateQueries({ queryKey: kunci.lokasi }),
    onError: (err) => window.alert(gagal(err)),
  });
}

export function useUbahLokasi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; name: string }) =>
      k.ubahLokasi(args.id, { name: args.name }),
    onSettled: () => void qc.invalidateQueries({ queryKey: kunci.lokasi }),
    onError: (err) => window.alert(gagal(err)),
  });
}

export function useHapusLokasi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => k.hapusLokasi(id),
    onSettled: () => void qc.invalidateQueries({ queryKey: kunci.lokasi }),
    onError: (err) => window.alert(gagal(err)),
  });
}

export function useZona() {
  return useQuery({
    queryKey: kunci.zona,
    queryFn: () => k.ambilZona(),
  });
}

export function usePerusahaan() {
  return useQuery({
    queryKey: kunci.perusahaan,
    queryFn: async () => {
      const daftar = await k.ambilPerusahaan();
      return daftar[0] ?? null;
    },
  });
}

export function useUnitHidran(cakupan: k.CakupanDaftar = {}) {
  return useQuery({
    queryKey: [...kunci.unitHidran, cakupan.siteId ?? null, cakupan.period ?? null],
    queryFn: () => k.ambilUnitHidran(cakupan),
  });
}

export function useInspeksiHidran(cakupan: k.CakupanDaftar = {}) {
  return useQuery({
    queryKey: [...kunci.inspeksiHidran, cakupan.siteId ?? null, cakupan.period ?? null],
    queryFn: () => k.ambilInspeksiHidran(cakupan),
  });
}

export function useUnitApar(cakupan: k.CakupanDaftar = {}) {
  return useQuery({
    queryKey: [...kunci.unitApar, cakupan.siteId ?? null, cakupan.period ?? null],
    queryFn: () => k.ambilUnitApar(cakupan),
  });
}

export function useInspeksiApar(cakupan: k.CakupanDaftar = {}) {
  return useQuery({
    queryKey: [...kunci.inspeksiApar, cakupan.siteId ?? null, cakupan.period ?? null],
    queryFn: () => k.ambilInspeksiApar(cakupan),
  });
}

export function useKotakP3k(cakupan: k.CakupanDaftar = {}) {
  return useQuery({
    queryKey: [...kunci.kotakP3k, cakupan.siteId ?? null, cakupan.period ?? null],
    queryFn: () => k.ambilKotakP3k(cakupan),
  });
}

export function useInspeksiP3k(cakupan: k.CakupanDaftar = {}) {
  return useQuery({
    queryKey: [...kunci.inspeksiP3k, cakupan.siteId ?? null, cakupan.period ?? null],
    queryFn: () => k.ambilInspeksiP3k(cakupan),
  });
}

export function useLaporanPatroli(cakupan: k.CakupanDaftar = {}) {
  return useQuery({
    queryKey: [...kunci.laporanPatroli, cakupan.siteId ?? null, cakupan.period ?? null],
    // Temuan sudah ikut di respons daftar (satu query server), jadi tidak ada
    // lagi satu request per laporan di sini.
    queryFn: () => k.ambilLaporanPatroli(cakupan),
  });
}

export function useUmpan(month: Period) {
  return useQuery({
    queryKey: kunci.umpan(month),
    queryFn: () => k.ambilUmpan(month),
  });
}
