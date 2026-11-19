/** Foto inspeksi: unggah, hapus, dan daftar per inspeksi. */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as k from './klien';
import { livePhotoUrl } from './liveClient';
import { gagal } from './queries-dasar';

// ── Mutasi foto inspeksi ──

/** Foto terpasang pada satu inspeksi (dilihat via GET /api/photos/:id presigned). */
export interface FotoTampil {
  id: string;
  url: string;
  caption: string;
  /** `true` = catatan hasil temuan (Section B); `false` = bukti inspeksi. */
  temuan: boolean;
}

export function useUnggahFoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      kind: 'hydrant' | 'apar';
      inspectionId: string;
      file: File;
      caption?: string;
      temuan?: boolean;
    }) => k.unggahFoto(args.kind, args.inspectionId, args.file, args.caption, args.temuan),
    onSuccess: (_foto, args) => invalidateFoto(qc, args.inspectionId),
    onError: (err) => window.alert(gagal(err)),
  });
}

export function useUbahCaptionFoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; caption: string; inspectionId?: string }) =>
      k.ubahCaptionFoto(args.id, args.caption),
    onSuccess: (_res, args) => invalidateFoto(qc, args.inspectionId),
    onError: (err) => window.alert(gagal(err)),
  });
}

export function useHapusFoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; inspectionId?: string }) => k.hapusFoto(args.id),
    onSuccess: (_res, args) => invalidateFoto(qc, args.inspectionId),
    onError: (err) => window.alert(gagal(err)),
  });
}

/** Daftar foto satu inspeksi. `temuan` membedakan catatan hasil temuan dari
 *  bukti inspeksi; satu rekam bisa punya keduanya. */
export function useFotoInspeksi(
  inspectionId: string | null,
  kind: 'hydrant' | 'apar' = 'hydrant',
) {
  return useQuery({
    queryKey: ['foto-inspeksi', kind, inspectionId],
    enabled: inspectionId != null,
    queryFn: async () => {
      const res = await k.ambilFotoInspeksi(kind, inspectionId as string);
      return res.items.map((f) => ({
        id: f.id,
        url: livePhotoUrl(f.id),
        caption: f.caption ?? '',
        temuan: f.temuan,
      }));
    },
  });
}

// ── Mutasi foto inspeksi ──

/** Mutasi foto (unggah/hapus) juga membarui daftar foto per inspeksi.
 *  Kunci daftar adalah `['foto-inspeksi', kind, inspectionId]`, jadi segarkan
 *  seluruh prefiks — bukan satu bentuk kunci tertentu. */
function invalidateFoto(qc: ReturnType<typeof useQueryClient>, _inspectionId?: string) {
  void qc.invalidateQueries({ queryKey: ['foto-inspeksi'] });
}
