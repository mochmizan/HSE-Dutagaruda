/**
 * Susun ulang urutan unit setelah satu baris dipindah naik/turun.
 *
 * `semua` adalah seluruh unit lokasi (yang wajib dikirim ke server), sedangkan
 * `tampil` adalah baris yang sedang terlihat setelah tab/zona/pencarian
 * diterapkan. Tetangga yang ditukar diambil dari `tampil`, tetapi posisi
 * disisipkan ke dalam `semua` — jadi memindah baris saat tabel tersaring tetap
 * menghasilkan daftar lengkap yang sah, bukan daftar sebagian yang ditolak
 * server.
 *
 * Mengembalikan `null` bila tidak ada yang berubah (baris sudah di ujung).
 */
export function susunUrutanBaru(
  semua: string[],
  tampil: string[],
  unitId: string,
  arah: -1 | 1,
): string[] | null {
  const iTampil = tampil.indexOf(unitId);
  if (iTampil === -1) return null;

  const tetangga = tampil[iTampil + arah];
  if (!tetangga) return null;

  const tanpa = semua.filter((id) => id !== unitId);
  const iTetangga = tanpa.indexOf(tetangga);
  if (iTetangga === -1) return null;

  // Naik: sisip sebelum tetangga. Turun: sisip sesudahnya.
  const posisi = arah === -1 ? iTetangga : iTetangga + 1;
  tanpa.splice(posisi, 0, unitId);
  return tanpa;
}
