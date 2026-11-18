import React from 'react';
import { Trash2 } from 'lucide-react';
import { ConfirmModal } from '@/components/ui';

export type CakupanHapusP3k = 'UNIT' | 'BULAN';

interface P3kInspectionFooterProps {
  adaUnit: boolean;
  adaInspeksi: boolean;
  menghapusBulan: boolean;
  menghapusUnit: boolean;
  menyimpan: boolean;
  onMintaKonfirmasi: (cakupan: CakupanHapusP3k) => void;
}

/** Kontrol bawah formulir: dua cakupan hapus (cermin Hydrant/APAR) + tombol Terbitkan. */
export const P3kInspectionFooter: React.FC<P3kInspectionFooterProps> = ({
  adaUnit,
  adaInspeksi,
  menghapusBulan,
  menghapusUnit,
  menyimpan,
  onMintaKonfirmasi,
}) => (
  <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between">
    <div className="flex items-center gap-4">
      {adaUnit && (
        <button
          type="button"
          onClick={() => onMintaKonfirmasi('UNIT')}
          disabled={menghapusBulan || menghapusUnit || menyimpan}
          className="inline-flex items-center gap-1.5 text-[11px] font-medium text-red-600 dark:text-red-400 hover:underline pressable cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:no-underline"
        >
          <Trash2 size={12} /> {menghapusUnit ? 'Menghapus…' : 'Hapus unit'}
        </button>
      )}
      {adaInspeksi && (
        <button
          type="button"
          onClick={() => onMintaKonfirmasi('BULAN')}
          disabled={menghapusBulan || menghapusUnit || menyimpan}
          className="text-[11px] font-medium text-[var(--muted)] hover:text-[var(--secondary)] hover:underline pressable cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:no-underline"
        >
          {menghapusBulan ? 'Mengosongkan…' : 'Kosongkan bulan ini'}
        </button>
      )}
    </div>

    <div className="flex items-center gap-2">
      <button
        type="submit"
        disabled={menyimpan || menghapusBulan || menghapusUnit}
        aria-busy={menyimpan}
        className="px-4 py-1.5 rounded-[4px] bg-[#2f80ed] hover:bg-[#2b77d4] text-white text-xs font-semibold shadow-xs cursor-pointer pressable disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {menyimpan ? 'Menerbitkan…' : 'Terbitkan'}
      </button>
    </div>
  </div>
);

interface P3kDeleteConfirmationProps {
  konfirmasi: CakupanHapusP3k | null;
  unitKode: string;
  monthLabel: string;
  onTutup: () => void;
  onKonfirmasi: (cakupan: CakupanHapusP3k) => void;
}

/** Konfirmasi hapus: dua cakupan terpisah dengan ketik HAPUS. */
export const P3kDeleteConfirmation: React.FC<P3kDeleteConfirmationProps> = ({
  konfirmasi,
  unitKode,
  monthLabel,
  onTutup,
  onKonfirmasi,
}) => (
  <ConfirmModal
    isOpen={konfirmasi !== null}
    title={konfirmasi === 'BULAN' ? 'Kosongkan Inspeksi Bulan Ini' : 'Hapus Kotak P3K'}
    message={
      konfirmasi === 'BULAN'
        ? `Rekaman inspeksi ${unitKode} (${monthLabel}) beserta seluruh butirnya akan dihapus. Kotak P3K tetap ada dan kembali “Belum Diperiksa”. Lanjutkan?`
        : `Kotak P3K ${unitKode} beserta seluruh rekaman inspeksi dan butirnya akan dihapus permanen. Lanjutkan?`
    }
    confirmLabel="Ya, hapus"
    accent="#eb5757"
    requireText="HAPUS"
    onClose={onTutup}
    onConfirm={() => {
      const mode = konfirmasi;
      onTutup();
      onKonfirmasi(mode ?? 'UNIT');
    }}
  />
);
