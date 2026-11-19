import type { AparUnitItem, InspectionReport } from '../../types/hse';
import type { ApiInspeksiApar } from '@/services/api/klien';
import type { FotoTampil } from '@/services/api/queries';

export interface AparInspectionModalProps {
  unit: AparUnitItem | null;
  isOpen: boolean;
  /** Baris inspeksi tersimpan untuk unit+bulan ini; null = belum ada rekam. */
  inspeksi: ApiInspeksiApar | null;
  /** Foto bukti sesi (unggahan → URL foto langsung). */
  foto: FotoTampil[];
  /** Foto temuan unit ini (`temuan: true`). */
  temuanFoto?: FotoTampil[];
  /** Status unggahan berjalan (tombol menandai proses). */
  mengunggah: boolean;
  onUnggahFoto: (
    file: File,
    caption: string,
    nilai?: AparUnitItem['draftDetails'],
    temuan?: boolean,
  ) => void;
  onHapusFoto: (fotoId: string) => void;
  onUbahCaptionFoto?: (fotoId: string, caption: string) => void;
  onClose: () => void;
  onCompleteInspection: (newReport: InspectionReport) => void | Promise<void>;
  /** `Edit` pada rekam terbit = batalkan terbit rekam yang tampil (turun jadi
   *  DRAF). Modal menunggu promise-nya; potret terbit hanya mengikuti rekam. */
  onBatalkanTerbit: (inspectionId: string) => Promise<void>;
  onHapusBulan?: () => void;
  /** Status mutasi hapus (tombol menandai proses). */
  menghapusBulan?: boolean;
  /** Hapus unit sebaris datanya (popup bulan tanpa rekam). */
  onHapusUnit?: () => void;
  /** Status mutasi hapus unit. */
  menghapusUnit?: boolean;
}
