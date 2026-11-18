import type { KategoriEkspor } from '@/services/api/klien';

/** Nama ikon kategori; shell memetakannya ke komponen lucide. */
export type IkonKategoriInspeksi = 'Flame' | 'ShieldCheck' | 'BriefcaseMedical' | 'Camera';

/**
 * Model domain kategori inspeksi: satu sumber untuk kepala halaman.
 *
 * Menggantikan asumsi bentuk yang tersebar di tiap laman (remah, judul,
 * deskripsi, label tambah, kategori ekspor, ikon, aksen).
 */
export interface InspectionCategoryConfig {
  kunci: 'hydrant' | 'apar' | 'p3k' | 'patroli' | 'patroli-kebersihan';
  aksen: string;
  judul: string;
  deskripsi: string;
  remahKategori: string;
  /** Opsional: P3K tidak punya tombol tambah sehingga omit saja. */
  labelTambah?: string;
  kategoriEkspor: KategoriEkspor;
  ikon: IkonKategoriInspeksi;
}

export const KONFIG_HYDRANT: InspectionCategoryConfig = {
  kunci: 'hydrant',
  aksen: '#eb5757',
  judul: 'Laporan Inspeksi Hydrant',
  deskripsi: 'Monitoring progres pemeriksaan fisik 6 komponen hydrant gedung per unit',
  remahKategori: 'Inspeksi Hydrant',
  labelTambah: 'Tambah Zona & Unit',
  kategoriEkspor: 'hydrant-monthly',
  ikon: 'Flame',
};

export const KONFIG_APAR: InspectionCategoryConfig = {
  kunci: 'apar',
  aksen: '#f2994a',
  judul: 'Laporan Inspeksi APAR',
  deskripsi: 'Monitoring progres pemeriksaan fisik 7 komponen APAR gedung per unit',
  remahKategori: 'Inspeksi APAR',
  labelTambah: 'Tambah Zona & Unit',
  kategoriEkspor: 'apar-monthly',
  ikon: 'ShieldCheck',
};

export const KONFIG_P3K: InspectionCategoryConfig = {
  kunci: 'p3k',
  aksen: '#27ae60',
  judul: 'Laporan Inspeksi P3K',
  deskripsi: 'Monitoring kelengkapan 21 item standar kotak P3K gedung per bulan',
  remahKategori: 'Inspeksi P3K',
  kategoriEkspor: 'p3k-yearly',
  ikon: 'BriefcaseMedical',
};

export const KONFIG_PATROLI: InspectionCategoryConfig = {
  kunci: 'patroli',
  aksen: '#2f80ed',
  judul: 'Laporan Patroli K3',
  deskripsi: 'Dokumentasi foto temuan patroli keselamatan gedung',
  remahKategori: 'Patroli K3',
  labelTambah: 'Tambah Foto',
  kategoriEkspor: 'patrol-report',
  ikon: 'Camera',
};

export const KONFIG_PATROLI_KEBERSIHAN: InspectionCategoryConfig = {
  ...KONFIG_PATROLI,
  kunci: 'patroli-kebersihan',
  judul: 'Safety Patrol Kebersihan',
  deskripsi: 'Dokumentasi foto temuan patroli kebersihan lingkungan kerja',
};
