/**
 * Hook TanStack Query — satu sumber data seluruh halaman.
 * Mutasi memakai optimistic update yang murah (hapus temuan, ubah butir P3K)
 * dan invalidasi pada settle untuk sisanya.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { InspectionReport, AparUnitItem, HydrantUnitItem } from '@/types/hse';
import type { AparYearGrid } from '@/types/hse';
import type { AparCardsState } from '@/lib/aparSync';
import { emptyYearGrid, DRAFT_TO_YEAR } from '@/lib/aparSync';
import type { OverallStatus } from '@/types/domain';
import * as k from './klien';
import { ApiError } from './client';
import { livePhotoUrl } from './liveClient';

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

export function useLokasi() {
  return useQuery({
    queryKey: kunci.lokasi,
    queryFn: async () => {
      const page = await k.ambilLokasi();
      return page.items;
    },
  });
}

export function useZona() {
  return useQuery({
    queryKey: kunci.zona,
    queryFn: async () => {
      const page = await k.ambilZona();
      return page.items;
    },
  });
}

export function usePerusahaan() {
  return useQuery({
    queryKey: kunci.perusahaan,
    queryFn: async () => {
      const page = await k.ambilPerusahaan();
      return page.items[0] ?? null;
    },
  });
}

export function useUnitHidran() {
  return useQuery({
    queryKey: kunci.unitHidran,
    queryFn: async () => {
      const page = await k.ambilUnitHidran();
      return page.items;
    },
  });
}

export function useInspeksiHidran() {
  return useQuery({
    queryKey: kunci.inspeksiHidran,
    queryFn: async () => {
      const page = await k.ambilInspeksiHidran();
      return page.items;
    },
  });
}

export function useUnitApar() {
  return useQuery({
    queryKey: kunci.unitApar,
    queryFn: async () => {
      const page = await k.ambilUnitApar();
      return page.items;
    },
  });
}

export function useInspeksiApar() {
  return useQuery({
    queryKey: kunci.inspeksiApar,
    queryFn: async () => {
      const page = await k.ambilInspeksiApar();
      return page.items;
    },
  });
}

export function useKotakP3k() {
  return useQuery({
    queryKey: kunci.kotakP3k,
    queryFn: async () => {
      const page = await k.ambilKotakP3k();
      return page.items;
    },
  });
}

export function useInspeksiP3k() {
  return useQuery({
    queryKey: kunci.inspeksiP3k,
    queryFn: async () => {
      const page = await k.ambilInspeksiP3k();
      return page.items;
    },
  });
}

export function useLaporanPatroli() {
  return useQuery({
    queryKey: kunci.laporanPatroli,
    queryFn: async () => {
      const page = await k.ambilLaporanPatroli();
      const denganTemuan = await Promise.all(
        page.items.map(async (laporan) => {
          const temuan = await k.ambilTemuanPatroli(laporan.id);
          return { ...laporan, findings: temuan.items };
        }),
      );
      return denganTemuan;
    },
  });
}

export function useUmpan(month: Period) {
  return useQuery({
    queryKey: kunci.umpan(month),
    queryFn: () => k.ambilUmpan(month),
  });
}

function gagal(err: unknown): string {
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
 *  (foto dulu, lalu rekam — cegah 409), lalu unitnya. */
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
      return k.hapusUnitHidran(unitId);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: kunci.unitHidran });
      void qc.invalidateQueries({ queryKey: kunci.inspeksiHidran });
      void qc.invalidateQueries({ queryKey: ['foto-inspeksi'] });
      void qc.invalidateQueries({ queryKey: ['umpan'] });
    },
    onError: (err) => window.alert(gagal(err)),
  });
}

/** Cari id zona berdasarkan nama; buat bila belum ada (hindari zona ganda). */
async function idZonaAtauBuat(siteId: string, zoneName: string): Promise<string> {
  const nama = zoneName.trim();
  const daftar = await k.ambilZona();
  const ada = (daftar.items ?? []).find((z) => z.siteId === siteId && z.name === nama);
  if (ada) return ada.id;
  const baru = await k.buatZona({ siteId, name: nama });
  return baru.id;
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
 *  (foto dulu, lalu rekam — cegah 409), lalu unitnya. */
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
      return k.hapusUnitApar(unitId);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: kunci.unitApar });
      void qc.invalidateQueries({ queryKey: kunci.inspeksiApar });
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

