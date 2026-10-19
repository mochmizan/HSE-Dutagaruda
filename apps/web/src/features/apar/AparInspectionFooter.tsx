import React from 'react';
import { Trash2 } from 'lucide-react';
import { ConfirmModal } from '@/components/ui';
import type { ApiInspeksiApar } from '@/services/api/klien';

interface AparInspectionFooterProps {
  terbit: boolean;
  onSaveDraftClick: () => void;
  menyimpanDraf: boolean;
  onHapusUnit?: () => void;
  onHapusBulan?: () => void;
  inspeksi: ApiInspeksiApar | null;
  menghapusBulan: boolean;
  menghapusUnit: boolean;
  onMintaKonfirmasi: (mode: 'UNIT' | 'BULAN') => void;
  idRekam: string | null;
  membatalkanTerbit: boolean;
  onBatalkanTerbitClick: () => void;
  menerbitkan: boolean;
}

/** Kaki formulir: simpan draf, dua cakupan hapus, dan tombol terbit/edit. */
export const AparInspectionFooter: React.FC<AparInspectionFooterProps> = ({
  terbit,
  onSaveDraftClick,
  menyimpanDraf,
  onHapusUnit,
  onHapusBulan,
  inspeksi,
  menghapusBulan,
  menghapusUnit,
  onMintaKonfirmasi,
  idRekam,
  membatalkanTerbit,
  onBatalkanTerbitClick,
  menerbitkan,
}) => {
  return (
    <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between gap-2 flex-wrap">
      <div className="flex items-center gap-4 flex-wrap">
        {!terbit && (
          <button
            type="button"
            onClick={onSaveDraftClick}
            disabled={menyimpanDraf}
            className="px-3 py-1.5 rounded-[4px] border border-[var(--border-strong)] hover:bg-[var(--bg-hover)] text-xs font-semibold text-[var(--primary)] cursor-pointer pressable disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {menyimpanDraf ? 'Menyimpan…' : 'Simpan Draft'}
          </button>
        )}
        {/* Dua cakupan hapus, dua label tetap — bukan satu tombol yang
            artinya bergeser menurut ada/tidaknya rekam bulan. Baris tabel
            adalah UNIT; rekam inspeksi hanya anaknya per bulan. */}
        {onHapusUnit && (
          <button
            type="button"
            onClick={() => onMintaKonfirmasi('UNIT')}
            disabled={menghapusBulan || menghapusUnit}
            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-red-600 dark:text-red-400 hover:underline pressable cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:no-underline"
          >
            <Trash2 size={12} /> {menghapusUnit ? 'Menghapus…' : 'Hapus unit'}
          </button>
        )}
        {inspeksi && onHapusBulan && (
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
            onClick={onBatalkanTerbitClick}
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
};

interface AparDeleteConfirmProps {
  konfirmasi: 'UNIT' | 'BULAN' | null;
  kode: string;
  onClose: () => void;
  onHapusBulan?: () => void;
  onHapusUnit?: () => void;
}

/** Konfirmasi hapus: dua cakupan terpisah, label menyebut akibatnya. */
export const AparDeleteConfirm: React.FC<AparDeleteConfirmProps> = ({
  konfirmasi,
  kode,
  onClose,
  onHapusBulan,
  onHapusUnit,
}) => {
  return (
    <ConfirmModal
      isOpen={konfirmasi !== null}
      title={konfirmasi === 'BULAN' ? 'Kosongkan Inspeksi Bulan Ini' : 'Hapus Unit'}
      message={
        konfirmasi === 'BULAN'
          ? `Rekaman inspeksi APAR ${kode} bulan ini beserta seluruh fotonya akan dihapus. Unitnya tetap ada dan kembali “Belum Dimulai”. Lanjutkan?`
          : `Unit APAR ${kode} beserta seluruh rekaman inspeksi dan fotonya akan dihapus permanen. Lanjutkan?`
      }
      confirmLabel="Ya, hapus"
      accent="#f2994a"
      onClose={onClose}
      onConfirm={() => {
        const mode = konfirmasi;
        onClose();
        if (mode === 'BULAN') onHapusBulan?.();
        else onHapusUnit?.();
      }}
    />
  );
};
