import { differenceInCalendarDays, isValid, parseISO, startOfDay } from 'date-fns';
import type { ApiInspeksiApar } from '@/services/api/klien';
import { uraiCatatanApar } from './catatanApar';

/**
 * Pemetaan lokal kartu tahunan APAR (hanya-baca, turunan inspeksi).
 *
 * Dibuat ulang di dalam `apar/` supaya kartu tahunan tidak bergantung pada
 * berkas yang sudah dihapus maupun pada toko draf dua-arah: sel kartu selalu
 * dihitung dari rekam inspeksi (`ApiInspeksiApar`) apa adanya.
 */

/** Tujuh kunci komponen APAR, urut sesuai kertas. */
export const KUNCI_KOMPONEN_KARTU = [
  'safetyPin',
  'corong',
  'segel',
  'tekanan',
  'tabung',
  'selang',
  'katupTuas',
] as const;

export type KunciKartuApar = (typeof KUNCI_KOMPONEN_KARTU)[number];

/** Label pendek tiap komponen untuk sel kartu. */
export const LABEL_KOMPONEN_KARTU: Record<KunciKartuApar, string> = {
  safetyPin: 'Pin',
  corong: 'Corong',
  segel: 'Segel',
  tekanan: 'Tekanan',
  tabung: 'Tabung',
  selang: 'Selang',
  katupTuas: 'Katup',
};

/** Tanda sel kartu: ✓ baik, X tidak baik/hilang, – belum diperiksa. */
export type TandaKartuApar = '✓' | 'X' | '–';

/** Status rekam → tanda kartu (`NA` = HILANG, dihitung merah seperti tabel). */
export function tandaUntukStatus(status?: string | null): TandaKartuApar {
  if (status === 'BAIK') return '✓';
  if (status === 'TIDAK_BAIK' || status === 'NA') return 'X';
  return '–';
}

/** Satu sel bulan: tanggal inspeksi + 7 tanda + tindak lanjut. */
export interface SelKartuApar {
  tanggal: string;
  kondisi: Record<KunciKartuApar, TandaKartuApar>;
  tindakLanjut: string;
}

/** Grid 12 bulan (`01`–`12`). */
export type GridKartuApar = Record<string, SelKartuApar>;

export const BULAN_KARTU: string[] = [
  '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12',
];

/** Tahun yang tersedia pada kartu: tahun berjalan ±1 (tidak dipatok). */
export function daftarTahunKartu(): string[] {
  const y = new Date().getFullYear();
  return [String(y - 1), String(y), String(y + 1)];
}

export function selKartuKosong(): SelKartuApar {
  return {
    tanggal: '',
    kondisi: {
      safetyPin: '–',
      corong: '–',
      segel: '–',
      tekanan: '–',
      tabung: '–',
      selang: '–',
      katupTuas: '–',
    },
    tindakLanjut: '',
  };
}

export function gridKartuKosong(): GridKartuApar {
  const grid: GridKartuApar = {};
  for (const bulan of BULAN_KARTU) grid[bulan] = selKartuKosong();
  return grid;
}

/**
 * Rekam inspeksi → kartu tahunan per unit per tahun (hanya-baca).
 *
 * Kunci luar = `unitId`, kunci dalam = tahun `YYYY`. Sel bulan laporan diisi
 * tanggal rekam + tanda 7 komponen + tindak lanjut (jatuh balik ke catatan
 * tambahan bila tindak lanjut kosong).
 */
export function petakanKartuTahunan(
  inspeksi: ApiInspeksiApar[],
): Record<string, Record<string, GridKartuApar>> {
  const kartu: Record<string, Record<string, GridKartuApar>> = {};
  for (const insp of inspeksi) {
    const tahun = insp.period.slice(0, 4);
    const bulan = insp.period.slice(5, 7);
    if (!/^\d{4}$/.test(tahun) || !BULAN_KARTU.includes(bulan)) continue;
    const urai = uraiCatatanApar(insp.notes ?? '');
    const sel: SelKartuApar = {
      tanggal: insp.createdAt.slice(0, 10),
      kondisi: {
        safetyPin: tandaUntukStatus(insp.safetyPin),
        corong: tandaUntukStatus(insp.corong),
        segel: tandaUntukStatus(insp.segel),
        tekanan: tandaUntukStatus(insp.tekanan),
        tabung: tandaUntukStatus(insp.tabung),
        selang: tandaUntukStatus(insp.selang),
        katupTuas: tandaUntukStatus(insp.katupTuas),
      },
      tindakLanjut: urai.tindakLanjut || urai.tambahan,
    };
    const perTahun = kartu[insp.unitId] ?? {};
    const grid = perTahun[tahun] ?? gridKartuKosong();
    grid[bulan] = sel;
    perTahun[tahun] = grid;
    kartu[insp.unitId] = perTahun;
  }
  return kartu;
}

/**
 * Sisa hari menuju tanggal kedaluwarsa (negatif = sudah lewat).
 * `null` bila tanggal tidak dapat diurai.
 */
export function hariMenujuKedaluwarsa(expiredDate: string, kini = new Date()): number | null {
  const t = parseISO(expiredDate);
  if (!isValid(t)) return null;
  return differenceInCalendarDays(startOfDay(t), startOfDay(kini));
}

/**
 * Gabung daftar memakai koma + `dan` sebelum butir terakhir, gaya dokumen:
 * `[]` → `–`, satu butir apa adanya, dua butir `A dan B`, sisanya
 * `A, B, dan C`.
 */
export function formatNoList(butir: string[]): string {
  if (butir.length === 0) return '–';
  if (butir.length === 1) return butir[0];
  if (butir.length === 2) return `${butir[0]} dan ${butir[1]}`;
  return `${butir.slice(0, -1).join(', ')}, dan ${butir[butir.length - 1]}`;
}
