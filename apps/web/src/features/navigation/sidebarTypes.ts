/** Tipe bersama untuk potongan-potongan bilah samping. */

/** Tampilan yang bisa dituju dari baris kategori lokasi. */
export type ViewHalaman = 'dashboard' | 'hydrant' | 'apar' | 'p3k' | 'patrol' | 'patrol-kebersihan';

/** Menu konteks klik-kanan untuk ganti nama / hapus proyek maupun lokasi. */
export interface MenuAksi {
  x: number;
  y: number;
  jenis: 'proyek' | 'lokasi';
  id: string;
  nama: string;
}

/** Jumlah unit/kotak terdaftar per lokasi untuk badge baris kategori. */
export interface HitungLokasi {
  hydrant: number;
  apar: number;
  p3k: number;
}
