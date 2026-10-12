export interface StandardP3kItemDefinition {
  id: number;
  name: string;
  standardQty: number;
  unit: string;
}

export const STANDARD_P3K_ITEMS: StandardP3kItemDefinition[] = [
  { id: 1, name: "Kasa steril terbungkus", standardQty: 20, unit: "lembar" },
  { id: 2, name: "Perban (lebar 5 cm)", standardQty: 2, unit: "rol" },
  { id: 3, name: "Perban (lebar 10 cm)", standardQty: 2, unit: "rol" },
  { id: 4, name: "Plester (lebar 1,25 cm)", standardQty: 2, unit: "rol" },
  { id: 5, name: "Plester cepat", standardQty: 10, unit: "lembar" },
  { id: 6, name: "Kapas (25 gram)", standardQty: 1, unit: "bungkus" },
  { id: 7, name: "Kain segitiga/mittela", standardQty: 2, unit: "lembar" },
  { id: 8, name: "Gunting", standardQty: 1, unit: "buah" },
  { id: 9, name: "Peniti", standardQty: 12, unit: "buah" },
  { id: 10, name: "Sarung tangan sekali pakai", standardQty: 2, unit: "pasang" },
  { id: 11, name: "Masker", standardQty: 2, unit: "buah" },
  { id: 12, name: "Pinset", standardQty: 1, unit: "buah" },
  { id: 13, name: "Lampu senter", standardQty: 1, unit: "buah" },
  { id: 14, name: "Gelas untuk cuci mata", standardQty: 1, unit: "buah" },
  { id: 15, name: "Kantong plastik bersih", standardQty: 1, unit: "lembar" },
  { id: 16, name: "NaCl", standardQty: 1, unit: "botol" },
  { id: 17, name: "Povidone", standardQty: 1, unit: "botol" },
  { id: 18, name: "Alkohol 70%", standardQty: 1, unit: "botol" },
  { id: 19, name: "Buku panduan P3K", standardQty: 1, unit: "buku" },
  { id: 20, name: "Buku catatan", standardQty: 1, unit: "buku" },
  { id: 21, name: "Daftar Isi Kotak", standardQty: 1, unit: "lembar" },
];
