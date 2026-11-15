/** Kontrak data tambah foto Safety Patrol: foto wajib + caption + tanggal. */

/** Draf satu foto patroli dari form tambah. */
export interface DrafFotoPatroli {
  file: File;
  caption: string;
  /** ISO yyyy-mm-dd, bawaan hari ini. */
  tanggal: string;
}

/** Format yang diterima server dan batas ukuran unggahan. */
export const TIPE_FOTO_DITERIMA = ['image/jpeg', 'image/png', 'image/webp'];

export const TERIMA_FOTO_ACCEPT = 'image/jpeg,image/png,image/webp';

export const BATAS_FOTO_BYTE = 8 * 1024 * 1024;
