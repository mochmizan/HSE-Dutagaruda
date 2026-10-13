/**
 * Sinkronisasi dua arah APAR — tabel pemeriksaan bulanan ↔ kartu tahunan per unit.
 * Pure functions tanpa efek samping (UI-only, PRD §2.2 Epic D).
 *
 * Kontrak:
 * - Sel kartu tahunan bulan laporan adalah satu-satunya sumber komponen 7 status
 *   untuk bulan berjalan (replace), sehingga `componentsCheckedCount`, `status`,
 *   chip tabel, dan lencana kelayakan selalu sejalan.
 * - `tanggal` / `nama` / `paraf` di-merge (nilai sel menang bila terisi).
 * - Foto dokumentasi (`photo*Url`), `notes`, `inspectorName`, dan `completedReport`
 *   tidak pernah disentuh.
 */

import type { AparUnitItem, AparYearCell, AparYearGrid } from '../types/hse';
import type { AparComponentStatus, OverallStatus } from '../types/domain';
import { computeAparOverallStatus } from './statusCalculator';
import type { AparComponents } from './statusCalculator';

export type AparComponentKey =
  | 'safetyPin'
  | 'corong'
  | 'segel'
  | 'tekanan'
  | 'tabung'
  | 'selang'
  | 'katupTuas';

export const APAR_COMPONENT_KEYS: AparComponentKey[] = [
  'safetyPin',
  'corong',
  'segel',
  'tekanan',
  'tabung',
  'selang',
  'katupTuas',
];

/** Kunci bulan kartu tahunan (01–12). */
export const APAR_MONTH_KEYS: string[] = [
  '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12',
];

/** Tahun yang tersedia pada kartu tahunan. */
export const APAR_CARD_YEARS: string[] = ['2025', '2026'];

/** Penanda sel kartu tahunan. */
export type AparYearMark = '' | '✓' | 'X' | 'NA';

/** Status komponen pada `draftDetails` (hanya komponen yang sudah diperiksa). */
export type AparComponentDraft = Partial<Record<AparComponentKey, AparComponentStatus>>;

/** Toko kartu tahunan: kode unit → tahun → grid 12 bulan. */
export type AparCardStore = Record<string, Record<string, AparYearGrid>>;

/** Alias tampilan (dipakai AparPage/App): toko kartu tahunan per kode unit. */
export type AparCardsState = AparCardStore;

/** Pemetaan sel kartu → status draft: '' → belum diperiksa (undefined). */
export const YEAR_TO_DRAFT: Record<AparYearMark, AparComponentStatus | undefined> = {
  '': undefined,
  '✓': 'BAIK',
  'X': 'TIDAK_BAIK',
  'NA': 'NA',
};

/** Kebalikan YEAR_TO_DRAFT. */
export const DRAFT_TO_YEAR: Record<AparComponentStatus, AparYearMark> = {
  BAIK: '✓',
  TIDAK_BAIK: 'X',
  NA: 'NA',
};

const asMark = (value: string): AparYearMark =>
  value === '✓' || value === 'X' || value === 'NA' ? value : '';

/** Sel kosong satu bulan (di atas: dipakai draftToYearCell). */
export const emptyYearCell = (): AparYearCell => ({
  tanggal: '',
  kondisi: { safetyPin: '', corong: '', segel: '', tekanan: '', tabung: '', selang: '', katupTuas: '' },
  nama: '',
  paraf: '',
});

/** Sel kartu → draft komponen (hanya nilai terdefinisi ikut terbawa). */
export const yearCellToDraft = (cell: AparYearCell): AparComponentDraft => {
  const draft: AparComponentDraft = {};
  for (const key of APAR_COMPONENT_KEYS) {
    const status = YEAR_TO_DRAFT[asMark(cell.kondisi[key] ?? '')];
    if (status) draft[key] = status;
  }
  return draft;
};

/** Draft komponen → sel kartu (tanggal/nama/paraf dikosongkan). */
export const draftToYearCell = (partial: AparComponentDraft): AparYearCell => {
  const cell = emptyYearCell();
  for (const key of APAR_COMPONENT_KEYS) {
    const status = partial[key];
    cell.kondisi[key] = status ? DRAFT_TO_YEAR[status] : '';
  }
  return cell;
};

/** Jumlah komponen yang sudah diperiksa (0–7). */
export const countChecked = (draft: AparComponentDraft): number =>
  APAR_COMPONENT_KEYS.reduce((total, key) => (draft[key] ? total + 1 : total), 0);

/** Grid 12 bulan kosong. */
export const emptyYearGrid = (): AparYearGrid => {
  const grid: AparYearGrid = {};
  for (const month of APAR_MONTH_KEYS) grid[month] = emptyYearCell();
  return grid;
};

