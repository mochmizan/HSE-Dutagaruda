/** Mutasi laporan dan temuan Safety Patrol. */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as k from './klien';
import { gagal, kunci } from './queries-dasar';

// ── Mutasi patroli ──

export function useBuatTemuanPatroli() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { laporan: k.MasukanLaporanPatroli; temuan: k.MasukanTemuan }) =>
      (async () => {
        const laporan = await k.buatLaporanPatroli(args.laporan);
        return k.buatTemuanPatroli(laporan.id, args.temuan);
      })(),
    onSettled: () => void qc.invalidateQueries({ queryKey: kunci.laporanPatroli }),
    onError: (err) => window.alert(gagal(err)),
  });
}

/** Unggah foto temuan patroli nyata: buat laporan lalu POST multipart foto. */
export function useUnggahFotoTemuanPatroli() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      siteId: string;
      patrolDate: string;
      file: File;
      description: string;
      locationNote?: string;
    }) =>
      (async () => {
        const laporan = await k.buatLaporanPatroli({
          siteId: args.siteId,
          patrolDate: args.patrolDate,
        });
        return k.unggahFotoTemuanPatroli(laporan.id, args.file, args.description, args.locationNote);
      })(),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: kunci.laporanPatroli });
      void qc.invalidateQueries({ queryKey: ['umpan'] });
    },
    onError: (err) => window.alert(gagal(err)),
  });
}

/** Optimistic: temuan hilang seketika, rollback saat gagal. */
export function useHapusTemuanPatroli() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fid: string) => k.hapusTemuanPatroli(fid),
    onMutate: async (fid) => {      await qc.cancelQueries({ queryKey: kunci.laporanPatroli });
      const sebelumnya = qc.getQueryData<k.ApiLaporanPatroli[]>(kunci.laporanPatroli);
      qc.setQueryData<k.ApiLaporanPatroli[]>(kunci.laporanPatroli, (lama) =>
        (lama ?? []).map((laporan) => ({
          ...laporan,
          findings: (laporan.findings ?? []).filter((f) => f.id !== fid),
        })),
      );
      return { sebelumnya };
    },
    onError: (_err, _fid, ctx) => {
      if (ctx?.sebelumnya) qc.setQueryData(kunci.laporanPatroli, ctx.sebelumnya);
      window.alert(gagal(_err));
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: kunci.laporanPatroli }),
  });
}
