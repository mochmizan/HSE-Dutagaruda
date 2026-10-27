import React from 'react';
import { BriefcaseMedical, Camera, Flame, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/features/pageChrome';
import type { IkonKategoriInspeksi, InspectionCategoryConfig } from './inspectionConfig';

const IKON_KATEGORI: Record<IkonKategoriInspeksi, React.ReactNode> = {
  Flame: <Flame size={18} strokeWidth={2.2} />,
  ShieldCheck: <ShieldCheck size={18} strokeWidth={2.2} />,
  BriefcaseMedical: <BriefcaseMedical size={18} strokeWidth={2.2} />,
  Camera: <Camera size={18} strokeWidth={2.2} />,
};

interface InspectionPageShellProps {
  config: InspectionCategoryConfig;
  namaProyek: string;
  siteName: string;
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
  /** Blok poros periode; bila diisi menggantikan pengalih bulan bawaan
   *  (P3K: pengalih tahun). Absen + `bulan` absen = tanpa poros (Patroli). */
  poros?: React.ReactNode;
  bulan?: Date;
  /** Tampilkan tombol `Bulan Ini` hanya saat bulan terpilih bukan bulan acuan. */
  tampilkanReset?: boolean;
  onResetBulan?: () => void;
  onPilihBulan?: (bulan: Date) => void;
  /** Bila labelTambah + onTambah absen, tombol tambah tidak tampil (P3K). */
  labelTambah?: string;
  onTambah?: () => void;
  /** Ikon tombol tambah (Patroli: kamera); Hydrant/APAR tanpa ikon. */
  ikonTambah?: React.ReactNode;
  jangkarEkspor: string | null;
  namaBerkas: string;
  onCetak: () => void;
  /** Kop cetak di atas kepala halaman (Hydrant; APAR menaruh kop di isi). */
  kepalaCetak?: React.ReactNode;
  statistik: React.ReactNode;
  /** Opsional: P3K + Patroli tidak punya bilah saring. */
  saring?: React.ReactNode;
  isi: React.ReactNode;
  tambahan?: React.ReactNode;
  tandaTangan?: React.ReactNode;
  modals: React.ReactNode;
}

/**
 * Cangkang halaman inspeksi: wadah + PageHeader + statistik + saring + isi +
 * tambahan + tanda tangan + modals, selalu dalam urutan itu.
 *
 * Presentasional saja: semua hook tetap di laman dengan urutan asli. Slot
 * tambahan/tandaTangan opsional — APAR menaruh rekap kedaluwarsa, cip unit,
 * dan kartu tahunan di dalam `isi` supaya grup cetak 2 halamannya utuh.
 * Slot saring opsional — P3K (poros tahun) dan Patroli (tanpa poros) tidak
 * memakai bilah saring. Satu slot `poros` opsional menggantikan pengalih
 * bulan bawaan: P3K mengisinya dengan pengalih tahun, Patroli mengosongkan
 * poros sepenuhnya namun urutan krom kepala tetap sama.
 */
export const InspectionPageShell: React.FC<InspectionPageShellProps> = ({
  config,
  namaProyek,
  siteName,
  isCollapsed,
  onToggleCollapsed,
  poros,
  bulan,
  tampilkanReset,
  onResetBulan,
  onPilihBulan,
  labelTambah,
  onTambah,
  ikonTambah,
  jangkarEkspor,
  namaBerkas,
  onCetak,
  kepalaCetak,
  statistik,
  saring,
  isi,
  tambahan,
  tandaTangan,
  modals,
}) => (
  <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-[var(--bg-main)] text-[var(--primary)] px-6 py-4 select-none font-sans">
    {kepalaCetak}
    <PageHeader
      namaProyek={namaProyek}
      siteName={siteName}
      remahKategori={config.remahKategori}
      ikon={IKON_KATEGORI[config.ikon]}
      aksen={config.aksen}
      judul={config.judul}
      deskripsi={config.deskripsi}
      isCollapsed={isCollapsed}
      onToggleCollapsed={onToggleCollapsed}
      poros={poros}
      bulan={bulan}
      tampilkanReset={tampilkanReset}
      onResetBulan={onResetBulan}
      onPilihBulan={onPilihBulan}
      labelTambah={labelTambah ?? config.labelTambah}
      onTambah={onTambah}
      ikonTambah={ikonTambah}
      kategoriEkspor={config.kategoriEkspor}
      jangkarEkspor={jangkarEkspor}
      namaBerkas={namaBerkas}
      onCetak={onCetak}
    />
    {statistik}
    {saring}
    {isi}
    {tambahan}
    {tandaTangan}
    {modals}
  </div>
);
