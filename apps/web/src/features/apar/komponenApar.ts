import type { AparComponentStatus } from '../../types/hse';

/** Kunci tujuh komponen APAR — satu sumber untuk form, catatan, dan laporan. */
export type KunciKomponenApar =
  | 'safetyPin'
  | 'corong'
  | 'segel'
  | 'tekanan'
  | 'tabung'
  | 'selang'
  | 'katupTuas';

export type NilaiKomponenApar = Record<KunciKomponenApar, AparComponentStatus>;

/** Rapatkan tujuh nilai komponen jadi satu objek untuk grid, catatan, dan laporan. */
export function ambilKomponen(
  safetyPin: AparComponentStatus,
  corong: AparComponentStatus,
  segel: AparComponentStatus,
  tekanan: AparComponentStatus,
  tabung: AparComponentStatus,
  selang: AparComponentStatus,
  katupTuas: AparComponentStatus,
): NilaiKomponenApar {
  return { safetyPin, corong, segel, tekanan, tabung, selang, katupTuas };
}

/** Tujuh nilai komponen → satu pengubah `(key, value)` untuk grid checklist. */
export function buatPengubahKomponen(
  setter: Record<KunciKomponenApar, (value: AparComponentStatus) => void>,
): (key: KunciKomponenApar, value: AparComponentStatus) => void {
  return (key, value) => setter[key](value);
}

/** Urutan tampil 1–7; nomor di judul adalah bagian dari dokumen cetak. */
export const KOMPONEN_APAR: {
  key: KunciKomponenApar;
  judul: string;
  hint: string;
}[] = [
  { key: 'safetyPin', judul: '1. Safety Pin', hint: 'Pin Pengaman' },
  { key: 'corong', judul: '2. Fire Hose', hint: 'Selang Pemadam' },
  { key: 'segel', judul: '3. Segel', hint: 'Segel Pabrik' },
  { key: 'tekanan', judul: '4. Pressure Gauge', hint: 'Jarum Manometer' },
  { key: 'tabung', judul: '5. Tabung/Tube', hint: 'Bodi & Karat' },
  { key: 'selang', judul: '6. Nozzle', hint: 'Corong / Mulut Semprot' },
  { key: 'katupTuas', judul: '7. Katup/Tuas', hint: 'Tuas Penekan' },
];
