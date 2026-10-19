import React, { useState, useEffect } from 'react';
import {
  X,
  Flame,
  Camera,
  Trash2,
} from 'lucide-react';
import {
  HydrantUnitItem,
  HydrantComponentStatus,
  OverallStatus,
  InspectionReport,
} from '../../types/hse';
import { computeHydrantOverallStatus } from '../../lib/statusCalculator';
import { formatIndonesianMonthYear } from '../../lib/dates';
import { ConfirmModal, FileFotoButton } from '@/components/ui';
import type { ApiInspeksiHidran } from '@/services/api/klien';
import type { FotoTampil } from '@/services/api/queries';

interface HydrantInspectionModalProps {
  unit: HydrantUnitItem | null;
  isOpen: boolean;
  /** Baris inspeksi tersimpan untuk unit+bulan ini; null = belum ada rekam. */
  inspeksi: ApiInspeksiHidran | null;
  /** Foto bukti sesi (unggahan → URL foto langsung). */
  foto: FotoTampil[];
  /** Status unggahan berjalan (tombol menandai proses). */
  mengunggah: boolean;
  onUnggahFoto: (file: File, caption: string, nilai?: HydrantUnitItem['draftDetails']) => void;
  onHapusFoto: (fotoId: string) => void;
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

const AKSIEN_HYDRANT = '#eb5757';
const KETERANGAN_FOTO = 'Bukti inspeksi';

/** Label tampilan tiap komponen untuk baris catatan gabungan. */
const LABEL_KOMPONEN: Record<string, string> = {
  boxHydrant: 'Box Hydrant',
  fireHose: 'Fire Hose',
  hoseCoupling: 'Hose Coupling',
  hoseRack: 'Hose Rack',
  nozzle: 'Nozzle',
  valvePillar: 'Valve/Pillar Hydrant',
};

/** Gabungkan komentar per komponen + catatan tambahan + tindak lanjut jadi satu teks. */
function susunCatatan(
  statuses: Record<string, string>,
  catatanKomponen: Record<string, string>,
  tambahan: string,
  tindakLanjut: string,
): string {
  const baris: string[] = [];
  for (const [key, label] of Object.entries(LABEL_KOMPONEN)) {
    if (statuses[key] !== 'LAYAK' && catatanKomponen[key]?.trim()) {
      baris.push(`${label}: ${catatanKomponen[key].trim()}`);
    }
  }
  if (tambahan.trim()) baris.push(`Catatan: ${tambahan.trim()}`);
  if (tindakLanjut.trim()) baris.push(`Tindak Lanjut: ${tindakLanjut.trim()}`);
  return baris.join('\n');
}

/** Pecahkan teks catatan gabungan balik ke per komponen + tambahan + tindak lanjut. */
function uraiCatatan(penuh: string): {
  catatanKomponen: Record<string, string>;
  tambahan: string;
  tindakLanjut: string;
} {
  const catatanKomponen: Record<string, string> = {};
  let tambahan = '';
  let tindakLanjut = '';
  for (const raw of (penuh || '').split('\n')) {
    const baris = raw.trim();
    if (!baris) continue;
    let cocok = false;
    for (const [key, label] of Object.entries(LABEL_KOMPONEN)) {
      if (baris.startsWith(`${label}:`)) {
        catatanKomponen[key] = baris.slice(label.length + 1).trim();
        cocok = true;
        break;
      }
    }
    if (cocok) continue;
    if (baris.startsWith('Catatan:')) tambahan = baris.slice(8).trim();
    else if (baris.startsWith('Tindak Lanjut:')) tindakLanjut = baris.slice(14).trim();
    else tambahan = tambahan ? `${tambahan}\n${baris}` : baris;
  }
  return { catatanKomponen, tambahan, tindakLanjut };
}

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
    if (unit) {
      if (unit.draftDetails) {
        setBoxHydrant(unit.draftDetails.boxHydrant || 'LAYAK');
        setFireHose(unit.draftDetails.fireHose || 'LAYAK');
        setHoseCoupling(unit.draftDetails.hoseCoupling || 'LAYAK');
        setHoseRack(unit.draftDetails.hoseRack || 'LAYAK');
        setNozzle(unit.draftDetails.nozzle || 'LAYAK');
        setValvePillar(unit.draftDetails.valvePillar || 'LAYAK');
        // Teks menyimpan gabungan; urai balik per komponen + tambahan + tindak lanjut.
        const urai = uraiCatatan(unit.draftDetails.notes || '');
        setCatatanKomponen(urai.catatanKomponen);
        setNotes(urai.tambahan);
        setTindakLanjut(urai.tindakLanjut);
        if (unit.draftDetails.overallStatus) {
          setOverallStatus(unit.draftDetails.overallStatus);
          setIsOverridden(true);
        } else {
          setIsOverridden(false);
        }
      } else {
        setBoxHydrant('LAYAK');
        setFireHose('LAYAK');
        setHoseCoupling('LAYAK');
        setHoseRack('LAYAK');
        setNozzle('LAYAK');
        setValvePillar('LAYAK');
        setNotes('');
        setIsOverridden(false);
      }
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

  if (!isOpen || !unit) return null;

  /** Rekam yang sedang tampil; `terbit` hanya benar bila rekam ini ada. */
  const idRekam = inspeksi?.id ?? null;

  const catatanGabung = susunCatatan(
    { boxHydrant, fireHose, hoseCoupling, hoseRack, nozzle, valvePillar },
    catatanKomponen,
    notes,
    tindakLanjut,
  );

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();

    const newReport: InspectionReport = {
      id: `rep-${Date.now()}`,
      category: 'HYDRANT',
      date: new Date().toISOString(),
      period: unit.period || '2026-09',
      siteId: unit.siteId,
      siteName: 'Central Warehouse Logistics',
      zoneName: unit.zoneName,
      assetCode: unit.kode,
      inspectorName: 'Alex Chen (Staff)',
      overallStatus,
      summaryNotes: catatanGabung || 'Pemeriksaan 6 komponen selesai dan diverifikasi.',
      hydrantDetails: {
        boxHydrant,
        fireHose,
        hoseCoupling,
        hoseRack,
        nozzle,
        valvePillar,
      },
    };

    setMenerbitkan(true);
    try {
      await onCompleteInspection(newReport);
    } catch {
      // onError mutasi sudah melaporkan pesannya; form tetap terbuka.
    } finally {
      setMenerbitkan(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[var(--bg-modal)] border border-[var(--border)] rounded-[8px] shadow-popover w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden emil-modal">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-sidebar)]">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-[4px] bg-[#eb5757]/15 text-[#eb5757] flex items-center justify-center text-base font-bold">
              <Flame size={16} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[var(--primary)] tracking-tight">
                  Formulir Pemeriksaan: {unit.kode}
                </h3>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#eb5757]/15 text-[#eb5757]">
                  {unit.zoneName}
                </span>
                {terbit && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    Terbit
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[var(--muted)]">
                Periode: {formatIndonesianMonthYear(`${unit.period}-01`)} · Standar inspeksi 6 komponen hydrant gedung
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-[4px] flex items-center justify-center text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--bg-hover)] cursor-pointer pressable"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleComplete} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Foto Bukti Fisik — unggahan nyata ke Garage via /api/uploads.
              Satu kartu selebar satu kolom: kontrol unggah di atas, pratinjau
              foto bertumpuk di bawahnya. */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--primary)] flex items-center gap-1.5">
              <Camera size={13} />
              <span>Foto Bukti Fisik Inspeksi</span>
            </label>
            <div className="grid grid-cols-2 gap-2 items-start">
              <div className="rounded-[5px] border border-[var(--border)] bg-[var(--bg-main)] p-2 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-[var(--primary)]">Bukti Inspeksi</p>
                    <p className="text-[10px] text-[var(--muted)]">
                      Dokumentasi kondisi fisik unit
                    </p>
                  </div>
                  {!terbit && (
                    <FileFotoButton
                      sibuk={mengunggah}
                      onFile={(file) =>
                        onUnggahFoto(file, KETERANGAN_FOTO, {
                          boxHydrant,
                          fireHose,
                          hoseCoupling,
                          hoseRack,
                          nozzle,
                          valvePillar,
                          notes: catatanGabung,
                          overallStatus,
                        })
                      }
                    />
                  )}
                </div>

                {foto.length === 0 ? (
                  <div className="rounded-[5px] border border-dashed border-[var(--border-strong)] py-4 flex items-center justify-center text-[10px] text-[var(--muted)]">
                    Belum ada foto
                  </div>
                ) : (
                  <div className="space-y-2">
                    {foto.map((f) => (
                      <div
                        key={f.id}
                        className="relative rounded-[5px] border border-[var(--border)] bg-[var(--bg-main)] p-1 group"
                      >
                        <img
                          src={f.url}
                          alt={f.caption}
                          className="w-full h-auto object-contain rounded-[3px] image-outline"
                        />
                        <button
                          type="button"
                          onClick={() => onHapusFoto(f.id)}
                          title="Hapus foto"
                          className={terbit ? 'hidden' : 'absolute top-2 right-2 w-5 h-5 rounded-full bg-black/65 text-white/90 hover:text-red-400 flex items-center justify-center cursor-pointer'}
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Component Checklists Grid (6 components) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                Daftar 6 Komponen Hydrant
              </label>
            </div>

            <fieldset disabled={terbit} className={terbit ? 'opacity-60 cursor-not-allowed' : undefined}>
            <div className="grid grid-cols-2 gap-2.5">
              {/* 1. Box Hydrant */}
              <div className="p-2.5 rounded-[5px] border border-[var(--border)] bg-[var(--bg-main)] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--primary)]">1. Box Hydrant</span>
                  <span className="text-[10px] text-[var(--muted)]">Fisik & Kaca</span>
                </div>
                <select
                  value={boxHydrant}
                  onChange={(e) => setBoxHydrant(e.target.value as HydrantComponentStatus)}
                  className="w-full text-xs p-1.5 rounded-[4px] border border-[var(--border)] bg-[var(--bg-sidebar)] text-[var(--primary)] focus:outline-none focus:border-[#2383e2]"
                >
                  <option value="LAYAK">STANDAR</option>
                  <option value="TIDAK_LAYAK">TIDAK STANDAR</option>
                  <option value="HILANG">HILANG</option>
                </select>
                {(boxHydrant === 'TIDAK_LAYAK' || boxHydrant === 'HILANG') ? (
                  <input
                    value={catatanKomponen.boxHydrant ?? ''}
                    onChange={(e) => setCatatanKomponen((prev) => ({ ...prev, boxHydrant: e.target.value }))}
                    placeholder="Uraikan kondisi / ketidakhadiran komponen ini…"
                    className="w-full text-[11px] px-2 py-1 rounded-[3px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] placeholder-[var(--muted)] focus:outline-none focus:border-[#2383e2]"
                  />
                ) : (
                  <input
                    value={catatanKomponen.boxHydrant ?? ''}
                    disabled
                    placeholder="Komponen standar — tanpa catatan"
                    className="w-full text-[11px] px-2 py-1 rounded-[3px] border border-[var(--border)] bg-[var(--bg-sidebar)] text-[var(--muted)] placeholder-[var(--muted)] cursor-not-allowed"
                  />
                )}
              </div>

              {/* 2. Fire Hose */}
              <div className="p-2.5 rounded-[5px] border border-[var(--border)] bg-[var(--bg-main)] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--primary)]">2. Fire Hose</span>
                  <span className="text-[10px] text-[var(--muted)]">Selang Utama</span>
                </div>
                <select
                  value={fireHose}
                  onChange={(e) => setFireHose(e.target.value as HydrantComponentStatus)}
                  className="w-full text-xs p-1.5 rounded-[4px] border border-[var(--border)] bg-[var(--bg-sidebar)] text-[var(--primary)] focus:outline-none focus:border-[#2383e2]"
                >
                  <option value="LAYAK">STANDAR</option>
                  <option value="TIDAK_LAYAK">TIDAK STANDAR</option>
                  <option value="HILANG">HILANG</option>
                </select>
                {(fireHose === 'TIDAK_LAYAK' || fireHose === 'HILANG') ? (
                  <input
                    value={catatanKomponen.fireHose ?? ''}
                    onChange={(e) => setCatatanKomponen((prev) => ({ ...prev, fireHose: e.target.value }))}
                    placeholder="Uraikan kondisi / ketidakhadiran komponen ini…"
                    className="w-full text-[11px] px-2 py-1 rounded-[3px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] placeholder-[var(--muted)] focus:outline-none focus:border-[#2383e2]"
                  />
                ) : (
                  <input
                    value={catatanKomponen.fireHose ?? ''}
                    disabled
                    placeholder="Komponen standar — tanpa catatan"
                    className="w-full text-[11px] px-2 py-1 rounded-[3px] border border-[var(--border)] bg-[var(--bg-sidebar)] text-[var(--muted)] placeholder-[var(--muted)] cursor-not-allowed"
                  />
                )}
              </div>

              {/* 3. Hose Coupling */}
              <div className="p-2.5 rounded-[5px] border border-[var(--border)] bg-[var(--bg-main)] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--primary)]">3. Hose Coupling</span>
                  <span className="text-[10px] text-[var(--muted)]">Kopling Sambungan</span>
                </div>
                <select
                  value={hoseCoupling}
                  onChange={(e) => setHoseCoupling(e.target.value as HydrantComponentStatus)}
                  className="w-full text-xs p-1.5 rounded-[4px] border border-[var(--border)] bg-[var(--bg-sidebar)] text-[var(--primary)] focus:outline-none focus:border-[#2383e2]"
                >
                  <option value="LAYAK">STANDAR</option>
                  <option value="TIDAK_LAYAK">TIDAK STANDAR</option>
                  <option value="HILANG">HILANG</option>
                </select>
                {(hoseCoupling === 'TIDAK_LAYAK' || hoseCoupling === 'HILANG') ? (
                  <input
                    value={catatanKomponen.hoseCoupling ?? ''}
                    onChange={(e) => setCatatanKomponen((prev) => ({ ...prev, hoseCoupling: e.target.value }))}
                    placeholder="Uraikan kondisi / ketidakhadiran komponen ini…"
                    className="w-full text-[11px] px-2 py-1 rounded-[3px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] placeholder-[var(--muted)] focus:outline-none focus:border-[#2383e2]"
                  />
                ) : (
                  <input
                    value={catatanKomponen.hoseCoupling ?? ''}
                    disabled
                    placeholder="Komponen standar — tanpa catatan"
                    className="w-full text-[11px] px-2 py-1 rounded-[3px] border border-[var(--border)] bg-[var(--bg-sidebar)] text-[var(--muted)] placeholder-[var(--muted)] cursor-not-allowed"
                  />
                )}
              </div>

              {/* 4. Hose Rack */}
              <div className="p-2.5 rounded-[5px] border border-[var(--border)] bg-[var(--bg-main)] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--primary)]">4. Hose Rack</span>
                  <span className="text-[10px] text-[var(--muted)]">Gantungan Selang</span>
                </div>
                <select
                  value={hoseRack}
                  onChange={(e) => setHoseRack(e.target.value as HydrantComponentStatus)}
                  className="w-full text-xs p-1.5 rounded-[4px] border border-[var(--border)] bg-[var(--bg-sidebar)] text-[var(--primary)] focus:outline-none focus:border-[#2383e2]"
                >
                  <option value="LAYAK">STANDAR</option>
                  <option value="TIDAK_LAYAK">TIDAK STANDAR</option>
                  <option value="HILANG">HILANG</option>
                </select>
                {(hoseRack === 'TIDAK_LAYAK' || hoseRack === 'HILANG') ? (
                  <input
                    value={catatanKomponen.hoseRack ?? ''}
                    onChange={(e) => setCatatanKomponen((prev) => ({ ...prev, hoseRack: e.target.value }))}
                    placeholder="Uraikan kondisi / ketidakhadiran komponen ini…"
                    className="w-full text-[11px] px-2 py-1 rounded-[3px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] placeholder-[var(--muted)] focus:outline-none focus:border-[#2383e2]"
                  />
                ) : (
                  <input
                    value={catatanKomponen.hoseRack ?? ''}
                    disabled
                    placeholder="Komponen standar — tanpa catatan"
                    className="w-full text-[11px] px-2 py-1 rounded-[3px] border border-[var(--border)] bg-[var(--bg-sidebar)] text-[var(--muted)] placeholder-[var(--muted)] cursor-not-allowed"
                  />
                )}
              </div>

              {/* 5. Nozzle */}
              <div className="p-2.5 rounded-[5px] border border-[var(--border)] bg-[var(--bg-main)] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--primary)]">5. Nozzle</span>
                  <span className="text-[10px] text-[var(--muted)]">Corong Semprot</span>
                </div>
                <select
                  value={nozzle}
                  onChange={(e) => setNozzle(e.target.value as HydrantComponentStatus)}
                  className="w-full text-xs p-1.5 rounded-[4px] border border-[var(--border)] bg-[var(--bg-sidebar)] text-[var(--primary)] focus:outline-none focus:border-[#2383e2]"
                >
                  <option value="LAYAK">STANDAR</option>
                  <option value="TIDAK_LAYAK">TIDAK STANDAR</option>
                  <option value="HILANG">HILANG</option>
                </select>
                {(nozzle === 'TIDAK_LAYAK' || nozzle === 'HILANG') ? (
                  <input
                    value={catatanKomponen.nozzle ?? ''}
                    onChange={(e) => setCatatanKomponen((prev) => ({ ...prev, nozzle: e.target.value }))}
                    placeholder="Uraikan kondisi / ketidakhadiran komponen ini…"
                    className="w-full text-[11px] px-2 py-1 rounded-[3px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] placeholder-[var(--muted)] focus:outline-none focus:border-[#2383e2]"
                  />
                ) : (
                  <input
                    value={catatanKomponen.nozzle ?? ''}
                    disabled
                    placeholder="Komponen standar — tanpa catatan"
                    className="w-full text-[11px] px-2 py-1 rounded-[3px] border border-[var(--border)] bg-[var(--bg-sidebar)] text-[var(--muted)] placeholder-[var(--muted)] cursor-not-allowed"
                  />
                )}
              </div>

              {/* 6. Valve/Pillar Hydrant */}
              <div className="p-2.5 rounded-[5px] border border-[var(--border)] bg-[var(--bg-main)] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--primary)]">6. Valve/Pillar Hydrant</span>
                  <span className="text-[10px] text-[var(--muted)]">Kran & Tekanan</span>
                </div>
                <select
                  value={valvePillar}
                  onChange={(e) => setValvePillar(e.target.value as HydrantComponentStatus)}
                  className="w-full text-xs p-1.5 rounded-[4px] border border-[var(--border)] bg-[var(--bg-sidebar)] text-[var(--primary)] focus:outline-none focus:border-[#2383e2]"
                >
                  <option value="LAYAK">STANDAR</option>
                  <option value="TIDAK_LAYAK">TIDAK STANDAR</option>
                  <option value="HILANG">HILANG</option>
                </select>
                {(valvePillar === 'TIDAK_LAYAK' || valvePillar === 'HILANG') ? (
                  <input
                    value={catatanKomponen.valvePillar ?? ''}
                    onChange={(e) => setCatatanKomponen((prev) => ({ ...prev, valvePillar: e.target.value }))}
                    placeholder="Uraikan kondisi / ketidakhadiran komponen ini…"
                    className="w-full text-[11px] px-2 py-1 rounded-[3px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] placeholder-[var(--muted)] focus:outline-none focus:border-[#2383e2]"
                  />
                ) : (
                  <input
                    value={catatanKomponen.valvePillar ?? ''}
                    disabled
                    placeholder="Komponen standar — tanpa catatan"
                    className="w-full text-[11px] px-2 py-1 rounded-[3px] border border-[var(--border)] bg-[var(--bg-sidebar)] text-[var(--muted)] placeholder-[var(--muted)] cursor-not-allowed"
                  />
                )}
              </div>
            </div>
            </fieldset>
          </div>

          {/* Auto-computed Status Bar with Manual Override */}
          <div className="p-3 rounded-[6px] border border-[var(--border)] bg-[var(--bg-sidebar)] space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-semibold text-[var(--primary)]">
                  Hasil Status Akhir (Saran Otomatis)
                </label>
                <p className="text-[10px] text-[var(--muted)]">
                  Dihitung otomatis dari 6 komponen di atas. Anda dapat mengubahnya jika ada catatan khusus.
                </p>
              </div>

              <select
                value={overallStatus}
                onChange={(e) => {
                  setOverallStatus(e.target.value as OverallStatus);
                  setIsOverridden(true);
                }}
                disabled={terbit}
                className={`text-xs font-semibold px-2 py-1 rounded-[4px] border cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                  overallStatus === 'LAYAK'
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                    : overallStatus === 'LAYAK_DENGAN_CATATAN'
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400'
                    : 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400'
                }`}
              >
                <option value="LAYAK">LAYAK</option>
                <option value="LAYAK_DENGAN_CATATAN">LAYAK DENGAN CATATAN</option>
                <option value="TIDAK_LAYAK">TIDAK LAYAK</option>
              </select>
            </div>

            {isOverridden && (
              <p className="text-[10px] text-amber-600 dark:text-amber-400 italic">
                *Status telah disesuaikan secara manual oleh petugas pemeriksa.
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--primary)]">
              Catatan Temuan Tambahan
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={terbit}
              placeholder="Contoh: Tekanan valve stabil di 8 bar. Selang dan nozzle bersih siap pakai..."
              className="w-full text-xs p-2.5 rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] placeholder-[var(--muted)] focus:outline-none focus:border-[#2383e2] disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          {/* Tindak lanjut — opsional */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--primary)]">
              Tindakan Rekomendasi / Tindak Lanjut{' '}
              <span className="text-[10px] font-normal text-[var(--muted)]">(opsional)</span>
            </label>
            <textarea
              rows={2}
              value={tindakLanjut}
              onChange={(e) => setTindakLanjut(e.target.value)}
              disabled={terbit}
              placeholder="Contoh: Ganti selang rusak dan pengecekan ulang pekan depan..."
              className="w-full text-xs p-2.5 rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] placeholder-[var(--muted)] focus:outline-none focus:border-[#2383e2] disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          {/* Footer Controls */}
          <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Dua cakupan hapus, dua label tetap — bukan satu tombol yang
                  artinya bergeser menurut ada/tidaknya rekam bulan. Baris tabel
                  adalah UNIT; rekam inspeksi hanya anaknya per bulan. */}
              {onHapusUnit && (
                <button
                  type="button"
                  onClick={() => setKonfirmasi('UNIT')}
                  disabled={menghapusBulan || menghapusUnit}
                  className="inline-flex items-center gap-1.5 text-[11px] font-medium text-red-600 dark:text-red-400 hover:underline pressable cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:no-underline"
                >
                  <Trash2 size={12} /> {menghapusUnit ? 'Menghapus…' : 'Hapus unit'}
                </button>
              )}
              {inspeksi && onHapusBulan && (
                <button
                  type="button"
                  onClick={() => setKonfirmasi('BULAN')}
                  disabled={menghapusBulan || menghapusUnit}
                  className="text-[11px] font-medium text-[var(--muted)] hover:text-[var(--secondary)] hover:underline pressable cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:no-underline"
                >
                  {menghapusBulan ? 'Mengosongkan…' : 'Kosongkan bulan ini'}
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {terbit ? (
                <button
                  type="button"
                  disabled={membatalkanTerbit || !idRekam}
                  aria-busy={membatalkanTerbit}
                  onClick={async () => {
                    // Batal terbit: satu medan DRAF ditulis ke rekam yang
                    // tampil, baris di cache ditulis dari balasan server, dan
                    // efek `terbit` yang mengembalikan popup ke bentuk
                    // pra-terbit. Layar tak pernah mendahului rekam — termasuk
                    // bila popup ditutup lalu unit lain dibuka sebelum tulisan
                    // selesai; tulisan gagal = potret tetap utuh.
                    if (!idRekam) return;
                    setMembatalkanTerbit(true);
                    try {
                      await onBatalkanTerbit(idRekam);
                    } catch {
                      // onError mutasi sudah melaporkan pesannya ke pengguna.
                    } finally {
                      setMembatalkanTerbit(false);
                    }
                  }}
                  className="px-4 py-1.5 rounded-[4px] border border-[#2f80ed]/40 bg-[#2f80ed]/10 text-[#2f80ed] hover:bg-[#2f80ed]/20 text-xs font-semibold shadow-xs cursor-pointer pressable disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {membatalkanTerbit ? 'Membatalkan…' : 'Edit'}
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={menerbitkan}
                  aria-busy={menerbitkan}
                  className="px-4 py-1.5 rounded-[4px] bg-[#2f80ed] hover:bg-[#2b77d4] text-white text-xs font-semibold shadow-xs cursor-pointer pressable disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {menerbitkan ? 'Menerbitkan…' : 'Terbitkan'}
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Konfirmasi hapus: dua cakupan terpisah, label menyebut akibatnya */}
        <ConfirmModal
          isOpen={konfirmasi !== null}
          title={konfirmasi === 'BULAN' ? 'Kosongkan Inspeksi Bulan Ini' : 'Hapus Unit'}
          message={
            konfirmasi === 'BULAN'
              ? `Rekaman inspeksi ${unit.kode} bulan ini beserta seluruh fotonya akan dihapus. Unitnya tetap ada dan kembali “Belum Dimulai”. Lanjutkan?`
              : `Unit ${unit.kode} beserta seluruh rekaman inspeksi dan fotonya akan dihapus permanen. Lanjutkan?`
          }
          confirmLabel="Ya, hapus"
          accent="#eb5757"
          onClose={() => setKonfirmasi(null)}
          onConfirm={() => {
            const mode = konfirmasi;
            setKonfirmasi(null);
            if (mode === 'BULAN') onHapusBulan?.();
            else onHapusUnit?.();
          }}
        />
      </div>
    </div>
  );
};
