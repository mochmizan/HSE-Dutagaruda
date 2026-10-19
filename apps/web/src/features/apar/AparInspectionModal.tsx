import React, { useEffect, useState } from 'react';
import type { AparComponentStatus, OverallStatus } from '../../types/domain';
import { computeAparOverallStatus } from '../../lib/statusCalculator';
import { AparInspectionShell } from './AparInspectionShell';
import { AparInspectionHeader } from './AparInspectionHeader';
import { AparInspectionPhotos } from './AparInspectionPhotos';
import { AparComponentChecklist } from './AparComponentChecklist';
import { AparInspectionOutcome } from './AparInspectionOutcome';
import { AparInspectionFooter, AparDeleteConfirm } from './AparInspectionFooter';
import { buatDrafApar, inisialisasiDrafApar } from './AparInspectionFields';
import type { AparDraft, AparInspectionModalProps } from './AparInspectionTypes';

export const AparInspectionModal: React.FC<AparInspectionModalProps> = ({
  unit,
  isOpen,
  inspeksi,
  foto,
  mengunggah,
  onUnggahFoto,
  onHapusFoto,
  onClose,
  onSaveDraft,
  onCompleteInspection,
  onBatalkanTerbit,
  onHapusBulan,
  menghapusBulan = false,
  onHapusUnit,
  menghapusUnit = false,
  menyimpanDraf = false,
}) => {
  const [values, setValues] = useState<Record<string, AparComponentStatus>>({});
  const [notes, setNotes] = useState('');
  const [catatanKomponen, setCatatanKomponen] = useState<Record<string, string>>({});
  const [tindakLanjut, setTindakLanjut] = useState('');
  const [overallStatus, setOverallStatus] = useState<OverallStatus>('LAYAK');
  const [isOverridden, setIsOverridden] = useState(false);
  const [konfirmasi, setKonfirmasi] = useState<'UNIT' | 'BULAN' | null>(null);
  /** Potret baca-saja: cermin `approval_status` rekam, bukan dugaan lokal. */
  const [terbit, setTerbit] = useState(false);
  const [membatalkanTerbit, setMembatalkanTerbit] = useState(false);
  const [menerbitkan, setMenerbitkan] = useState(false);

  // Init dari draftDetails, fallback ke completedReport.aparDetails (draft menang).
  useEffect(() => {
    if (!unit) return;
    const init = inisialisasiDrafApar(unit);
    setValues(init.values);
    setCatatanKomponen(init.catatanKomponen);
    setNotes(init.notes);
    setTindakLanjut(init.tindakLanjut);
    if (init.overallStatus) {
      setOverallStatus(init.overallStatus);
      setIsOverridden(true);
    } else {
      setIsOverridden(false);
    }
  }, [unit]);

  // PRD §3.3 — status akhir otomatis dari 7 komponen (kritis: tekanan, tabung, selang, katupTuas).
  useEffect(() => {
    if (isOverridden) return;
    setOverallStatus(
      computeAparOverallStatus({
        safetyPin: values.safetyPin ?? 'NA',
        corong: values.corong ?? 'NA',
        segel: values.segel ?? 'NA',
        tekanan: values.tekanan ?? 'NA',
        tabung: values.tabung ?? 'NA',
        selang: values.selang ?? 'NA',
        katupTuas: values.katupTuas ?? 'NA',
      })
    );
  }, [values, isOverridden]);

  // Esc + kunci scroll badan saat terbuka.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose]);

  // Mode terbit = properti rekam. Satu-satunya penulis `terbit` adalah efek ini,
  // jadi popup tak bisa menampilkan keadaan yang tidak dimiliki rekam: terbit
  // yang gagal tak menyisakan potret palsu, `Edit` yang gagal tak menyisakan
  // form terbuka di atas rekam terbit. Flag proses dibersihkan saat popup
  // dibuka / identitas rekam berubah supaya permintaan yang menggantung tidak
  // mengunci tombol pada pembukaan berikutnya.
  useEffect(() => {
    if (!isOpen) return;
    setMembatalkanTerbit(false);
    setMenerbitkan(false);
    setTerbit(Boolean(inspeksi && inspeksi.approvalStatus !== 'DRAFT'));
  }, [isOpen, inspeksi?.id, inspeksi?.approvalStatus]);

  if (!isOpen || !unit) return null;

  /** Rekam yang sedang tampil; `terbit` hanya benar bila rekam ini ada. */
  const idRekam = inspeksi?.id ?? null;

  const isPowder = unit.jenis === 'POWDER';

  const buildDraft = (): AparDraft =>
    buatDrafApar(unit, values, catatanKomponen, notes, tindakLanjut, overallStatus);

  const handleSaveDraft = () => {
    // Laman menutup modal saat mutasi berhasil; gagal = tetap terbuka + alarm.
    if (terbit) return;
    onSaveDraft(unit.id, buildDraft());
  };

  // Terbit ditunggu: popup baru ditutup setelah rekam benar-benar `DIAJUKAN`,
  // dan bila tulisan gagal form tetap terbuka (mutasi melaporkan pesannya).
  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (terbit || menerbitkan) return;
    setMenerbitkan(true);
    try {
      await onCompleteInspection(unit, buildDraft(), overallStatus);
      onClose();
    } catch {
      // onError mutasi sudah melaporkan pesannya.
    } finally {
      setMenerbitkan(false);
    }
  };

  const setValue = (key: string, v: AparComponentStatus) => {
    setValues((prev) => ({ ...prev, [key]: v }));
    setIsOverridden(false);
  };

  // Batalkan terbit: satu medan DRAF ditulis ke rekam yang tampil, baris cache
  // ditulis dari balasan server, dan efek `terbit` yang mengembalikan popup ke
  // bentuk pra-terbit.
  const handleBatalkanTerbit = async () => {
    if (!idRekam) return;
    setMembatalkanTerbit(true);
    try {
      await onBatalkanTerbit(idRekam);
    } catch {
      // onError mutasi sudah melaporkan pesannya.
    } finally {
      setMembatalkanTerbit(false);
    }
  };

  return (
    <AparInspectionShell kode={unit.kode} onClose={onClose}>
      {/* Kepala */}
      <AparInspectionHeader unit={unit} terbit={terbit} onClose={onClose} />

      {/* Isi formulir */}
      <form onSubmit={handleComplete} className="flex-1 overflow-y-auto p-4">
        <fieldset disabled={terbit} className="min-w-0 w-full space-y-4">
          <AparInspectionPhotos
            foto={foto}
            inspeksi={inspeksi}
            mengunggah={mengunggah}
            onUnggahFoto={onUnggahFoto}
            onHapusFoto={onHapusFoto}
            isPowder={isPowder}
            kode={unit.kode}
          />

          <AparComponentChecklist
            values={values}
            catatanKomponen={catatanKomponen}
            setValue={setValue}
            setCatatanKomponen={setCatatanKomponen}
          />

          <AparInspectionOutcome
            overallStatus={overallStatus}
            setOverallStatus={setOverallStatus}
            isOverridden={isOverridden}
            setIsOverridden={setIsOverridden}
            notes={notes}
            setNotes={setNotes}
            tindakLanjut={tindakLanjut}
            setTindakLanjut={setTindakLanjut}
          />

        </fieldset>

        {/* Kaki */}
        <AparInspectionFooter
          terbit={terbit}
          onSaveDraftClick={handleSaveDraft}
          menyimpanDraf={menyimpanDraf}
          onHapusUnit={onHapusUnit}
          onHapusBulan={onHapusBulan}
          inspeksi={inspeksi}
          menghapusBulan={menghapusBulan}
          menghapusUnit={menghapusUnit}
          onMintaKonfirmasi={setKonfirmasi}
          idRekam={idRekam}
          membatalkanTerbit={membatalkanTerbit}
          onBatalkanTerbitClick={handleBatalkanTerbit}
          menerbitkan={menerbitkan}
        />
      </form>

      <AparDeleteConfirm
        konfirmasi={konfirmasi}
        kode={unit.kode}
        onClose={() => setKonfirmasi(null)}
        onHapusBulan={onHapusBulan}
        onHapusUnit={onHapusUnit}
      />
    </AparInspectionShell>
  );
};
