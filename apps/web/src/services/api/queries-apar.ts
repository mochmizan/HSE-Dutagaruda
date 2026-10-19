/** Mutasi inspeksi dan unit APAR. */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as k from './klien';
import { gagal, hapusZonaBilaKosong, idZonaAtauBuat, kunci } from './queries-dasar';

// ── Mutasi APAR ──

export interface SimpanAparArgs extends k.MasukanInspeksiApar {
  id?: string;
}

export function useSimpanInspeksiApar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: SimpanAparArgs) =>
      id ? k.ubahInspeksiApar(id, body) : k.buatInspeksiApar(body),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: kunci.inspeksiApar });
      void qc.invalidateQueries({ queryKey: ['umpan'] });
    },
    onError: (err) => window.alert(gagal(err)),
  });
}

/** Batalkan terbit APAR: satu medan (`approval_status` → DRAFT), lalu baris di
 *  cache ditulis dari balasan server. Modal membaca mode baca-saja dari rekam,
 *  bukan dari dugaan lokal. */
export function useBatalkanTerbitApar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => k.ubahInspeksiApar(id, { approvalStatus: 'DRAFT' }),
    onSuccess: (row) => {
      qc.setQueryData<k.ApiInspeksiApar[]>(kunci.inspeksiApar, (lama) =>
        lama?.map((i) => (i.id === row.id ? row : i)),
      );
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: kunci.inspeksiApar });
      void qc.invalidateQueries({ queryKey: ['umpan'] });
    },
    onError: (err) => window.alert(gagal(err)),
  });
}

/** Hapus inspeksi APAR bulan: foto dokumentasi dibersihkan dulu (API menolak
 * dengan 409 bila foto masih lekat), lalu rekam inspeksinya. */
export function useHapusInspeksiApar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const foto = await k.ambilFotoInspeksi('apar', id);
      await Promise.allSettled(foto.items.map((f) => k.hapusFoto(f.id)));
      return k.hapusInspeksiApar(id);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: kunci.inspeksiApar });
      void qc.invalidateQueries({ queryKey: ['foto-inspeksi'] });
      void qc.invalidateQueries({ queryKey: ['umpan'] });
    },
    onError: (err) => window.alert(gagal(err)),
  });
}

/** Hapus unit APAR sebaris datanya: tiap rekam inspeksinya dibersihkan
 *  (foto dulu, lalu rekam — cegah 409), lalu unitnya. Bila zona unit ini
 *  kosong (tak ada unit hidran/APAR tersisa), zona ikut dihapus. */
export function useHapusUnitApar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (unitId: string) => {
      const semua = qc.getQueryData<k.ApiInspeksiApar[]>(kunci.inspeksiApar) ?? [];
      for (const insp of semua.filter((i) => i.unitId === unitId)) {
        const foto = await k.ambilFotoInspeksi('apar', insp.id);
        await Promise.allSettled(foto.items.map((f) => k.hapusFoto(f.id)));
        await k.hapusInspeksiApar(insp.id);
      }
      const unit = (qc.getQueryData<k.ApiAparUnit[]>(kunci.unitApar) ?? []).find(
        (u) => u.id === unitId,
      );
      const hasil = await k.hapusUnitApar(unitId);
      await hapusZonaBilaKosong(qc, unit?.zoneId, unitId);
      return hasil;
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: kunci.unitApar });
      void qc.invalidateQueries({ queryKey: kunci.inspeksiApar });
      void qc.invalidateQueries({ queryKey: kunci.zona });
      void qc.invalidateQueries({ queryKey: ['foto-inspeksi'] });
      void qc.invalidateQueries({ queryKey: ['umpan'] });
    },
    onError: (err) => window.alert(gagal(err)),
  });
}

export function useBuatUnitApar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      siteId: string;
      zoneName: string;
      unit: Omit<k.MasukanUnitApar, 'siteId' | 'zoneId'>;
    }) =>
      (async () => {
        const zoneId = await idZonaAtauBuat(args.siteId, args.zoneName);
        return k.buatUnitApar({ ...args.unit, siteId: args.siteId, zoneId });
      })(),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: kunci.unitApar });
      void qc.invalidateQueries({ queryKey: kunci.zona });
    },
    onError: (err) => window.alert(gagal(err)),
  });
}

export function useUbahUnitApar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; body: Partial<k.MasukanUnitApar> }) =>
      k.ubahUnitApar(args.id, args.body),
    onSettled: () => void qc.invalidateQueries({ queryKey: kunci.unitApar }),
    onError: (err) => window.alert(gagal(err)),
  });
}
