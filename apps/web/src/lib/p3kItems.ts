/**
 * Standard 21 P3K Box Items (Tipe A, B, C)
 * Sesuai Permenakertrans No. PER.15/MEN/VIII/2008:
 * - Kotak A (Untuk 25 pekerja/buruh atau kurang) -> Lantai 2
 * - Kotak B (Untuk 50 pekerja/buruh atau kurang) -> Lantai 3
 * - Kotak C (Untuk 100 pekerja/buruh atau kurang)
 */

export type P3kBoxType = 'A' | 'B' | 'C';

export interface P3kBoxTypeInfo {
  type: P3kBoxType;
  label: string;
  shortLabel: string;
  description: string;
  floorDefault: string;
}

export const P3K_BOX_TYPES: Record<P3kBoxType, P3kBoxTypeInfo> = {
  A: {
    type: 'A',
    label: 'Kotak A (≤ 25 pekerja/buruh)',
    shortLabel: 'Tipe A',
    description: 'Untuk 25 pekerja/buruh atau kurang',
    floorDefault: 'Lantai 2 (Kotak Tipe A)',
  },
  B: {
    type: 'B',
    label: 'Kotak B (≤ 50 pekerja/buruh)',
    shortLabel: 'Tipe B',
    description: 'Untuk 50 pekerja/buruh atau kurang',
    floorDefault: 'Lantai 3 (Kotak Tipe B)',
  },
  C: {
    type: 'C',
    label: 'Kotak C (≤ 100 pekerja/buruh)',
    shortLabel: 'Tipe C',
    description: 'Untuk 100 pekerja/buruh atau kurang',
    floorDefault: 'Kotak Tipe C',
  },
};

export interface StandardP3kItemDefinition {
  id: number;
  name: string;
  displayName: string;
  aliases?: string[];
  standardQty: number;
  qtyByType: Record<P3kBoxType, number>;
  unit: string;
}

