import React, { useState } from 'react';
import { FileDown } from 'lucide-react';
import type { KategoriEkspor } from '@/services/api/klien';
import { jalankanEkspor, unduhBerkas, KATEGORI_EKSPOR_LABEL } from '@/services/api/queries';
import { ApiError } from '@/services/api/client';

/** Unduh PDF resmi via POST /api/export/:category/:refId (pdfJobs, v1 sinkron). */
interface UnduhPdfButtonProps {
  category: KategoriEkspor;
  /** ID baris rujukan (inspeksi/laporan); null = belum ada data (nonaktif). */
  refId: string | null;
  label?: string;
  /** Sufiks nama berkas, mis. periode. */
  namaBerkas?: string;
}

export const UnduhPdfButton: React.FC<UnduhPdfButtonProps> = ({
  category,
  refId,
  label,
  namaBerkas,
}) => {
  const [sibuk, setSibuk] = useState(false);
  const teks = label ?? 'Unduh PDF';

  const jalankan = async () => {
    if (!refId || sibuk) return;
    setSibuk(true);
    try {
      const url = await jalankanEkspor(category, refId);
      const nama = `${KATEGORI_EKSPOR_LABEL[category]}${namaBerkas ? ` ${namaBerkas}` : ''}.pdf`;
      unduhBerkas(url, nama);
    } catch (err) {
      const pesan =
        err instanceof ApiError
          ? ((err.data as { pesan?: string } | undefined)?.pesan ?? err.message)
          : 'Terjadi kesalahan tak terduga.';
      window.alert(pesan);
    } finally {
      setSibuk(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void jalankan()}
      disabled={!refId || sibuk}
      title={
        !refId
          ? 'Belum ada data untuk diekspor pada periode ini'
          : `Buat berkas PDF resmi (${KATEGORI_EKSPOR_LABEL[category]})`
      }
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] rounded-[4px] hover:bg-[var(--bg-hover)] shadow-2xs cursor-pointer pressable disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <FileDown size={14} />
      <span>{sibuk ? 'Menyiapkan…' : teks}</span>
    </button>
  );
};