// ── Mutasi foto inspeksi ──

/** Foto terpasang pada satu inspeksi (dilihat via GET /api/photos/:id presigned). */
export interface FotoTampil {
  id: string;
  url: string;
  caption: string;
}

export function useUnggahFoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      kind: 'hydrant' | 'apar';
      inspectionId: string;
      file: File;
      caption?: string;
    }) => k.unggahFoto(args.kind, args.inspectionId, args.file, args.caption),
    onSuccess: (_foto, args) => invalidateFoto(qc, args.inspectionId),
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

/** Daftar foto satu inspeksi (kontrak menunggu endpoint GET /api/photos dari pekerja J). */
export function useFotoInspeksi(inspectionId: string | null) {
  return useQuery({
    queryKey: ['foto-inspeksi', inspectionId],
    enabled: inspectionId != null,
    queryFn: async () => {
      const res = await k.ambilFotoInspeksi('hydrant', inspectionId as string);
      return res.items.map((f) => ({ id: f.id, url: livePhotoUrl(f.id), caption: f.caption ?? '' }));
    },
  });
}

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

// ── Mutasi foto inspeksi ──

/** Mutasi foto (unggah/hapus) juga membarui daftar foto per inspeksi. */
function invalidateFoto(qc: ReturnType<typeof useQueryClient>, inspectionId?: string) {
  if (inspectionId) void qc.invalidateQueries({ queryKey: ['foto-inspeksi', inspectionId] });
}

// ── Pemetaan baris API → model UI ──

const namaPetugas = 'Pengawas K3';

export function petakanUnitHidran(
  units: k.ApiHydrantUnit[],
  inspections: k.ApiInspeksiHidran[],
  zonaNama: (zoneId: string) => string,
  period: Period,
): HydrantUnitItem[] {
  return units.map((u) => {
    const insp = inspections.find(
      (i) => i.unitId === u.id && periodeBaris(i.period) === period,
    );
    if (!insp) {
      return {
        id: u.id,
        kode: u.kode,
        siteId: u.siteId,
        zoneId: u.zoneId,
        zoneName: zonaNama(u.zoneId),
        status: 'BELUM_DIPERIKSA' as const,
        period,
        inspectorName: namaPetugas,
        componentsCheckedCount: 0,
        componentsTotal: 6,
        scheduledDate: 'Bulan Ini',
      };
    }
    return {
      id: u.id,
      kode: u.kode,
      siteId: u.siteId,
      zoneId: u.zoneId,
      zoneName: zonaNama(u.zoneId),
      status: 'SELESAI' as const,
      period,
      inspectorName: namaPetugas,
      componentsCheckedCount: 6,
      componentsTotal: 6,
      lastInspectionDate: insp.createdAt,
      draftDetails: {
        boxHydrant: insp.boxHydrant,
        fireHose: insp.fireHose,
        hoseCoupling: insp.hoseCoupling,
        hoseRack: insp.hoseRack,
        nozzle: insp.nozzle,
        valvePillar: insp.valvePillar,
        notes: insp.notes ?? undefined,
      },
      completedReport: {
        id: insp.id,
        category: 'HYDRANT' as const,
        date: insp.createdAt,
        period: periodeBaris(insp.period),
        siteId: u.siteId,
        siteName: '',
        zoneName: zonaNama(u.zoneId),
        assetCode: u.kode,
        inspectorName: namaPetugas,
        overallStatus: insp.overallStatus as OverallStatus,
        summaryNotes: insp.notes ?? 'Pemeriksaan 6 komponen selesai dan diverifikasi.',
        hydrantDetails: {
          boxHydrant: insp.boxHydrant,
          fireHose: insp.fireHose,
          hoseCoupling: insp.hoseCoupling,
          hoseRack: insp.hoseRack,
          nozzle: insp.nozzle,
          valvePillar: insp.valvePillar,
        },
      },
    };
  });
}

