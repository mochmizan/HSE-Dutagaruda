/** Pemetaan unit Hydrant/APAR dan grid kartu tahunan APAR. */

import type { AparUnitItem, HydrantUnitItem } from '@/types/hse';
import type { AparYearGrid } from '@/types/hse';
import type { AparCardsState } from '@/lib/aparSync';
import { emptyYearGrid, DRAFT_TO_YEAR } from '@/lib/aparSync';
import type { OverallStatus } from '@/types/domain';
import * as k from './klien';
import { periodeBaris, type Period } from './queries-dasar';

const namaPetugas = 'Takamay Jason Hermantika Irsyad (Junior HSE Analyst)';

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
    const status: HydrantUnitItem['status'] =
      insp.approvalStatus === 'DRAFT' ? 'SEDANG_BERJALAN' : 'SELESAI';
    return {
      id: u.id,
      kode: u.kode,
      siteId: u.siteId,
      zoneId: u.zoneId,
      zoneName: zonaNama(u.zoneId),
      status,
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
    const status: AparUnitItem['status'] =
      insp.approvalStatus === 'DRAFT' ? 'SEDANG_BERJALAN' : 'SELESAI';
    return {
      ...dasar,
      status,
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
