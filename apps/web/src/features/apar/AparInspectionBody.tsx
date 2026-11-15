import React from 'react';
import type {
  AparComponentStatus,
  AparUnitItem,
  OverallStatus,
} from '../../types/hse';
import type { ApiInspeksiApar } from '@/services/api/klien';
import type { FotoTampil } from '@/services/api/queries';
import type { KunciKomponenApar, NilaiKomponenApar } from './komponenApar';
import { AparInspectionPhotos } from './AparInspectionPhotos';
import { AparComponentChecklist } from './AparComponentChecklist';
import { AparInspectionOutcome } from './AparInspectionOutcome';
import { AparInspectionFooter } from './AparInspectionFooter';
import type { CakupanHapus } from './AparInspectionFooter';

interface AparInspectionBodyProps {
  foto: FotoTampil[];
  mengunggah: boolean;
  terbit: boolean;
  komponen: NilaiKomponenApar;
  catatanKomponen: Record<string, string>;
  catatanGabung: string;
  overallStatus: OverallStatus;
  isOverridden: boolean;
  notes: string;
  tindakLanjut: string;
  powder: boolean;
  kode: string;
  inspeksi: ApiInspeksiApar | null;
  menghapusBulan: boolean;
  menghapusUnit: boolean;
  menerbitkan: boolean;
  membatalkanTerbit: boolean;
  idRekam: string | null;
  onUnggahFoto: (file: File, caption: string, nilai?: AparUnitItem['draftDetails']) => void;
  onHapusFoto: (fotoId: string) => void;
  onUbahStatus: (key: KunciKomponenApar, value: AparComponentStatus) => void;
  onUbahCatatan: (key: KunciKomponenApar, value: string) => void;
  onUbahOverallStatus: (value: OverallStatus) => void;
  onUbahNotes: (value: string) => void;
  onUbahTindakLanjut: (value: string) => void;
  onBatalkanTerbit: () => void;
  onMintaKonfirmasi: (cakupan: CakupanHapus) => void;
  onHapusUnit?: () => void;
  onHapusBulan?: () => void;
}

/** Isi form modal inspeksi APAR: bukti foto → 7 komponen → status → kontrol. */
export const AparInspectionBody: React.FC<AparInspectionBodyProps> = ({
  foto,
  mengunggah,
  terbit,
  komponen,
  catatanKomponen,
  catatanGabung,
  overallStatus,
  isOverridden,
  notes,
  tindakLanjut,
  powder,
  kode,
  inspeksi,
  menghapusBulan,
  menghapusUnit,
  menerbitkan,
  membatalkanTerbit,
  idRekam,
  onUnggahFoto,
  onHapusFoto,
  onUbahStatus,
  onUbahCatatan,
  onUbahOverallStatus,
  onUbahNotes,
  onUbahTindakLanjut,
  onBatalkanTerbit,
  onMintaKonfirmasi,
  onHapusUnit,
  onHapusBulan,
}) => (
  <>
    <AparInspectionPhotos
      foto={foto}
      mengunggah={mengunggah}
      terbit={terbit}
      nilaiDraf={{ ...komponen, notes: catatanGabung, overallStatus }}
      powder={powder}
      kode={kode}
      onUnggahFoto={onUnggahFoto}
      onHapusFoto={onHapusFoto}
    />

    <AparComponentChecklist
      nilai={komponen}
      catatan={catatanKomponen}
      terbit={terbit}
      onUbahStatus={onUbahStatus}
      onUbahCatatan={onUbahCatatan}
    />

    <AparInspectionOutcome
      overallStatus={overallStatus}
      isOverridden={isOverridden}
      terbit={terbit}
      notes={notes}
      tindakLanjut={tindakLanjut}
      onUbahOverallStatus={onUbahOverallStatus}
      onUbahNotes={onUbahNotes}
      onUbahTindakLanjut={onUbahTindakLanjut}
    />

    <AparInspectionFooter
      adaUnit={Boolean(onHapusUnit)}
      adaInspeksi={Boolean(inspeksi && onHapusBulan)}
      menghapusBulan={menghapusBulan}
      menghapusUnit={menghapusUnit}
      terbit={terbit}
      menerbitkan={menerbitkan}
      membatalkanTerbit={membatalkanTerbit}
      idRekam={idRekam}
      onMintaKonfirmasi={onMintaKonfirmasi}
      onBatalkanTerbit={onBatalkanTerbit}
    />
  </>
);
