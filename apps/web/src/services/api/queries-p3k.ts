/** Mutasi kotak dan inspeksi P3K. */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as k from './klien';
import { gagal, kunci } from './queries-dasar';

// ── Mutasi P3K ──

export function useSimpanInspeksiP3k() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { boxId: string; month: string; inspectionDate?: string; paraf?: string }) =>
      k.buatInspeksiP3k(args),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: kunci.inspeksiP3k });
      void qc.invalidateQueries({ queryKey: ['umpan'] });
    },
    onError: (err) => window.alert(gagal(err)),
  });
}

/** Perbarui kepala inspeksi P3K (tanggal/paraf) tanpa membuat rekam baru. */
export function useUbahInspeksiP3k() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; body: { inspectionDate?: string; paraf?: string } }) =>
      k.ubahInspeksiP3k(args.id, args.body),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: kunci.inspeksiP3k });
      void qc.invalidateQueries({ queryKey: ['umpan'] });
    },
    onError: (err) => window.alert(gagal(err)),
  });
}

export function useHapusKotakP3k() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => k.hapusKotakP3k(id),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: kunci.kotakP3k });
      void qc.invalidateQueries({ queryKey: kunci.inspeksiP3k });
      void qc.invalidateQueries({ queryKey: ["umpan"] });
    },
    onError: (err) => window.alert(gagal(err)),
  });
}

export function useBuatKotakP3k() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { siteId: string; name: string }) => k.buatKotakP3k(args),
    onSettled: () => void qc.invalidateQueries({ queryKey: kunci.kotakP3k }),
    onError: (err) => window.alert(gagal(err)),
  });
}

/** Hapus inspeksi P3K bulan (bersama butir-butirnya). */
export function useHapusInspeksiP3k() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => k.hapusInspeksiP3k(id),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: kunci.inspeksiP3k });
      void qc.invalidateQueries({ queryKey: ['umpan'] });
    },
    onError: (err) => window.alert(gagal(err)),
  });
}

/** Optimistic: butir P3K langsung berubah di cache, rollback saat gagal. */
export function useUbahButirP3k() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      inspectionId: string;
      itemId: string;
      body: { actualQty?: number; status?: k.ApiStatusP3k };
    }) => k.ubahButirP3k(args.inspectionId, args.itemId, args.body),
    onMutate: async (args) => {
      await qc.cancelQueries({ queryKey: kunci.inspeksiP3k });
      const sebelumnya = qc.getQueryData<k.ApiInspeksiP3k[]>(kunci.inspeksiP3k);
      qc.setQueryData<k.ApiInspeksiP3k[]>(kunci.inspeksiP3k, (lama) =>
        (lama ?? []).map((insp) =>
          insp.id === args.inspectionId
            ? {
                ...insp,
                items: (insp.items ?? []).map((it) =>
                  it.id === args.itemId ? { ...it, ...args.body } : it,
                ),
              }
            : insp,
        ),
      );
      return { sebelumnya };
    },
    onError: (err, _args, ctx) => {
      if (ctx?.sebelumnya) qc.setQueryData(kunci.inspeksiP3k, ctx.sebelumnya);
      window.alert(gagal(err));
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: kunci.inspeksiP3k }),
  });
}
