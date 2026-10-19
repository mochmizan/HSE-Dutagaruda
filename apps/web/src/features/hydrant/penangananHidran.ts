import type { Dispatch, SetStateAction } from 'react';
import type { InspectionReport, OverallStatus } from '../../types/hse';
import type { KunciKomponenHidran } from './komponenHidran';

/** Setter catatan per komponen: satu medan teks, sisanya tetap. */
export function buatPengubahCatatan(
  set: Dispatch<SetStateAction<Record<string, string>>>,
): (key: KunciKomponenHidran, value: string) => void {
  return (key, value) => set((prev) => ({ ...prev, [key]: value }));
}

/** Ubah status akhir = tindakan manual petugas; matikan saran otomatis. */
export function buatPengubahStatusAkhir(
  setStatus: (value: OverallStatus) => void,
  setOverridden: (value: boolean) => void,
): (value: OverallStatus) => void {
  return (value) => {
    setStatus(value);
    setOverridden(true);
  };
}

/** Satu konfirmasi, dua cakupan: UNIT menghapus baris, BULAN mengosongkan rekam. */
export function buatKonfirmasiHapus(
  onHapusBulan?: () => void,
  onHapusUnit?: () => void,
): (cakupan: 'UNIT' | 'BULAN') => void {
  return (cakupan) => {
    if (cakupan === 'BULAN') onHapusBulan?.();
    else onHapusUnit?.();
  };
}

/** Terbitkan: tulis ke API dulu; form tetap terbuka bila mutasi melaporkan galat. */
export async function terbitkanLaporan(
  report: InspectionReport,
  kirim: (report: InspectionReport) => void | Promise<void>,
  setSibuk: (sibuk: boolean) => void,
): Promise<void> {
  setSibuk(true);
  try {
    await kirim(report);
  } catch {
    // onError mutasi sudah melaporkan pesannya; form tetap terbuka.
  } finally {
    setSibuk(false);
  }
}
