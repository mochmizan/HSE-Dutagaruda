import type { AparUnitItem } from '../../types/hse';
import type { OverallStatus } from '../../types/domain';
import type { ApiInspeksiApar } from '@/services/api/klien';
import type { FotoTampil } from '@/services/api/queries';

export type AparDraft = NonNullable<AparUnitItem['draftDetails']>;

export interface AparInspectionModalProps {
  unit: AparUnitItem | null;
  isOpen: boolean;
  /** Baris inspeksi tersimpan untuk unit+bulan ini; null = belum ada rekam. */
  inspeksi: ApiInspeksiApar | null;
  /** Foto dokumentasi sesi per slot (Kartu / Berat / Pengecekan). */
  foto: FotoTampil[];
  /** Status unggahan berjalan (tombol menandai proses). */
  mengunggah: boolean;
  onUnggahFoto: (slot: 'Kartu' | 'Berat' | 'Pengecekan', file: File) => void;
  onHapusFoto: (fotoId: string) => void;
  onClose: () => void;
  onSaveDraft: (unitId: string, draft: AparDraft) => void;
  /** Terbit: menulis `DIAJUKAN`; promise ditunggu sebelum popup ditutup. */
  onCompleteInspection: (
    unit: AparUnitItem,
    draft: AparDraft,
    overall: OverallStatus,
  ) => Promise<void>;
  /** Batalkan terbit (tombol `Edit`): satu medan `approval_status` → DRAFT. */
  onBatalkanTerbit: (inspectionId: string) => Promise<void>;
  onHapusBulan?: () => void;
  /** Status mutasi hapus (tombol menandai proses). */
  menghapusBulan?: boolean;
  /** Hapus unit sebaris datanya (popup bulan tanpa rekam). */
  onHapusUnit?: () => void;
  /** Status mutasi hapus unit. */
  menghapusUnit?: boolean;
  /** Status mutasi simpan draf (tombol menandai proses). */
  menyimpanDraf?: boolean;
}
