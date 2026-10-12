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

export function useBuatUnitHidran() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { unit: k.MasukanUnitHidran; zonaBaru?: string; siteId: string }) =>
      (async () => {
        if (args.zonaBaru) await k.buatZona({ siteId: args.siteId, name: args.zonaBaru });
        return k.buatUnitHidran(args.unit);
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

export function useBuatUnitApar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { unit: k.MasukanUnitApar; zonaBaru?: string; siteId: string }) =>
      (async () => {
        if (args.zonaBaru) await k.buatZona({ siteId: args.siteId, name: args.zonaBaru });
        return k.buatUnitApar(args.unit);
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
    mutationFn: (args: { boxId: string; month: string }) => k.buatInspeksiP3k(args),
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
    onError: (_err, _args, ctx) => {
      if (ctx?.sebelumnya) qc.setQueryData(kunci.inspeksiP3k, ctx.sebelumnya);
      window.alert('Perubahan butir P3K gagal disimpan.');
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: kunci.inspeksiP3k }),
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

/** Optimistic: temuan hilang seketika, rollback saat gagal. */
export function useHapusTemuanPatroli() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fid: string) => k.hapusTemuanPatroli(fid),
    onMutate: async (fid) => {
      await qc.cancelQueries({ queryKey: kunci.laporanPatroli });
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
      window.alert('Penghapusan temuan gagal.');
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: kunci.laporanPatroli }),
  });
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

export interface TemuanPatroliTampil {  id: string;
  /** URL foto via GET /api/photos/:id (redirect 302, kuki). '' = placeholder. */
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
      // Unggahan nyata belum terpasang (lingkup pekerja lain): kunci berawalan
      // draft/ ditampilkan sebagai placeholder abu-abu, sisanya coba URL foto.
      photoUrl: f.s3Key.startsWith('draft/') ? '' : livePhotoUrl(f.s3Key),
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
  const hidran: InspectionReport[] = umpan.hidran.map((r) => {
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
  const apar: InspectionReport[] = umpan.apar.map((r) => {
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
  const p3k: InspectionReport[] = umpan.p3k.map((r) => {
    const box = ctx.kotakP3k.get(r.boxId);
    return {
      id: r.id,
      category: 'P3K' as const,
      date: r.createdAt,
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
  const patroli: InspectionReport[] = umpan.patroli.map((r) => ({
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
