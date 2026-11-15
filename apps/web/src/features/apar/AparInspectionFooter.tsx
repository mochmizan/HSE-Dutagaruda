import React from 'react';
import { Trash2 } from 'lucide-react';
import { ConfirmModal } from '@/components/ui';

export type CakupanHapus = 'UNIT' | 'BULAN';

interface AparInspectionFooterProps {
  adaUnit: boolean;
  adaInspeksi: boolean;
  menghapusBulan: boolean;
  menghapusUnit: boolean;
  terbit: boolean;
  menerbitkan: boolean;
  membatalkanTerbit: boolean;
  idRekam: string | null;
  onMintaKonfirmasi: (cakupan: CakupanHapus) => void;
  onBatalkanTerbit: () => void;
}

/** Kontrol bawah formulir: dua cakupan hapus + tombol Terbitkan/Edit. */
export const AparInspectionFooter: React.FC<AparInspectionFooterProps> = ({
  adaUnit,
  adaInspeksi,
  menghapusBulan,
  menghapusUnit,
  terbit,
  menerbitkan,
  membatalkanTerbit,
  idRekam,
  onMintaKonfirmasi,
  onBatalkanTerbit,
}) => (
  /* Footer Controls */
  <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between">
    <div className="flex items-center gap-4">
      {/* Dua cakupan hapus, dua label tetap — bukan satu tombol yang
          artinya bergeser menurut ada/tidaknya rekam bulan. Baris tabel
          adalah UNIT; rekam inspeksi hanya anaknya per bulan. */}
      {adaUnit && (
        <button
          type="button"
          onClick={() => onMintaKonfirmasi('UNIT')}
          disabled={menghapusBulan || menghapusUnit}
          className="inline-flex items-center gap-1.5 text-[11px] font-medium text-red-600 dark:text-red-400 hover:underline pressable cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:no-underline"
        >
          <Trash2 size={12} /> {menghapusUnit ? 'Menghapus…' : 'Hapus unit'}
        </button>
      )}
      {adaInspeksi && (
        <button
          type="button"
          onClick={() => onMintaKonfirmasi('BULAN')}
          disabled={menghapusBulan || menghapusUnit}
          className="text-[11px] font-medium text-[var(--muted)] hover:text-[var(--secondary)] hover:underline pressable cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:no-underline"
        >
          {menghapusBulan ? 'Mengosongkan…' : 'Kosongkan bulan ini'}
        </button>
      )}
    </div>

    <div className="flex items-center gap-2">
      {terbit ? (
        <button
          type="button"
          disabled={membatalkanTerbit || !idRekam}
          aria-busy={membatalkanTerbit}
          onClick={onBatalkanTerbit}
          className="px-4 py-1.5 rounded-[4px] border border-[#2f80ed]/40 bg-[#2f80ed]/10 text-[#2f80ed] hover:bg-[#2f80ed]/20 text-xs font-semibold shadow-xs cursor-pointer pressable disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {membatalkanTerbit ? 'Membatalkan…' : 'Edit'}
        </button>
      ) : (
        <button
          type="submit"
          disabled={menerbitkan}
          aria-busy={menerbitkan}
          className="px-4 py-1.5 rounded-[4px] bg-[#2f80ed] hover:bg-[#2b77d4] text-white text-xs font-semibold shadow-xs cursor-pointer pressable disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {menerbitkan ? 'Menerbitkan…' : 'Terbitkan'}
        </button>
      )}
    </div>
  </div>
);

interface AparDeleteConfirmationProps {
  konfirmasi: CakupanHapus | null;
  unitKode: string;
  onTutup: () => void;
  onKonfirmasi: (cakupan: CakupanHapus) => void;
}

/** Konfirmasi hapus: dua cakupan terpisah, label menyebut akibatnya. */
export const AparDeleteConfirmation: React.FC<AparDeleteConfirmationProps> = ({
  konfirmasi,
  unitKode,
  onTutup,
  onKonfirmasi,
}) => (
  <ConfirmModal
    isOpen={konfirmasi !== null}
    title={konfirmasi === 'BULAN' ? 'Kosongkan Inspeksi Bulan Ini' : 'Hapus Unit'}
    message={
      konfirmasi === 'BULAN'
        ? `Rekaman inspeksi APAR ${unitKode} bulan ini beserta seluruh fotonya akan dihapus. Unitnya tetap ada dan kembali “Belum Dimulai”. Lanjutkan?`
        : `Unit APAR ${unitKode} beserta seluruh rekaman inspeksi dan fotonya akan dihapus permanen. Lanjutkan?`
    }
    confirmLabel="Ya, hapus"
    accent="#f2994a"
    onClose={onTutup}
    onConfirm={() => {
      const mode = konfirmasi;
      onTutup();
      // Cermin perilaku lama: `null` (tak mungkin, modal hanya tampil saat
      // terbuka) jatuh ke cakupan UNIT, bukan BULAN.
      onKonfirmasi(mode ?? 'UNIT');
    }}
  />
);