export const STANDARD_P3K_ITEMS: StandardP3kItemDefinition[] = [
  {
    id: 1,
    name: 'Kasa steril terbungkus',
    displayName: 'Kasa steril terbungkus',
    standardQty: 20,
    qtyByType: { A: 20, B: 40, C: 40 },
    unit: 'lembar',
  },
  {
    id: 2,
    name: 'Perban (lebar 5 cm)',
    displayName: 'Perban (lebar 5 Cm)',
    standardQty: 2,
    qtyByType: { A: 2, B: 4, C: 6 },
    unit: 'rol',
  },
  {
    id: 3,
    name: 'Perban (lebar 10 cm)',
    displayName: 'Perban (lebar 10 Cm)',
    standardQty: 2,
    qtyByType: { A: 2, B: 4, C: 6 },
    unit: 'rol',
  },
  {
    id: 4,
    name: 'Plester (lebar 1,25 cm)',
    displayName: 'Plester (lebar 1,25 Cm)',
    standardQty: 2,
    qtyByType: { A: 2, B: 4, C: 6 },
    unit: 'rol',
  },
  {
    id: 5,
    name: 'Plester cepat',
    displayName: 'Plester Cepat',
    standardQty: 10,
    qtyByType: { A: 10, B: 15, C: 20 },
    unit: 'lembar',
  },
  {
    id: 6,
    name: 'Kapas (25 gram)',
    displayName: 'Kapas (25 gram)',
    standardQty: 1,
    qtyByType: { A: 1, B: 2, C: 3 },
    unit: 'bungkus',
  },
  {
    id: 7,
    name: 'Kain segitiga/mittela',
    displayName: 'Kain segitiga/mittela',
    standardQty: 2,
    qtyByType: { A: 2, B: 4, C: 6 },
    unit: 'lembar',
  },
  {
    id: 8,
    name: 'Gunting',
    displayName: 'Gunting',
    standardQty: 1,
    qtyByType: { A: 1, B: 1, C: 1 },
    unit: 'buah',
  },
  {
    id: 9,
    name: 'Peniti',
    displayName: 'Peniti',
    standardQty: 12,
    qtyByType: { A: 12, B: 12, C: 12 },
    unit: 'buah',
  },
  {
    id: 10,
    name: 'Sarung tangan sekali pakai',
    displayName: 'Sarung tangan sekali pakai (pasangan)',
    aliases: ['Sarung tangan sekali pakai (pasangan)'],
    standardQty: 2,
    qtyByType: { A: 2, B: 3, C: 4 },
    unit: 'pasang',
  },
  {
    id: 11,
    name: 'Masker',
    displayName: 'Masker',
    standardQty: 2,
    qtyByType: { A: 2, B: 4, C: 6 },
    unit: 'buah',
  },
  {
    id: 12,
    name: 'Pinset',
    displayName: 'Pinset',
    standardQty: 1,
    qtyByType: { A: 1, B: 1, C: 1 },
    unit: 'buah',
  },
  {
    id: 13,
    name: 'Lampu senter',
    displayName: 'Lampu senter',
    standardQty: 1,
    qtyByType: { A: 1, B: 1, C: 1 },
    unit: 'buah',
  },
  {
    id: 14,
    name: 'Gelas untuk cuci mata',
    displayName: 'Gelas untuk cuci mata',
    standardQty: 1,
    qtyByType: { A: 1, B: 2, C: 3 },
    unit: 'buah',
  },
  {
    id: 15,
    name: 'Kantong plastik bersih',
    displayName: 'Kantong plastik bersih',
    standardQty: 1,
    qtyByType: { A: 1, B: 1, C: 1 },
    unit: 'lembar',
  },
  {
    id: 16,
    name: 'NaCl',
    displayName: 'Aquades (100 ml lar. Saline)',
    aliases: ['Aquades (100 ml lar. Saline)', 'Aquades (100 ml lar.Saline)'],
    standardQty: 1,
    qtyByType: { A: 1, B: 1, C: 1 },
    unit: 'botol',
  },
  {
    id: 17,
    name: 'Povidone',
    displayName: 'Povidon Iodin (60ml)',
    aliases: ['Povidon Iodin (60ml)', 'Povidone Iodine (60ml)'],
    standardQty: 1,
    qtyByType: { A: 1, B: 1, C: 1 },
    unit: 'botol',
  },
  {
    id: 18,
    name: 'Alkohol 70%',
    displayName: 'Alkohol 70 %',
    aliases: ['Alkohol 70 %'],
    standardQty: 1,
    qtyByType: { A: 1, B: 1, C: 1 },
    unit: 'botol',
  },
  {
    id: 19,
    name: 'Buku panduan P3K',
    displayName: 'Buku panduan P3K di tempat kerja',
    aliases: ['Buku panduan P3K di tempat kerja'],
    standardQty: 1,
    qtyByType: { A: 1, B: 1, C: 1 },
    unit: 'buku',
  },
  {
    id: 20,
    name: 'Buku catatan',
    displayName: 'Buku catatan',
    standardQty: 1,
    qtyByType: { A: 1, B: 1, C: 1 },
    unit: 'buku',
  },
  {
    id: 21,
    name: 'Daftar Isi Kotak',
    displayName: 'Daftar isi kotak',
    aliases: ['Daftar isi kotak'],
    standardQty: 1,
    qtyByType: { A: 1, B: 1, C: 1 },
    unit: 'lembar',
  },
];

/** Deteksi tipe kotak P3K (A, B, atau C) dari nama kotak/lokasi. */
export function detectP3kBoxType(boxName?: string | null): P3kBoxType {
  const raw = (boxName ?? '').toUpperCase();
  if (/\b(TIPE\s*C|KOTAK\s*C)\b/.test(raw)) return 'C';
  if (/\b(TIPE\s*B|KOTAK\s*B|LANTAI\s*3|LT\.?\s*3)\b/.test(raw)) return 'B';
  return 'A';
}

/** Ambil daftar 21 item standar dengan standardQty disesuaikan untuk Tipe A, B, atau C. */
export function getStandardP3kItemsForType(
  boxType: P3kBoxType = 'A',
): StandardP3kItemDefinition[] {
  return STANDARD_P3K_ITEMS.map((item) => ({
    ...item,
    standardQty: item.qtyByType[boxType] ?? item.standardQty,
  }));
}

/** Cocokkan nama item dari database ke definisi katalog 21 item. */
export function matchP3kCatalogItem(
  itemName: string,
): StandardP3kItemDefinition | undefined {
  const norm = itemName.trim().toLowerCase().replace(/\.$/, '');
  return STANDARD_P3K_ITEMS.find((s) => {
    if (s.name.toLowerCase().replace(/\.$/, '') === norm) return true;
    if (s.displayName && s.displayName.toLowerCase().replace(/\.$/, '') === norm) return true;
    return (s.aliases ?? []).some((a) => a.toLowerCase().replace(/\.$/, '') === norm);
  });
}
