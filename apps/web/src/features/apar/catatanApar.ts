/** Label tampilan tiap komponen untuk baris catatan gabungan. */
export const LABEL_KOMPONEN_APAR: Record<string, string> = {
  safetyPin: 'Safety Pin',
  corong: 'Corong',
  segel: 'Segel',
  tekanan: 'Tekanan',
  tabung: 'Tabung',
  selang: 'Selang',
  katupTuas: 'Katup/Tuas',
};

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
    for (const [key, label] of Object.entries(LABEL_KOMPONEN_APAR)) {
      if (baris.startsWith(`${label}:`)) {
        catatanKomponen[key] = baris.slice(label.length + 1).trim();
        cocok = true;
        break;
      }
    }
    if (cocok) continue;
    if (baris.startsWith('Catatan:')) tambahan = baris.slice(8).trim();
    else if (baris.startsWith('Tindak Lanjut:')) tindakLanjut = baris.slice(14).trim();
    else tambahan = tambahan ? `${tambahan}\n${baris}` : baris;
  }
  return { catatanKomponen, tambahan, tindakLanjut };
}
