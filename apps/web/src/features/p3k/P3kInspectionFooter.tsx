import React from 'react';
import { Trash2 } from 'lucide-react';
import { ConfirmModal } from '@/components/ui';

interface P3kInspectionFooterProps {
  adaInspeksi: boolean;
  menghapusBulan: boolean;
  terbit: boolean;
  menerbitkan: boolean;
  idRekam: string | null;
  onMintaKonfirmasi: () => void;
  onBatalkanTerbit: () => void;
}

/** Kontrol bawah formulir: hapus bulan ini + tombol Terbitkan/Edit. */
export const P3kInspectionFooter: React.FC<P3kInspectionFooterProps> = ({
  adaInspeksi,
  menghapusBulan,
  terbit,
  menerbitkan,
  idRekam,
  onMintaKonfirmasi,
  onBatalkanTerbit,
}) => (
  /* Footer Controls */
  <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between">
    <div>
      {adaInspeksi && (
        <button
          type="button"
          onClick={onMintaKonfirmasi}
          disabled={menghapusBulan}
          className="inline-flex items-center gap-1.5 text-[11px] font-medium text-red-600 dark:text-red-400 hover:underline pressable cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:no-underline"
        >
          <Trash2 size={12} /> {menghapusBulan ? 'Menghapus…' : 'Hapus Bulan Ini'}
        </button>
      )}
    </div>

    <div className="flex items-center gap-2">
      {terbit ? (
        <button
          type="button"
          disabled={!idRekam}
          onClick={onBatalkanTerbit}
          className="px-4 py-1.5 rounded-[4px] border border-[#2f80ed]/40 bg-[#2f80ed]/10 text-[#2f80ed] hover:bg-[#2f80ed]/20 text-xs font-semibold shadow-xs cursor-pointer pressable disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Edit
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
