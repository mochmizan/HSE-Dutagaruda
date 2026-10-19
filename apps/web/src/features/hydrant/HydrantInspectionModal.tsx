import React, { useState, useEffect } from 'react';
import { HydrantComponentStatus, OverallStatus } from '../../types/hse';
import { computeHydrantOverallStatus } from '../../lib/statusCalculator';
import { susunCatatan } from './catatanHidran';
import { potretDrafHidran, buatLaporanHidran, batalkanTerbitRekam } from './drafHidran';
import { ambilKomponen, buatPengubahKomponen } from './komponenHidran';
import { HydrantInspectionShell } from './HydrantInspectionShell';
import { HydrantInspectionHeader } from './HydrantInspectionHeader';
import { HydrantInspectionBody } from './HydrantInspectionBody';
import { HydrantDeleteConfirmation } from './HydrantInspectionFooter';
import type { HydrantInspectionModalProps } from './HydrantInspectionModal.types';
import {
  buatPengubahCatatan,
  buatPengubahStatusAkhir,
  buatKonfirmasiHapus,
  terbitkanLaporan,
} from './penangananHidran';

export const HydrantInspectionModal: React.FC<HydrantInspectionModalProps> = ({
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
  const [boxHydrant, setBoxHydrant] = useState<HydrantComponentStatus>('LAYAK');
  const [fireHose, setFireHose] = useState<HydrantComponentStatus>('LAYAK');
  const [hoseCoupling, setHoseCoupling] = useState<HydrantComponentStatus>('LAYAK');
  const [hoseRack, setHoseRack] = useState<HydrantComponentStatus>('LAYAK');
  const [nozzle, setNozzle] = useState<HydrantComponentStatus>('LAYAK');
  const [valvePillar, setValvePillar] = useState<HydrantComponentStatus>('LAYAK');
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
  // baca-saja dan membuang suntingan yang belum terbit.
  // Hanya efek ini yang boleh menulis `terbit`: potret terbit selalu cerminan
  // rekam, jadi layar tak bisa lebih maju dari server (mis. penerbitan gagal
  // tak boleh menyisakan potret "Terbit" untuk rekam yang tak ada).
  useEffect(() => {
    setMembatalkanTerbit(false);
    if (isOpen) setTerbit(Boolean(inspeksi && inspeksi.approvalStatus !== 'DRAFT'));
  }, [isOpen, inspeksi?.id, inspeksi?.approvalStatus]);

  // Initialize form with unit draft or defaults
  useEffect(() => {
    setCatatanKomponen({});
    setTindakLanjut('');
    if (!unit) return;
    const potret = potretDrafHidran(unit);
    setBoxHydrant(potret.komponen.boxHydrant);
    setFireHose(potret.komponen.fireHose);
    setHoseCoupling(potret.komponen.hoseCoupling);
    setHoseRack(potret.komponen.hoseRack);
    setNozzle(potret.komponen.nozzle);
    setValvePillar(potret.komponen.valvePillar);
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
   * If any of the 6 hydrant components is TIDAK_LAYAK or HILANG,
   * the overall status (status akhir) MUST automatically evaluate to TIDAK_LAYAK.
   */
  // PRD §3.3 Auto-computed Overall Status calculation
  useEffect(() => {
    if (!isOverridden) {
      const computed = computeHydrantOverallStatus({
        boxHydrant,
        fireHose,
        hoseCoupling,
        hoseRack,
        nozzle,
        valvePillar,
      });
      setOverallStatus(computed);
    }
  }, [boxHydrant, fireHose, hoseCoupling, hoseRack, nozzle, valvePillar, isOverridden]);

  // Esc + kunci scroll badan saat terbuka. Kontrak features/AGENTS.md mewajibkan
  // Esc menutup modal; versi sebelumnya hanya punya backdrop click, sehingga
  // papan ketik tidak bisa keluar dari formulir Hydrant.
  //
  // WAJIB di atas `if (!isOpen || !unit) return null` di bawah: efek ini harus
  // dipanggil pada setiap render, sama seperti hook lain. Menaruhnya setelah
  // early return mengubah jumlah hook antar-render dan menjatuhkan halaman
  // dengan React error #310.
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

  const nilaiKomponen = ambilKomponen(boxHydrant, fireHose, hoseCoupling, hoseRack, nozzle, valvePillar);

  const catatanGabung = susunCatatan(
    { boxHydrant, fireHose, hoseCoupling, hoseRack, nozzle, valvePillar },
    catatanKomponen,
    notes,
    tindakLanjut,
  );

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    await terbitkanLaporan(
      buatLaporanHidran(unit, nilaiKomponen, overallStatus, catatanGabung),
      onCompleteInspection,
      setMenerbitkan,
    );
  };

  const ubahStatus = buatPengubahKomponen({
    boxHydrant: setBoxHydrant,
    fireHose: setFireHose,
    hoseCoupling: setHoseCoupling,
    hoseRack: setHoseRack,
    nozzle: setNozzle,
    valvePillar: setValvePillar,
  });

  const ubahCatatan = buatPengubahCatatan(setCatatanKomponen);
  const ubahOverallStatus = buatPengubahStatusAkhir(setOverallStatus, setIsOverridden);
  const konfirmasiHapus = buatKonfirmasiHapus(onHapusBulan, onHapusUnit);
  const handleBatalkanTerbit = () =>
    batalkanTerbitRekam(idRekam, onBatalkanTerbit, setMembatalkanTerbit);

  return (
    <HydrantInspectionShell
      onSubmit={handleComplete}
      onClose={onClose}
      header={
        <HydrantInspectionHeader
          kode={unit.kode}
          zoneName={unit.zoneName}
          period={unit.period}
          terbit={terbit}
          onClose={onClose}
        />
      }
      konfirmasi={
        <HydrantDeleteConfirmation
          konfirmasi={konfirmasi}
          unitKode={unit.kode}
          onTutup={() => setKonfirmasi(null)}
          onKonfirmasi={konfirmasiHapus}
        />
      }
    >
      <HydrantInspectionBody
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
    </HydrantInspectionShell>
  );
};