export function petakanUnitApar(
  units: k.ApiAparUnit[],
  inspections: k.ApiInspeksiApar[],
  zonaNama: (zoneId: string) => string,
  period: Period,
): AparUnitItem[] {
  return units.map((u) => {
    const insp = inspections.find(
      (i) => i.unitId === u.id && periodeBaris(i.period) === period,
    );
    const dasar = {
      id: u.id,
      kode: u.kode,
      siteId: u.siteId,
      zoneId: u.zoneId,
      zoneName: zonaNama(u.zoneId),
      period,
      inspectorName: namaPetugas,
      jenis: (u.jenis ?? 'POWDER') as 'POWDER' | 'CO2',
      ukuran: u.ukuran ?? '',
      tahunPembuatan: u.tahun ?? 0,
      expiredDate: u.expiredDate,
      beratCo2Kg: u.jenis === 'CO2' && insp?.beratCo2Kg != null ? insp.beratCo2Kg : undefined,
      componentsTotal: 7,
    };
    if (!insp) {
      return {
        ...dasar,
        status: 'BELUM_DIPERIKSA' as const,
        componentsCheckedCount: 0,
        draftDetails: {},
      };
    }
    return {
      ...dasar,
      status: 'SELESAI' as const,
      componentsCheckedCount: 7,
      lastInspectionDate: insp.createdAt,
      draftDetails: {
        safetyPin: insp.safetyPin,
        corong: insp.corong,
        segel: insp.segel,
        tekanan: insp.tekanan,
        tabung: insp.tabung,
        selang: insp.selang,
        katupTuas: insp.katupTuas,
        notes: insp.notes ?? undefined,
      },
      completedReport: {
        id: insp.id,
        category: 'APAR' as const,
        date: insp.createdAt,
        period: periodeBaris(insp.period),
        siteId: u.siteId,
        siteName: '',
        zoneName: zonaNama(u.zoneId),
        assetCode: u.kode,
        inspectorName: namaPetugas,
        overallStatus: insp.overallStatus as OverallStatus,
        summaryNotes: insp.notes ?? 'Pemeriksaan 7 komponen selesai dan diverifikasi.',
        aparDetails: {
          jenis: (u.jenis ?? 'POWDER') as 'POWDER' | 'CO2',
          ukuran: u.ukuran ?? '',
          expiredDate: u.expiredDate,
          safetyPin: insp.safetyPin,
          corong: insp.corong,
          segel: insp.segel,
          tekanan: insp.tekanan,
          tabung: insp.tabung,
          selang: insp.selang,
          katupTuas: insp.katupTuas,
        },
      },
    };
  });
}

/** Grid kartu tahunan per unit: inspeksi tersimpan → sel 12 bulan (tampilan hanya-baca). */
export function petakanKartuApar(
  units: k.ApiAparUnit[],
  inspections: k.ApiInspeksiApar[],
): AparCardsState {
  const kartu: AparCardsState = {};
  for (const unit of units) {
    const perTahun: Record<string, AparYearGrid> = {};
    for (const insp of inspections) {
      if (insp.unitId !== unit.id) continue;
      const tahun = insp.period.slice(0, 4);
      const bulan = insp.period.slice(5, 7);
      const grid = perTahun[tahun] ?? emptyYearGrid();
      grid[bulan] = {
        tanggal: insp.createdAt.slice(0, 10),
        kondisi: {
          safetyPin: DRAFT_TO_YEAR[insp.safetyPin],
          corong: DRAFT_TO_YEAR[insp.corong],
          segel: DRAFT_TO_YEAR[insp.segel],
          tekanan: DRAFT_TO_YEAR[insp.tekanan],
          tabung: DRAFT_TO_YEAR[insp.tabung],
          selang: DRAFT_TO_YEAR[insp.selang],
          katupTuas: DRAFT_TO_YEAR[insp.katupTuas],
        },
        nama: namaPetugas,
        paraf: '',
        ...(insp.notes ? { tindakLanjut: insp.notes } : {}),
      };
      perTahun[tahun] = grid;
    }
    kartu[unit.kode] = perTahun;
  }
  return kartu;
}

export interface TemuanPatroliTampil {
  id: string;
  /** URL foto via GET /api/safety-patrol-reports/findings/:fid/photo (302). '' = placeholder. */
  photoUrl: string;
  caption: string;
  tanggal: string;
}

