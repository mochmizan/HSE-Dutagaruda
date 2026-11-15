import React, { useState, useEffect } from 'react';
import type { AparComponentStatus } from '../../types/hse';
import type { OverallStatus } from '../../types/hse';
import { computeAparOverallStatus } from '../../lib/statusCalculator';
import { susunCatatanApar } from './catatanApar';
import { potretDrafApar, buatLaporanApar, batalkanTerbitRekam } from './drafApar';
import { ambilKomponen, buatPengubahKomponen } from './komponenApar';
import { AparInspectionShell } from './AparInspectionShell';
import { AparInspectionHeader } from './AparInspectionHeader';
import { AparInspectionBody } from './AparInspectionBody';
import { AparDeleteConfirmation } from './AparInspectionFooter';
import type { AparInspectionModalProps } from './AparInspectionTypes';
import {
  buatPengubahCatatan,
  buatPengubahStatusAkhir,
  buatKonfirmasiHapus,
  terbitkanLaporan,
} from './penangananApar';

export const AparInspectionModal: React.FC<AparInspectionModalProps> = ({
  unit,
  isOpen,
  inspeksi,
  foto,
  mengunggah,
  onUnggahFoto,
  onHapusFoto,
  onClose,
  onCompleteInspection,
  onBatalkanTerbit,
  onHapusBulan,
  menghapusBulan = false,
  onHapusUnit,
  menghapusUnit = false,
}) => {
  const [safetyPin, setSafetyPin] = useState<AparComponentStatus>('BAIK');
  const [corong, setCorong] = useState<AparComponentStatus>('BAIK');
  const [segel, setSegel] = useState<AparComponentStatus>('BAIK');
  const [tekanan, setTekanan] = useState<AparComponentStatus>('BAIK');
  const [tabung, setTabung] = useState<AparComponentStatus>('BAIK');
  const [selang, setSelang] = useState<AparComponentStatus>('BAIK');
  const [katupTuas, setKatupTuas] = useState<AparComponentStatus>('BAIK');
  const [notes, setNotes] = useState('');
  const [tindakLanjut, setTindakLanjut] = useState('');
  const [catatanKomponen, setCatatanKomponen] = useState<Record<string, string>>({});
  const [overallStatus, setOverallStatus] = useState<OverallStatus>('LAYAK');
  const [isOverridden, setIsOverridden] = useState(false);
  const [konfirmasi, setKonfirmasi] = useState<'UNIT' | 'BULAN' | null>(null);
  /** Rekam sudah diterbitkan: potret baca-saja; tombol berubah menjadi Edit. */
  const [terbit, setTerbit] = useState(false);
  /** `Edit` / `Terbitkan` menulis ke API dulu; potret baru mengikuti rekam. */
  const [membatalkanTerbit, setMembatalkanTerbit] = useState(false);
  const [menerbitkan, setMenerbitkan] = useState(false);

  // Rekam terbit (approval_status != DRAFT) = potret baca-saja yang bertahan
  // lintas buka-tutup. Bergantung pada id + status, bukan identitas objek:
  // refetch latar saat pengguna menekan Edit tidak menendangnya kembali ke
  // baca-saja dan membuang suntingan yang sedang berjalan.
  // Hanya efek ini yang boleh menulis `terbit`: potret terbit selalu cerminan
  // rekam, jadi layar tak bisa lebih maju dari server.
  useEffect(() => {
    setMembatalkanTerbit(false);
    if (isOpen) setTerbit(Boolean(inspeksi && inspeksi.approvalStatus !== 'DRAFT'));
  }, [isOpen, inspeksi?.id, inspeksi?.approvalStatus]);

  // Initialize form with unit draft or defaults
  useEffect(() => {
    setCatatanKomponen({});
    setTindakLanjut('');
    if (!unit) return;
    const potret = potretDrafApar(unit);
    setSafetyPin(potret.komponen.safetyPin);
    setCorong(potret.komponen.corong);
    setSegel(potret.komponen.segel);
    setTekanan(potret.komponen.tekanan);
    setTabung(potret.komponen.tabung);
    setSelang(potret.komponen.selang);
    setKatupTuas(potret.komponen.katupTuas);
    setCatatanKomponen(potret.catatanKomponen);
    setNotes(potret.notes);
    setTindakLanjut(potret.tindakLanjut);
    if (potret.overallStatus) {
      setOverallStatus(potret.overallStatus);
      setIsOverridden(true);
    } else {
      setIsOverridden(false);
    }
  }, [unit, isOpen]);

  /*
   * BACKEND AGENT CONTRACT / BUSINESS RULE:
   * Status akhir otomatis dihitung dari 7 komponen APAR (PRD §3.3).
   */
  useEffect(() => {
    if (!isOverridden) {
      const computed = computeAparOverallStatus({
        safetyPin,
        corong,
        segel,
        tekanan,
        tabung,
        selang,
        katupTuas,
      });
      setOverallStatus(computed);
    }
  }, [safetyPin, corong, segel, tekanan, tabung, selang, katupTuas, isOverridden]);

  // Esc + kunci scroll badan saat terbuka.
  //
  // WAJIB di atas `if (!isOpen || !unit) return null` di bawah: efek ini harus
  // dipanggil pada setiap render, sama seperti hook lain.
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

  if (!isOpen || !unit) return null;

  /** Rekam yang sedang tampil; `terbit` hanya benar bila rekam ini ada. */
  const idRekam = inspeksi?.id ?? null;

  const nilaiKomponen = ambilKomponen(safetyPin, corong, segel, tekanan, tabung, selang, katupTuas);

  const catatanGabung = susunCatatanApar(
    { safetyPin, corong, segel, tekanan, tabung, selang, katupTuas },
    catatanKomponen,
    notes,
    tindakLanjut,
  );

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    await terbitkanLaporan(
      buatLaporanApar(unit, nilaiKomponen, overallStatus, catatanGabung),
      onCompleteInspection,
      setMenerbitkan,
    );
  };

  const ubahStatus = buatPengubahKomponen({
    safetyPin: setSafetyPin,
    corong: setCorong,
    segel: setSegel,
    tekanan: setTekanan,
    tabung: setTabung,
    selang: setSelang,
    katupTuas: setKatupTuas,
  });

  const ubahCatatan = buatPengubahCatatan(setCatatanKomponen);
  const ubahOverallStatus = buatPengubahStatusAkhir(setOverallStatus, setIsOverridden);
  const konfirmasiHapus = buatKonfirmasiHapus(onHapusBulan, onHapusUnit);
  const handleBatalkanTerbit = () =>
    batalkanTerbitRekam(idRekam, onBatalkanTerbit, setMembatalkanTerbit);

  return (
    <AparInspectionShell
      onSubmit={handleComplete}
      onClose={onClose}
      header={
        <AparInspectionHeader
          kode={unit.kode}
          zoneName={unit.zoneName}
          period={unit.period}
          terbit={terbit}
          onClose={onClose}
        />
      }
      konfirmasi={
        <AparDeleteConfirmation
          konfirmasi={konfirmasi}
          unitKode={unit.kode}
          onTutup={() => setKonfirmasi(null)}
          onKonfirmasi={konfirmasiHapus}
        />
      }
    >
      <AparInspectionBody
        foto={foto}
        mengunggah={mengunggah}
        terbit={terbit}
        komponen={nilaiKomponen}
        catatanKomponen={catatanKomponen}
        catatanGabung={catatanGabung}
        overallStatus={overallStatus}
        isOverridden={isOverridden}
        notes={notes}
        tindakLanjut={tindakLanjut}
        powder={unit.jenis === 'POWDER'}
        kode={unit.kode}
        inspeksi={inspeksi}
        menghapusBulan={menghapusBulan}
        menghapusUnit={menghapusUnit}
        menerbitkan={menerbitkan}
        membatalkanTerbit={membatalkanTerbit}
        idRekam={idRekam}
        onUnggahFoto={onUnggahFoto}
        onHapusFoto={onHapusFoto}
        onUbahStatus={ubahStatus}
        onUbahCatatan={ubahCatatan}
        onUbahOverallStatus={ubahOverallStatus}
        onUbahNotes={setNotes}
        onUbahTindakLanjut={setTindakLanjut}
        onBatalkanTerbit={handleBatalkanTerbit}
        onMintaKonfirmasi={setKonfirmasi}
        onHapusUnit={onHapusUnit}
        onHapusBulan={onHapusBulan}
      />
    </AparInspectionShell>
  );
};