/** Salinan dalam grid (deep-clone kondisi) agar state tidak berbagi referensi. */
export const cloneYearGrid = (grid: AparYearGrid): AparYearGrid => {
  const out: AparYearGrid = {};
  for (const month of APAR_MONTH_KEYS) {
    const cell = grid[month];
    out[month] = cell ? { ...cell, kondisi: { ...cell.kondisi } } : emptyYearCell();
  }
  return out;
};

/** Sel dianggap kosong bila belum ada isian sama sekali. */
export const isEmptyYearCell = (cell: AparYearCell | undefined): boolean =>
  !cell ||
  (!cell.tanggal &&
    !cell.nama &&
    !cell.paraf &&
    !cell.tindakLanjut &&
    APAR_COMPONENT_KEYS.every((key) => !cell.kondisi[key]));

/** Draft unit → sel kartu (dipakai saat kartu belum menyimpan bulan laporan). */
export const cellFromUnitDraft = (unit: AparUnitItem): AparYearCell => {
  const base = unit.draftDetails;
  if (!base) return emptyYearCell();
  const cell = draftToYearCell(base);
  return {
    ...cell,
    tanggal: base.tanggalPemeriksaan ?? '',
    nama: base.namaPemeriksa ?? '',
    paraf: base.paraf ?? '',
    ...(base.tindakLanjut ? { tindakLanjut: base.tindakLanjut } : {}),
  };
};

/**
 * Sel bulan laporan yang ditampilkan kartu: pakai isian kartu bila sudah ada,
 * jika masih kosong isi dari draft unit supaya tabel bulanan dan kartu tahunan
 * menampilkan data yang sama sejak awal.
 */
export const resolveReportCell = (stored: AparYearCell | undefined, unit: AparUnitItem): AparYearCell => {
  if (stored && !isEmptyYearCell(stored)) return stored;
  const fromDraft = cellFromUnitDraft(unit);
  if (!isEmptyYearCell(fromDraft)) return fromDraft;
  return stored ?? emptyYearCell();
};

export interface AparDeriveMeta {
  /** Periode (YYYY-MM) bulan sel yang diubah. */
  period: string;
  /** Nama petugas cadangan bila sel dan unit tidak menyimpan nama pengisi. */
  inspectorName?: string;
}

/** Isi komponen untuk PRD §3.3: sel belum diperiksa memakai nilai lama, lalu 'NA'. */
const toComponents = (draft: AparComponentDraft, base: AparComponentDraft): AparComponents => ({
  safetyPin: draft.safetyPin ?? base.safetyPin ?? 'NA',
  corong: draft.corong ?? base.corong ?? 'NA',
  segel: draft.segel ?? base.segel ?? 'NA',
  tekanan: draft.tekanan ?? base.tekanan ?? 'NA',
  tabung: draft.tabung ?? base.tabung ?? 'NA',
  selang: draft.selang ?? base.selang ?? 'NA',
  katupTuas: draft.katupTuas ?? base.katupTuas ?? 'NA',
});

/**
 * Terapkan sel kartu tahunan ke unit inspeksi (arah kartu → tabel).
 * Komponen diganti penuh oleh isi sel; `tanggal`/`nama`/`paraf` merge;
 * foto, catatan, petugas, dan `completedReport` dipertahankan.
 */
export const deriveUnitFromYearCell = (
  unit: AparUnitItem,
  cell: AparYearCell,
  meta: AparDeriveMeta
): AparUnitItem => {
  const draft = yearCellToDraft(cell);
  const checked = countChecked(draft);
  const base = unit.draftDetails ?? {};
  const total = APAR_COMPONENT_KEYS.length;

  const status: AparUnitItem['status'] =
    checked === 0 ? 'BELUM_DIPERIKSA' : checked >= total ? 'SELESAI' : 'SEDANG_BERJALAN';

  const overallStatus: OverallStatus | undefined =
    checked > 0 ? computeAparOverallStatus(toComponents(draft, base)) : undefined;

  const nama = cell.nama.trim();

  const draftDetails: AparUnitItem['draftDetails'] = {
    ...base,
    safetyPin: draft.safetyPin,
    corong: draft.corong,
    segel: draft.segel,
    tekanan: draft.tekanan,
    tabung: draft.tabung,
    selang: draft.selang,
    katupTuas: draft.katupTuas,
    overallStatus,
    tanggalPemeriksaan: cell.tanggal || base.tanggalPemeriksaan,
    namaPemeriksa: nama || base.namaPemeriksa || meta.inspectorName,
    paraf: cell.paraf || base.paraf,
  };

  return {
    ...unit,
    period: meta.period,
    status,
    componentsCheckedCount: checked,
    componentsTotal: total,
    draftDetails,
  };
};
