/** Safety Patrol findings — UI-only (Epic F). Single feed, newest first. */

export interface PatrolFinding {
  id: string;
  /** Uploaded preview (data URL) or '' for the grey placeholder. */
  photoUrl: string;
  caption: string;
  /** ISO date (yyyy-mm-dd) when the photo was taken. */
  tanggal: string;
}

/** Seed from the paper form: 19 Juni 2026, ITJ JPM Dukuh Atas. Photos stay placeholders. */
export const SEED_PATROL_FINDINGS: PatrolFinding[] = [
  { id: 'pf-1', photoUrl: '', caption: 'Isi Kotak P3K sudah sesuai standar', tanggal: '2026-06-19' },
  { id: 'pf-2', photoUrl: '', caption: 'Sudah diterapkan 5R', tanggal: '2026-06-19' },
  { id: 'pf-3', photoUrl: '', caption: 'APAR terhalang Tenant', tanggal: '2026-06-19' },
  { id: 'pf-4', photoUrl: '', caption: 'Terdapat limbah kemasan B3', tanggal: '2026-06-19' },
  {
    id: 'pf-5',
    photoUrl: '',
    caption: 'Tidak ada penyambung antara Fire Hose dan Nozzle',
    tanggal: '2026-06-19',
  },
  {
    id: 'pf-6',
    photoUrl: '',
    caption: 'Box APAR tidak dapat menutup rapat',
    tanggal: '2026-06-19',
  },
  { id: 'pf-7', photoUrl: '', caption: 'Tuas APAR kendur', tanggal: '2026-06-19' },
  {
    id: 'pf-8',
    photoUrl: '',
    caption: 'Kabel Dispenser Air Isi Ulang gratis tidak merekat pada lantai',
    tanggal: '2026-06-19',
  },
];