export function petakanTemuanPatroli(
  laporan: Array<k.ApiLaporanPatroli & { findings?: k.ApiTemuanPatroli[] }>,
): TemuanPatroliTampil[] {
  return laporan.flatMap((l) =>
    (l.findings ?? []).map((f) => ({
      id: f.id,
      // Foto nyata dilayani GET /api/safety-patrol-reports/findings/:fid/photo;
      // kunci berawalan draft/ (temuan lama) tampil sebagai placeholder abu-abu.
      photoUrl: f.s3Key.startsWith('draft/') ? '' : k.urlFotoTemuanPatroli(f.id),
      caption: f.description,
      tanggal: l.patrolDate,
    })),
  );
}

export interface KonteksUmpan {
  zonaNama: (zoneId: string) => string;
  unitHidran: Map<string, k.ApiHydrantUnit>;
  unitApar: Map<string, k.ApiAparUnit>;
  kotakP3k: Map<string, k.ApiP3kBox>;
}

export function petakanUmpanKeLaporan(
  umpan: k.ApiUmpan | undefined,
  ctx: KonteksUmpan,
): InspectionReport[] {
  if (!umpan) return [];
  const hidran: InspectionReport[] = (umpan.hydrant ?? []).map((r) => {
    const unit = ctx.unitHidran.get(r.unitId);
    return {
      id: r.id,
      category: 'HYDRANT' as const,
      date: r.createdAt,
      period: periodeBaris(r.period),
      siteId: r.companyId,
      siteName: '',
      zoneName: unit ? ctx.zonaNama(unit.zoneId) : '–',
      assetCode: unit ? `Hydrant ${unit.kode}` : 'Hydrant',
      inspectorName: namaPetugas,
      overallStatus: r.overallStatus as OverallStatus,
      summaryNotes: r.notes ?? undefined,
      hydrantDetails: {
        boxHydrant: r.boxHydrant,
        fireHose: r.fireHose,
        hoseCoupling: r.hoseCoupling,
        hoseRack: r.hoseRack,
        nozzle: r.nozzle,
        valvePillar: r.valvePillar,
      },
    };
  });
  const apar: InspectionReport[] = (umpan.apar ?? []).map((r) => {
    const unit = ctx.unitApar.get(r.unitId);
    return {
      id: r.id,
      category: 'APAR' as const,
      date: r.createdAt,
      period: periodeBaris(r.period),
      siteId: r.companyId,
      siteName: '',
      zoneName: unit ? ctx.zonaNama(unit.zoneId) : '–',
      assetCode: unit ? `APAR ${unit.kode}` : 'APAR',
      inspectorName: namaPetugas,
      overallStatus: r.overallStatus as OverallStatus,
      summaryNotes: r.notes ?? undefined,
      aparDetails: {
        jenis: (unit?.jenis ?? 'POWDER') as 'POWDER' | 'CO2',
        ukuran: unit?.ukuran ?? '',
        expiredDate: unit?.expiredDate ?? '',
        safetyPin: r.safetyPin,
        corong: r.corong,
        segel: r.segel,
        tekanan: r.tekanan,
        tabung: r.tabung,
        selang: r.selang,
        katupTuas: r.katupTuas,
      },
    };
  });
  const p3k: InspectionReport[] = (umpan.p3k ?? []).map((r) => {
    const box = ctx.kotakP3k.get(r.boxId);
    return {
      id: r.id,
      category: 'P3K' as const,
      date: r.inspectionDate ?? r.createdAt,
      period: periodeBaris(r.period),
      siteId: r.companyId,
      siteName: '',
      zoneName: '–',
      assetCode: box ? box.name : 'Kotak P3K',
      inspectorName: namaPetugas,
      overallStatus: 'LAYAK' as OverallStatus,
      p3kDetails: { boxName: box?.name ?? '', itemsTotal: 21, itemsUnderStandard: 0, needsRestock: false },
    };
  });
  const patroli: InspectionReport[] = (umpan.patroli ?? []).map((r) => ({
    id: r.id,
    category: 'SAFETY_PATROL' as const,
    date: r.createdAt,
    period: periodeBaris(r.patrolDate),
    siteId: r.companyId,
    siteName: '',
    zoneName: ctx.zonaNama(r.siteId),
    assetCode: 'Patroli K3',
    inspectorName: namaPetugas,
    overallStatus: 'LAYAK' as OverallStatus,
    patrolDetails: {
      findingsCount: 0,
      criticalCount: 0,
      locationNote: '–',
    },
  }));
  return [...hidran, ...apar, ...p3k, ...patroli];
}
