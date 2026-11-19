import React from 'react';
import type {
  HydrantComponentStatus,
  HydrantUnitItem,
  OverallStatus,
} from '../../types/hse';
import type { ApiInspeksiHidran } from '@/services/api/klien';
import type { FotoTampil } from '@/services/api/queries';
import type { KunciKomponenHidran, NilaiKomponenHidran } from './komponenHidran';
import { HydrantInspectionPhotos } from './HydrantInspectionPhotos';
import { HydrantComponentChecklist } from './HydrantComponentChecklist';
import { HydrantInspectionOutcome } from './HydrantInspectionOutcome';
import { HydrantInspectionFooter } from './HydrantInspectionFooter';
import type { CakupanHapus } from './HydrantInspectionFooter';

interface HydrantInspectionBodyProps {
  foto: FotoTampil[];
  temuanFoto?: FotoTampil[];
  mengunggah: boolean;
  terbit: boolean;
  komponen: NilaiKomponenHidran;
  catatanKomponen: Record<string, string>;
  catatanGabung: string;
  overallStatus: OverallStatus;
  isOverridden: boolean;
  notes: string;
  tindakLanjut: string;
  inspeksi: ApiInspeksiHidran | null;
  menghapusBulan: boolean;
  menghapusUnit: boolean;
  menerbitkan: boolean;
  membatalkanTerbit: boolean;
  idRekam: string | null;
  onUnggahFoto: (
    file: File,
    caption: string,
    nilai?: HydrantUnitItem['draftDetails'],
    temuan?: boolean,
  ) => void;
  onHapusFoto: (fotoId: string) => void;
  onUbahCaptionFoto?: (fotoId: string, caption: string) => void;
  onUbahStatus: (key: KunciKomponenHidran, value: HydrantComponentStatus) => void;
  onUbahCatatan: (key: KunciKomponenHidran, value: string) => void;
  onUbahOverallStatus: (value: OverallStatus) => void;
  onUbahNotes: (value: string) => void;
  onUbahTindakLanjut: (value: string) => void;
  onBatalkanTerbit: () => void;
  onMintaKonfirmasi: (cakupan: CakupanHapus) => void;
  onHapusUnit?: () => void;
  onHapusBulan?: () => void;
}

/** Isi form modal inspeksi hydrant: bukti foto → 6 komponen → status → kontrol. */
export const HydrantInspectionBody: React.FC<HydrantInspectionBodyProps> = ({
  foto,
  temuanFoto,
  mengunggah,
  terbit,
  komponen,
  catatanKomponen,
  catatanGabung,
  overallStatus,
  isOverridden,
  notes,
  tindakLanjut,
  inspeksi,
  menghapusBulan,
  menghapusUnit,
  menerbitkan,
  membatalkanTerbit,
  idRekam,
  onUnggahFoto,
  onHapusFoto,
  onUbahCaptionFoto,
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
    <HydrantInspectionPhotos
      foto={foto}
      temuanFoto={temuanFoto}
      mengunggah={mengunggah}
      terbit={terbit}
      nilaiDraf={{ ...komponen, notes: catatanGabung, overallStatus }}
      onUnggahFoto={onUnggahFoto}
      onHapusFoto={onHapusFoto}
      onUbahCaptionFoto={onUbahCaptionFoto}
    />

    <HydrantComponentChecklist
      nilai={komponen}
      catatan={catatanKomponen}
      terbit={terbit}
      onUbahStatus={onUbahStatus}
      onUbahCatatan={onUbahCatatan}
    />

    <HydrantInspectionOutcome
      overallStatus={overallStatus}
      isOverridden={isOverridden}
      terbit={terbit}
      notes={notes}
      tindakLanjut={tindakLanjut}
      onUbahOverallStatus={onUbahOverallStatus}
      onUbahNotes={onUbahNotes}
      onUbahTindakLanjut={onUbahTindakLanjut}
    />

    <HydrantInspectionFooter
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
