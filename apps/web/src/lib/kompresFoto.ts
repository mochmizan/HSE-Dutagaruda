/**
 * Kompresi foto sisi klien sebelum unggah.
 *
 * Jalur unggah (Vercel → tunnel → Caddy → API → Garage) lambat untuk foto
 * kamera ponsel (3–8 MB); API tetap menerima JPEG/PNG/WebP ≤ 8 MB. Modul ini
 * mengecilkan berkas besar menjadi JPEG sisi-maks 1920 px sehingga unggahan
 * turun ke ratusan KB tanpa migrasi DB dan tanpa perubahan kontrak API.
 * Fail-open: bila decode/encode gagal, berkas asli dipakai (perilaku lama).
 */

/** Sisi terpanjang maksimum hasil kompresi (cukup untuk bukti inspeksi). */
export const SISI_MAKS_FOTO = 1920;
/** Kualitas JPEG hasil kompresi. */
export const KUALITAS_FOTO = 0.82;
/** Berkas ≤ batas ini diunggah apa adanya (sudah cukup kecil). */
export const BATAS_LEWATI_BYTE = 600 * 1024;

const TIPE_KOMPRES = new Set(['image/jpeg', 'image/png', 'image/webp']);

/**
 * Dimensi baru dengan sisi terpanjang ≤ `maks`, menjaga rasio aspek.
 * Murni (tanpa DOM) agar bisa diuji unit.
 */
export function hitungDimensiBaru(
  lebar: number,
  tinggi: number,
  maks: number = SISI_MAKS_FOTO,
): [number, number] {
  if (!(lebar > 0) || !(tinggi > 0) || !(maks > 0)) return [lebar, tinggi];
  const sisi = Math.max(lebar, tinggi);
  if (sisi <= maks) return [lebar, tinggi];
  const skala = maks / sisi;
  return [Math.max(1, Math.round(lebar * skala)), Math.max(1, Math.round(tinggi * skala))];
}

/** Kecilkan `file` bila besar; kembalikan berkas asli bila tak perlu/gagal. */
export async function kompresFoto(file: File): Promise<File> {
  try {
    if (!TIPE_KOMPRES.has(file.type)) return file;
    if (file.size <= BATAS_LEWATI_BYTE) return file;
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
    try {
      const [w, h] = hitungDimensiBaru(bmp.width, bmp.height);
      if (w === bmp.width && h === bmp.height) return file;
      const kanvas = document.createElement('canvas');
      kanvas.width = w;
      kanvas.height = h;
      const ctx = kanvas.getContext('2d');
      if (!ctx) return file;
      ctx.drawImage(bmp, 0, 0, w, h);
      const blob = await new Promise<Blob | null>((selesai) =>
        kanvas.toBlob(selesai, 'image/jpeg', KUALITAS_FOTO),
      );
      if (!blob || blob.size >= file.size) return file;
      const nama = file.name.replace(/\.(png|webp|jpe?g)$/i, '') || 'foto';
      return new File([blob], `${nama}.jpg`, { type: 'image/jpeg' });
    } finally {
      bmp.close();
    }
  } catch {
    return file;
  }
}
