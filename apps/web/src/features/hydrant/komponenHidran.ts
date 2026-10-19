import type { HydrantComponentStatus } from '../../types/hse';

/** Kunci enam komponen hydrant — satu sumber untuk form, catatan, dan laporan. */
export type KunciKomponenHidran =
  | 'boxHydrant'
  | 'fireHose'
  | 'hoseCoupling'
  | 'hoseRack'
  | 'nozzle'
  | 'valvePillar';

export type NilaiKomponenHidran = Record<KunciKomponenHidran, HydrantComponentStatus>;

/** Rapatkan enam nilai komponen jadi satu objek untuk grid, catatan, dan laporan. */
export function ambilKomponen(
  boxHydrant: HydrantComponentStatus,
  fireHose: HydrantComponentStatus,
  hoseCoupling: HydrantComponentStatus,
  hoseRack: HydrantComponentStatus,
  nozzle: HydrantComponentStatus,
  valvePillar: HydrantComponentStatus,
): NilaiKomponenHidran {
  return { boxHydrant, fireHose, hoseCoupling, hoseRack, nozzle, valvePillar };
}

/** Enam nilai komponen → satu pengubah `(key, value)` untuk grid checklist. */
export function buatPengubahKomponen(
  setter: Record<KunciKomponenHidran, (value: HydrantComponentStatus) => void>,
): (key: KunciKomponenHidran, value: HydrantComponentStatus) => void {
  return (key, value) => setter[key](value);
}

/** Urutan tampil 1–6; nomor di judul adalah bagian dari dokumen cetak. */
export const KOMPONEN_HIDRAN: {
  key: KunciKomponenHidran;
  judul: string;
  hint: string;
}[] = [
  { key: 'boxHydrant', judul: '1. Box Hydrant', hint: 'Fisik & Kaca' },
  { key: 'fireHose', judul: '2. Fire Hose', hint: 'Selang Utama' },
  { key: 'hoseCoupling', judul: '3. Hose Coupling', hint: 'Kopling Sambungan' },
  { key: 'hoseRack', judul: '4. Hose Rack', hint: 'Gantungan Selang' },
  { key: 'nozzle', judul: '5. Nozzle', hint: 'Corong Semprot' },
  { key: 'valvePillar', judul: '6. Valve/Pillar Hydrant', hint: 'Kran & Tekanan' },
];
