import type { HydrantUnitItem, InspectionReport, OverallStatus } from '../../types/hse';
import { uraiCatatan } from './catatanHidran';
import type { NilaiKomponenHidran } from './komponenHidran';

/** Periode bulan berjalan (`YYYY-MM`) — pengganti patokan `2026-09`. */
const periodeBerjalan = (): string => new Date().toISOString().slice(0, 7);

export interface PotretDrafHidran {
  komponen: NilaiKomponenHidran;
  catatanKomponen: Record<string, string>;
  notes: string;
  tindakLanjut: string;
  overallStatus?: OverallStatus;
}

/** Potret awal formulir dari draf unit; tanpa draf semua komponen STANDAR. */
export function potretDrafHidran(unit: HydrantUnitItem): PotretDrafHidran {
  const d = unit.draftDetails;
  // Teks menyimpan gabungan; urai balik per komponen + tambahan + tindak lanjut.
  const urai = uraiCatatan(d?.notes || '');
  return {
    komponen: {
      boxHydrant: d?.boxHydrant || 'LAYAK',
      fireHose: d?.fireHose || 'LAYAK',
      hoseCoupling: d?.hoseCoupling || 'LAYAK',
      hoseRack: d?.hoseRack || 'LAYAK',
      nozzle: d?.nozzle || 'LAYAK',
      valvePillar: d?.valvePillar || 'LAYAK',
    },
    catatanKomponen: d ? urai.catatanKomponen : {},
    notes: d ? urai.tambahan : '',
    tindakLanjut: d ? urai.tindakLanjut : '',
    overallStatus: d?.overallStatus ?? unit.completedReport?.overallStatus,
  };
}

/**
 * Batal terbit: satu medan DRAF ditulis ke rekam yang tampil, baris di cache
 * ditulis dari balasan server, dan efek `terbit` yang mengembalikan popup ke
 * bentuk pra-terbit. Layar tak pernah mendahului rekam — termasuk bila popup
 * ditutup lalu unit lain dibuka sebelum tulisan selesai; tulisan gagal =
 * potret tetap utuh.
 */
export async function batalkanTerbitRekam(
  idRekam: string | null,
  tulis: (inspectionId: string) => Promise<void>,
  setSibuk: (sibuk: boolean) => void,
): Promise<void> {
  if (!idRekam) return;
  setSibuk(true);
  try {
    await tulis(idRekam);
  } catch {
    // onError mutasi sudah melaporkan pesannya ke pengguna.
  } finally {
    setSibuk(false);
  }
}

/** Rakit laporan inspeksi dari potret formulir saat `Terbitkan` ditekan. */
export function buatLaporanHidran(
  unit: HydrantUnitItem,
  komponen: NilaiKomponenHidran,
  overallStatus: OverallStatus,
  catatanGabung: string,
): InspectionReport {
  return {
    id: `rep-${Date.now()}`,
    category: 'HYDRANT',
    date: new Date().toISOString(),
    period: unit.period || periodeBerjalan(),
    siteId: unit.siteId,
    siteName: 'Central Warehouse Logistics',
    zoneName: unit.zoneName,
    assetCode: unit.kode,
    inspectorName: 'Alex Chen (Staff)',
    overallStatus,
    summaryNotes: catatanGabung || 'Pemeriksaan 6 komponen selesai dan diverifikasi.',
    hydrantDetails: {
      boxHydrant: komponen.boxHydrant,
      fireHose: komponen.fireHose,
      hoseCoupling: komponen.hoseCoupling,
      hoseRack: komponen.hoseRack,
      nozzle: komponen.nozzle,
      valvePillar: komponen.valvePillar,
    },
  };
}
