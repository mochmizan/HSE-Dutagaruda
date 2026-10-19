/**
 * Fondasi hook data: tipe periode, kunci cache TanStack Query, pesan galat,
 * ekspor PDF, dan dua helper yang dipakai lebih dari satu modul mutasi.
 */

import { useQueryClient } from '@tanstack/react-query';
import { ApiError } from './client';
import * as k from './klien';

export type Period = string; // YYYY-MM

/** period API (YYYY-MM-DD) → kunci bulan YYYY-MM. */
export const periodeBaris = (iso: string): Period => iso.slice(0, 7);

export const kunci = {
  lokasi: ['lokasi'] as const,
  zona: ['zona'] as const,
  perusahaan: ['perusahaan'] as const,
  unitHidran: ['unit-hidran'] as const,
  inspeksiHidran: ['inspeksi-hidran'] as const,
  unitApar: ['unit-apar'] as const,
  inspeksiApar: ['inspeksi-apar'] as const,
  kotakP3k: ['kotak-p3k'] as const,
  inspeksiP3k: ['inspeksi-p3k'] as const,
  laporanPatroli: ['laporan-patroli'] as const,
  umpan: (month: Period) => ['umpan', month] as const,
};

export function gagal(err: unknown): string {
  if (err instanceof ApiError) {
    const pesan = (err.data as { pesan?: string } | undefined)?.pesan;
    return pesan || err.message;
  }
  return 'Terjadi kesalahan tak terduga.';
}

// ── Ekspor PDF ──

export const KATEGORI_EKSPOR_LABEL: Record<k.KategoriEkspor, string> = {
  'hydrant-monthly': 'Laporan Bulanan Hydrant',
  'apar-monthly': 'Laporan Bulanan APAR',
  'apar-card': 'Kartu Tahunan APAR',
  'p3k-yearly': 'Laporan Tahunan P3K',
  'patrol-report': 'Laporan Patroli K3',
};

/**
 * POST /export lalu ambil pdfJobs (v1 sinkron). Mengulang pembacaan singkat
 * untuk status queued, memuntahkan URL unduh saat done.
 */
export async function jalankanEkspor(category: k.KategoriEkspor, refId: string): Promise<string> {
  const mulai = await k.eksporPdf(category, refId);
  let job = await k.ambilPdfJob(mulai.id);
  for (let i = 0; job.status === 'queued' && i < 10; i += 1) {
    await new Promise((r) => setTimeout(r, 800));
    job = await k.ambilPdfJob(mulai.id);
  }
  if (job.status !== 'done' || !job.downloadUrl) {
    throw new ApiError(0, 'Ekspor gagal', { pesan: 'Pembuatan PDF gagal. Coba lagi.' });
  }
  return job.downloadUrl;
}

/** Unduh PDF via jangkar sementara; nama berkas dari label kategori + refId. */
export function unduhBerkas(url: string, nama: string): void {
  const a = document.createElement('a');
  a.href = url;
  a.download = nama;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** Hapus zona bila tak ada unit (hidran maupun APAR) tersisa di dalamnya.
 *  Gagal diam-diam bila server masih melihat anak (409) — guard API yang menang. */
export async function hapusZonaBilaKosong(
  qc: ReturnType<typeof useQueryClient>,
  zoneId: string | undefined,
  unitTerhapusId: string,
): Promise<void> {
  if (!zoneId) return;
  const sisaHidran = (qc.getQueryData<k.ApiHydrantUnit[]>(kunci.unitHidran) ?? []).some(
    (u) => u.id !== unitTerhapusId && u.zoneId === zoneId,
  );
  const sisaApar = (qc.getQueryData<k.ApiAparUnit[]>(kunci.unitApar) ?? []).some(
    (u) => u.id !== unitTerhapusId && u.zoneId === zoneId,
  );
  if (sisaHidran || sisaApar) return;
  try {
    await k.hapusZona(zoneId);
  } catch {
    /* abaikan: zona masih beranak di server (cache basi) atau sudah hilang */
  }
}

/** Cari id zona berdasarkan nama; buat bila belum ada (hindari zona ganda). */
export async function idZonaAtauBuat(siteId: string, zoneName: string): Promise<string> {
  const nama = zoneName.trim();
  const daftar = await k.ambilZona({ siteId });
  const ada = daftar.find((z) => z.siteId === siteId && z.name === nama);
  if (ada) return ada.id;
  const baru = await k.buatZona({ siteId, name: nama });
  return baru.id;
}
