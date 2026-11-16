import React from 'react';
import { FileDown, Printer } from 'lucide-react';
import type { KategoriEkspor } from '@/services/api/klien';
import { KATEGORI_EKSPOR_LABEL } from '@/services/api/queries';

/**
 * Tombol Cetak / Simpan PDF resmi: membuka halaman prosedur cetak (`?cetak=...&autoprint=1`)
 * yang terisolasi dari mode gelap, bukan lagi memanggil layanan Gotenberg.
 */
interface UnduhPdfButtonProps {
  category: KategoriEkspor;
  /** ID baris rujukan (inspeksi/laporan); null = belum ada data (tetap dapat membuka pratinjau periode). */
  refId: string | null;
  label?: string;
  /** Sufiks nama berkas / periode (mis. YYYY-MM atau YYYY). */
  namaBerkas?: string;
  /** Unit ID/kode opsional untuk mode kartu APAR. */
  unitId?: string;
}

export const UnduhPdfButton: React.FC<UnduhPdfButtonProps> = ({
  category,
  label,
  namaBerkas,
  unitId,
}) => {
  const teks = label ?? 'Unduh PDF';

  const bukaHalamanProsedurCetak = () => {
    const params = new URLSearchParams({ autoprint: '1' });
    if (category === 'hydrant-monthly') {
      params.set('cetak', 'hydrant');
      params.set('mode', 'checklist');
      if (namaBerkas) params.set('bulan', namaBerkas);
    } else if (category === 'hydrant-laporan') {
      params.set('cetak', 'hydrant');
      params.set('mode', 'laporan');
      if (namaBerkas) params.set('bulan', namaBerkas);
    } else if (category === 'apar-monthly') {
      params.set('cetak', 'apar');
      params.set('mode', 'bulanan');
      if (namaBerkas) params.set('bulan', namaBerkas);
    } else if (category === 'apar-card') {
      params.set('cetak', 'apar');
      params.set('mode', 'kartu');
      if (namaBerkas) params.set('tahun', namaBerkas.slice(0, 4));
      if (unitId) params.set('unit', unitId);
    } else if (category === 'p3k-yearly') {
      params.set('cetak', 'p3k');
      if (namaBerkas) params.set('tahun', namaBerkas.slice(0, 4));
    } else if (category === 'patrol-report') {
      params.set('cetak', 'patrol');
      if (namaBerkas) params.set('bulan', namaBerkas.slice(0, 7));
    }
    window.open(
      `${window.location.origin}${window.location.pathname}?${params.toString()}`,
      '_blank',
      'noopener',
    );
  };

  return (
    <button
      type="button"
      onClick={bukaHalamanProsedurCetak}
      title={`Cetak / Simpan PDF resmi (${KATEGORI_EKSPOR_LABEL[category]})`}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] rounded-[4px] hover:bg-[var(--bg-hover)] shadow-2xs cursor-pointer pressable"
    >
      {label?.toLowerCase().includes('cetak') ? <Printer size={14} /> : <FileDown size={14} />}
      <span>{teks}</span>
    </button>
  );
};
