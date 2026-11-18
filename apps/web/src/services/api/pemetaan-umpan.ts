/** Pemetaan temuan Safety Patrol dan umpan dashboard lintas kategori. */

import type { InspectionReport } from '@/types/hse';
import type { OverallStatus } from '@/types/domain';
import * as k from './klien';
import { periodeBaris } from './queries-dasar';

export const NAMA_PETUGAS_DEFAULT = 'Takamay Jason Hermantika Irsyad (Junior HSE Analyst)';
export const NAMA_PENGESAH_DEFAULT = 'Hizri (Governance, Risk, HSE & Quality Group Head)';

export interface TemuanPatroliTampil {
  id: string;
  /** URL foto via GET /api/safety-patrol-reports/findings/:fid/photo (302). '' = placeholder. */
  photoUrl: string;
  caption: string;
  tanggal: string;
  locationNote: string;
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
      locationNote: f.locationNote ?? '',
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
  umpan: (k.ApiUmpan & { patrol?: Array<k.ApiLaporanPatroli & { category?: string }> }) | undefined,
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
      siteId: unit?.siteId ?? r.companyId,
      siteName: '',
      zoneName: unit ? ctx.zonaNama(unit.zoneId) : '–',
      assetCode: unit ? `Hydrant ${unit.kode}` : 'Hydrant',
      inspectorName: NAMA_PETUGAS_DEFAULT,
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
      siteId: unit?.siteId ?? r.companyId,
      siteName: '',
      zoneName: unit ? ctx.zonaNama(unit.zoneId) : '–',
      assetCode: unit ? `APAR ${unit.kode}` : 'APAR',
      inspectorName: NAMA_PETUGAS_DEFAULT,
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
      siteId: box?.siteId ?? r.companyId,
      siteName: '',
      zoneName: '–',
      assetCode: box ? box.name : 'Kotak P3K',
      inspectorName: NAMA_PETUGAS_DEFAULT,
      overallStatus: 'LAYAK' as OverallStatus,
      p3kDetails: { boxName: box?.name ?? '', itemsTotal: 21, itemsUnderStandard: 0, needsRestock: false },
    };
  });
  const daftarPatroli = umpan.patroli?.length ? umpan.patroli : (umpan.patrol ?? []);
  const patroli: InspectionReport[] = daftarPatroli.map((r) => ({
    id: r.id,
    category: 'SAFETY_PATROL' as const,
    date: r.createdAt,
    period: periodeBaris(r.patrolDate),
    siteId: r.siteId || r.companyId,
    siteName: '',
    zoneName: ctx.zonaNama(r.siteId),
    assetCode: 'Safety Patrol',
    inspectorName: NAMA_PETUGAS_DEFAULT,
    overallStatus: 'LAYAK' as OverallStatus,
    patrolDetails: {
      findingsCount: 0,
      criticalCount: 0,
      locationNote: '–',
    },
  }));
  return [...hidran, ...apar, ...p3k, ...patroli];
}
