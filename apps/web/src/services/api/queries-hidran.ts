/** Mutasi inspeksi dan unit Hydrant. */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as k from './klien';
import { gagal, hapusZonaBilaKosong, idZonaAtauBuat, kunci } from './queries-dasar';

// ── Mutasi hidran ──

export interface SimpanHidranArgs extends k.MasukanInspeksiHidran {
  /** ID inspeksi lama bila sudah ada untuk unit+bulan ini. */
  id?: string;
}

export function useSimpanInspeksiHidran() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: SimpanHidranArgs) =>
      id ? k.ubahInspeksiHidran(id, body) : k.buatInspeksiHidran(body),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: kunci.inspeksiHidran });
      void qc.invalidateQueries({ queryKey: ['umpan'] });
    },
    onError: (err) => window.alert(gagal(err)),
  });
}

/** Batalkan terbit rekam yang terbit. Satu medan saja (`approval_status` →
 *  `DRAFT`) supaya komponen/notes dari cache lama tak menimpa perubahan orang
 *  lain, dan baris di cache ditulis dari balasan server. Modal membuka form dari
 *  rekam itu, bukan dari dugaan lokal, jadi refetch latar tak bisa membuka
 *  rekam yang masih terbit. */
export function useBatalkanTerbitHidran() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => k.ubahInspeksiHidran(id, { approvalStatus: 'DRAFT' }),
    onSuccess: (row) => {
      qc.setQueryData<k.ApiInspeksiHidran[]>(kunci.inspeksiHidran, (lama) =>
        lama?.map((i) => (i.id === row.id ? row : i)),
      );
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: kunci.inspeksiHidran });
      void qc.invalidateQueries({ queryKey: ['umpan'] });
    },
    onError: (err) => window.alert(gagal(err)),
  });
}

/** Hapus inspeksi hidran bulan: foto anak dibersihkan dulu (API menolak dengan
 * 409 bila foto masih lekat), lalu rekam inspeksinya. */
export function useHapusInspeksiHidran() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const foto = await k.ambilFotoInspeksi('hydrant', id);
      await Promise.allSettled(foto.items.map((f) => k.hapusFoto(f.id)));
      return k.hapusInspeksiHidran(id);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: kunci.inspeksiHidran });
      void qc.invalidateQueries({ queryKey: ['foto-inspeksi'] });
      void qc.invalidateQueries({ queryKey: ['umpan'] });
    },
    onError: (err) => window.alert(gagal(err)),
  });
}

/** Hapus unit hidran sebaris datanya: tiap rekam inspeksinya dibersihkan
 *  (foto dulu, lalu rekam — cegah 409), lalu unitnya. Bila zona unit ini
 *  kosong (tak ada unit hidran/APAR tersisa), zona ikut dihapus. */
export function useHapusUnitHidran() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (unitId: string) => {
      const semua = qc.getQueryData<k.ApiInspeksiHidran[]>(kunci.inspeksiHidran) ?? [];
      for (const insp of semua.filter((i) => i.unitId === unitId)) {
        const foto = await k.ambilFotoInspeksi('hydrant', insp.id);
        await Promise.allSettled(foto.items.map((f) => k.hapusFoto(f.id)));
        await k.hapusInspeksiHidran(insp.id);
      }
      const unit = (qc.getQueryData<k.ApiHydrantUnit[]>(kunci.unitHidran) ?? []).find(
        (u) => u.id === unitId,
      );
      const hasil = await k.hapusUnitHidran(unitId);
      await hapusZonaBilaKosong(qc, unit?.zoneId, unitId);
      return hasil;
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: kunci.unitHidran });
      void qc.invalidateQueries({ queryKey: kunci.inspeksiHidran });
      void qc.invalidateQueries({ queryKey: kunci.zona });
      void qc.invalidateQueries({ queryKey: ['foto-inspeksi'] });
      void qc.invalidateQueries({ queryKey: ['umpan'] });
    },
    onError: (err) => window.alert(gagal(err)),
  });
}

export function useBuatUnitHidran() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { siteId: string; zoneName: string; kode: string }) =>
      (async () => {
        const zoneId = await idZonaAtauBuat(args.siteId, args.zoneName);
        return k.buatUnitHidran({ siteId: args.siteId, zoneId, kode: args.kode });
      })(),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: kunci.unitHidran });
      void qc.invalidateQueries({ queryKey: kunci.zona });
    },
    onError: (err) => window.alert(gagal(err)),
  });
}

export function useUbahUnitHidran() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; body: Partial<k.MasukanUnitHidran> }) =>
      k.ubahUnitHidran(args.id, args.body),
    onSettled: () => void qc.invalidateQueries({ queryKey: kunci.unitHidran }),
    onError: (err) => window.alert(gagal(err)),
  });
}
