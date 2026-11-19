/** Label tampilan tiap komponen untuk baris catatan gabungan. */
export const LABEL_KOMPONEN_APAR: Record<string, string> = {
  safetyPin: 'Safety Pin',
  corong: 'Fire Hose',
  segel: 'Segel',
  tekanan: 'Pressure Gauge',
  tabung: 'Tabung/Tube',
  selang: 'Nozzle',
  katupTuas: 'Katup/Tuas',
};

/** Alias label lama agar rekam yang sudah tersimpan tetap terurai dengan benar. */
const ALIAS_KOMPONEN_APAR: Record<string, string[]> = {
  safetyPin: ['Safety Pin'],
  corong: ['Fire Hose', 'Corong'],
  segel: ['Segel'],
  tekanan: ['Pressure Gauge', 'Tekanan'],
  tabung: ['Tabung/Tube', 'Tabung'],
  selang: ['Nozzle', 'Selang'],
  katupTuas: ['Katup/Tuas'],
};

const CATATAN_BAWAAN_APAR = 'Pemeriksaan 7 komponen selesai dan diverifikasi.';

/** Gabungkan komentar per komponen + catatan tambahan + tindak lanjut jadi satu teks. */
export function susunCatatanApar(
  statuses: Record<string, string>,
  catatanKomponen: Record<string, string>,
  tambahan: string,
  tindakLanjut: string,
): string {
  const baris: string[] = [];
  for (const [key, label] of Object.entries(LABEL_KOMPONEN_APAR)) {
    if (statuses[key] !== 'BAIK' && catatanKomponen[key]?.trim()) {
      baris.push(`${label}: ${catatanKomponen[key].trim()}`);
    }
  }
  if (tambahan.trim()) baris.push(`Catatan: ${tambahan.trim()}`);
  if (tindakLanjut.trim()) baris.push(`Tindak Lanjut: ${tindakLanjut.trim()}`);
  return baris.join('\n');
}

/** Pecahkan teks catatan gabungan balik ke per komponen + tambahan + tindak lanjut. */
export function uraiCatatanApar(penuh: string): {
  catatanKomponen: Record<string, string>;
  tambahan: string;
  tindakLanjut: string;
} {
  const catatanKomponen: Record<string, string> = {};
  let tambahan = '';
  let tindakLanjut = '';
  for (const raw of (penuh || '').split('\n')) {
    const baris = raw.trim();
    if (!baris) continue;
    let cocok = false;
    for (const [key, aliases] of Object.entries(ALIAS_KOMPONEN_APAR)) {
      for (const alias of aliases) {
        if (baris.startsWith(`${alias}:`)) {
          catatanKomponen[key] = baris.slice(alias.length + 1).trim();
          cocok = true;
          break;
        }
      }
      if (cocok) break;
    }
    if (cocok) continue;
    if (baris.startsWith('Catatan:')) tambahan = baris.slice(8).trim();
    else if (baris.startsWith('Tindak Lanjut:')) tindakLanjut = baris.slice(14).trim();
    else tambahan = tambahan ? `${tambahan}\n${baris}` : baris;
  }
  return { catatanKomponen, tambahan, tindakLanjut };
}

/** Susun daftar butir catatan (komponen + catatan + rekomendasi) untuk kolom Status Standar. */
export function daftarCatatanStatusApar(penuh?: string | null): string[] {
  if (!penuh?.trim()) return [];
  const parsed = uraiCatatanApar(penuh);
  const items: string[] = [];
  for (const [key, label] of Object.entries(LABEL_KOMPONEN_APAR)) {
    const val = parsed.catatanKomponen[key]?.trim();
    if (val) items.push(`${label}: ${val}`);
  }
  const tambahan = parsed.tambahan.trim();
  if (tambahan && tambahan !== CATATAN_BAWAAN_APAR) {
    items.push(`Catatan: ${tambahan}`);
  }
  const rekomendasi = parsed.tindakLanjut.trim();
  if (rekomendasi) {
    items.push(`Rekomendasi: ${rekomendasi}`);
  }
  return items;
}
