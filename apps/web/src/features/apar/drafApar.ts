import type { AparUnitItem, InspectionReport, OverallStatus } from '../../types/hse';
import { uraiCatatanApar } from './catatanApar';
import type { NilaiKomponenApar } from './komponenApar';

/** Periode bulan berjalan (`YYYY-MM`) — pengganti patokan beku. */
const periodeBerjalan = (): string => new Date().toISOString().slice(0, 7);

export interface PotretDrafApar {
  komponen: NilaiKomponenApar;
  catatanKomponen: Record<string, string>;
  notes: string;
  tindakLanjut: string;
  overallStatus?: OverallStatus;
}

/** Potret awal formulir dari draf unit; tanpa draf semua komponen BAIK. */
export function potretDrafApar(unit: AparUnitItem): PotretDrafApar {
  const d = unit.draftDetails ?? unit.completedReport?.aparDetails;
  // Teks menyimpan gabungan; urai balik per komponen + tambahan + tindak lanjut.
  const urai = uraiCatatanApar((d as { notes?: string } | undefined)?.notes ?? unit.completedReport?.summaryNotes ?? '');
  return {
    komponen: {
      safetyPin: (d as NilaiKomponenApar | undefined)?.safetyPin || 'BAIK',
      corong: (d as NilaiKomponenApar | undefined)?.corong || 'BAIK',
      segel: (d as NilaiKomponenApar | undefined)?.segel || 'BAIK',
      tekanan: (d as NilaiKomponenApar | undefined)?.tekanan || 'BAIK',
      tabung: (d as NilaiKomponenApar | undefined)?.tabung || 'BAIK',
      selang: (d as NilaiKomponenApar | undefined)?.selang || 'BAIK',
      katupTuas: (d as NilaiKomponenApar | undefined)?.katupTuas || 'BAIK',
    },
    catatanKomponen: unit.draftDetails ? urai.catatanKomponen : {},
    notes: unit.draftDetails ? urai.tambahan : '',
    tindakLanjut: unit.draftDetails ? urai.tindakLanjut : '',
    overallStatus: (d as { overallStatus?: OverallStatus } | undefined)?.overallStatus ?? unit.completedReport?.overallStatus,
  };
}

/**
 * Batal terbit: satu medan DRAF ditulis ke rekam yang tampil, baris di cache
 * ditulis dari balasan server, dan efek `terbit` yang mengembalikan popup ke
 * bentuk pra-terbit. Layar tak pernah mendahului rekam.
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
export function buatLaporanApar(
  unit: AparUnitItem,
  komponen: NilaiKomponenApar,
  overallStatus: OverallStatus,
  catatanGabung: string,
): InspectionReport {
  return {
    id: `rep-apar-${Date.now()}`,
    category: 'APAR',
    date: new Date().toISOString(),
    period: unit.period || periodeBerjalan(),
    siteId: unit.siteId,
    siteName: 'Central Warehouse Logistics',
    zoneName: unit.zoneName,
    assetCode: unit.kode,
    inspectorName: 'Pengawas K3',
    overallStatus,
    summaryNotes: catatanGabung || 'Pemeriksaan 7 komponen selesai dan diverifikasi.',
    aparDetails: {
      jenis: unit.jenis,
      ukuran: unit.ukuran,
      expiredDate: unit.expiredDate,
      safetyPin: komponen.safetyPin,
      corong: komponen.corong,
      segel: komponen.segel,
      tekanan: komponen.tekanan,
      tabung: komponen.tabung,
      selang: komponen.selang,
      katupTuas: komponen.katupTuas,
    },
  };
}
