import React from 'react';
import { Trash2 } from 'lucide-react';
import { ConfirmModal } from '@/components/ui';

interface P3kInspectionFooterProps {
  menghapusBulan: boolean;
  menyimpan: boolean;
  onMintaKonfirmasi: () => void;
}

/** Kontrol bawah formulir: kiri Hapus Bulan Ini selalu tampil, kanan Terbitkan selalu submit. */
export const P3kInspectionFooter: React.FC<P3kInspectionFooterProps> = ({
  menghapusBulan,
  menyimpan,
  onMintaKonfirmasi,
}) => (
  /* Footer Controls */
  <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between">
    <div>
      <button
        type="button"
        onClick={onMintaKonfirmasi}
        disabled={menghapusBulan}
        className="inline-flex items-center gap-1.5 text-[11px] font-medium text-red-600 dark:text-red-400 hover:underline pressable cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:no-underline"
      >
        <Trash2 size={12} /> {menghapusBulan ? 'Menghapus…' : 'Hapus Bulan Ini'}
      </button>
    </div>

    <div className="flex items-center gap-2">
      <button
        type="submit"
        disabled={menyimpan}
        aria-busy={menyimpan}
        className="px-4 py-1.5 rounded-[4px] bg-[#2f80ed] hover:bg-[#2b77d4] text-white text-xs font-semibold shadow-xs cursor-pointer pressable disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {menyimpan ? 'Menerbitkan…' : 'Terbitkan'}
      </button>
    </div>
  </div>
);

interface P3kDeleteConfirmationProps {
  terbuka: boolean;
  monthLabel: string;
  onTutup: () => void;
  onKonfirmasi: () => void;
}

/** Konfirmasi hapus: lapisan portal di atas modal (Esc hanya menutup ini). */
export const P3kDeleteConfirmation: React.FC<P3kDeleteConfirmationProps> = ({
  terbuka,
  monthLabel,
  onTutup,
  onKonfirmasi,
}) => (
  <ConfirmModal
    isOpen={terbuka}
    title="Hapus Bulan Ini"
    message={`Rekaman inspeksi P3K bulan ${monthLabel} beserta seluruh butirnya akan dihapus. Sel bulan itu kembali kosong. Lanjutkan?`}
    confirmLabel="Ya, hapus"
    accent="#eb5757"
    onClose={onTutup}
    onConfirm={onKonfirmasi}
  />
);
