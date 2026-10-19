import type { AparComponentStatus, OverallStatus } from '../../types/domain';
import type { AparUnitItem } from '../../types/hse';
import type { AparDraft } from './AparInspectionTypes';

export const COMPONENT_FIELDS: { key: keyof AparDraft & string; label: string; hint: string }[] = [
  { key: 'safetyPin', label: '1. Safety Pin', hint: 'Pin Pengaman' },
  { key: 'corong', label: '2. Corong', hint: 'Mulut Semprot' },
  { key: 'segel', label: '3. Segel', hint: 'Segel Pabrik' },
  { key: 'tekanan', label: '4. Tekanan', hint: 'Jarum Manometer' },
  { key: 'tabung', label: '5. Tabung', hint: 'Bodi & Karat' },
  { key: 'selang', label: '6. Selang', hint: 'Fleksibilitas' },
  { key: 'katupTuas', label: '7. Katup/Tuas', hint: 'Tuas Penekan' },
];

export const OPTIONS: AparComponentStatus[] = ['BAIK', 'TIDAK_BAIK', 'NA'];

/** Label tanpa nomor urut untuk baris catatan gabungan. */
const LABEL_KOMPONEN_APAR: Record<string, string> = Object.fromEntries(
  COMPONENT_FIELDS.map((f) => [f.key, f.label.replace(/^\d+\.\s*/, '')]),
);

/** Gabungkan komentar per komponen + catatan tambahan jadi satu teks. */
export function susunCatatanApar(
  values: Record<string, string>,
  catatanKomponen: Record<string, string>,
  tambahan: string,
): string {
  const baris: string[] = [];
  for (const [key, label] of Object.entries(LABEL_KOMPONEN_APAR)) {
    if (values[key] && values[key] !== 'BAIK' && catatanKomponen[key]?.trim()) {
      baris.push(`${label}: ${catatanKomponen[key].trim()}`);
    }
  }
  if (tambahan.trim()) baris.push(`Catatan: ${tambahan.trim()}`);
  return baris.join('\n');
}

/** Susun draf dari state formulir (komponen kosong jatuh ke `BAIK`). */
export function buatDrafApar(
  unit: AparUnitItem,
  values: Record<string, AparComponentStatus>,
  catatanKomponen: Record<string, string>,
  notes: string,
  tindakLanjut: string,
  overallStatus: OverallStatus,
): AparDraft {
  return {
    ...unit.draftDetails,
    safetyPin: values.safetyPin ?? 'BAIK',
    corong: values.corong ?? 'BAIK',
    segel: values.segel ?? 'BAIK',
    tekanan: values.tekanan ?? 'BAIK',
    tabung: values.tabung ?? 'BAIK',
    selang: values.selang ?? 'BAIK',
    katupTuas: values.katupTuas ?? 'BAIK',
    notes: susunCatatanApar(values, catatanKomponen, notes),
    tindakLanjut,
    overallStatus,
  };
}

/** Keadaan awal formulir dari draf tersimpan, fallback ke laporan selesai (draf menang). */
export function inisialisasiDrafApar(unit: AparUnitItem): {
  values: Record<string, AparComponentStatus>;
  catatanKomponen: Record<string, string>;
  notes: string;
  tindakLanjut: string;
  overallStatus: OverallStatus | null;
} {
  const draft = unit.draftDetails;
  const rep = unit.completedReport?.aparDetails;
  const pick = (k: string): AparComponentStatus =>
    (draft?.[k as keyof AparDraft] as AparComponentStatus | undefined) ??
    (rep?.[k as keyof typeof rep] as AparComponentStatus | undefined) ??
    'BAIK';
  const values: Record<string, AparComponentStatus> = {};
  for (const f of COMPONENT_FIELDS) values[f.key] = pick(f.key);
  // Teks catatan menyimpan gabungan; urai balik per komponen + tambahan.
  const catatanMentah = (draft?.notes as string | undefined) ?? unit.completedReport?.summaryNotes ?? '';
  const urai = uraiCatatanApar(catatanMentah);
  const savedOverall =
    (draft?.overallStatus as OverallStatus | undefined) ?? unit.completedReport?.overallStatus;
  return {
    values,
    catatanKomponen: urai.catatanKomponen,
    notes: urai.tambahan,
    tindakLanjut: (draft?.tindakLanjut as string | undefined) ?? '',
    overallStatus: savedOverall ?? null,
  };
}

/** Pecahkan teks gabungan balik ke per komponen + tambahan. */
export function uraiCatatanApar(penuh: string): {
  catatanKomponen: Record<string, string>;
  tambahan: string;
} {
  const catatanKomponen: Record<string, string> = {};
  let tambahan = '';
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
    else tambahan = tambahan ? `${tambahan}\n${baris}` : baris;
  }
  return { catatanKomponen, tambahan };
}
