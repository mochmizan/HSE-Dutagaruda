/**
 * Teks bantu kartu `Peta proyek`.
 *
 * Dipisah dari komponen supaya format ukuran bisa diuji tanpa merender React:
 * angka di UI memakai koma desimal Indonesia (`1,4 MB`), bukan titik.
 */

/** `842 KB` / `1,4 MB` / `< 1 KB` — satu desimal hanya untuk satuan MB. */
export function ukuranPeta(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 1024) return '< 1 KB';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  const mega = bytes / (1024 * 1024);
  return `${mega.toFixed(1).replace('.', ',')} MB`;
}
