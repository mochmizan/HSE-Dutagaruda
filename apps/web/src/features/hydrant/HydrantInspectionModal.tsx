import React, { useState, useEffect } from 'react';
import {
  X,
  Flame,
  Camera,
  Trash2,
  Upload,
  Lock,
} from 'lucide-react';
import {
  HydrantUnitItem,
  HydrantComponentStatus,
  OverallStatus,
  InspectionReport,
} from '../../types/hse';
import { computeHydrantOverallStatus } from '../../lib/statusCalculator';
import { ApprovalBar, FileFotoButton } from '@/components/ui';
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
  onUnggahFoto: (file: File, caption: string) => void;
  onHapusFoto: (fotoId: string) => void;
  onClose: () => void;
  onSaveDraft: (unitId: string, draft: HydrantUnitItem['draftDetails']) => void;
  onCompleteInspection: (newReport: InspectionReport) => void;
}

const AKSIEN_HYDRANT = '#eb5757';
const KETERANGAN_FOTO = 'Bukti inspeksi';

export const HydrantInspectionModal: React.FC<HydrantInspectionModalProps> = ({
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
}) => {
  const [boxHydrant, setBoxHydrant] = useState<HydrantComponentStatus>('LAYAK');
  const [fireHose, setFireHose] = useState<HydrantComponentStatus>('LAYAK');
  const [hoseCoupling, setHoseCoupling] = useState<HydrantComponentStatus>('LAYAK');
  const [hoseRack, setHoseRack] = useState<HydrantComponentStatus>('LAYAK');
  const [nozzle, setNozzle] = useState<HydrantComponentStatus>('LAYAK');
  const [valvePillar, setValvePillar] = useState<HydrantComponentStatus>('LAYAK');
  const [notes, setNotes] = useState('');
  const [overallStatus, setOverallStatus] = useState<OverallStatus>('LAYAK');
  const [isOverridden, setIsOverridden] = useState(false);

  // Terkunci saat laporan sudah masuk proses persetujuan (bukan Draf).
  const terkunci = inspeksi != null && inspeksi.approvalStatus !== 'DRAFT';

  // Initialize form with unit draft or defaults
  useEffect(() => {
    if (unit) {
      if (unit.draftDetails) {
        setBoxHydrant(unit.draftDetails.boxHydrant || 'LAYAK');
        setFireHose(unit.draftDetails.fireHose || 'LAYAK');
        setHoseCoupling(unit.draftDetails.hoseCoupling || 'LAYAK');
        setHoseRack(unit.draftDetails.hoseRack || 'LAYAK');
        setNozzle(unit.draftDetails.nozzle || 'LAYAK');
        setValvePillar(unit.draftDetails.valvePillar || 'LAYAK');
        setNotes(unit.draftDetails.notes || '');
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
  }, [unit]);

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

  const handleSaveDraft = () => {
    onSaveDraft(unit.id, {
      boxHydrant,
      fireHose,
      hoseCoupling,
      hoseRack,
      nozzle,
      valvePillar,
      notes,
      overallStatus,
    });
    onClose();
  };

  const handleComplete = (e: React.FormEvent) => {
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
      summaryNotes: notes || 'Pemeriksaan 6 komponen selesai dan diverifikasi.',
      hydrantDetails: {
        boxHydrant,
        fireHose,
        hoseCoupling,
        hoseRack,
        nozzle,
        valvePillar,
      },
    };

    onCompleteInspection(newReport);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 select-none">
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
              </div>
              <p className="text-[11px] text-[var(--muted)]">
                Periode: September 2026 · Standar inspeksi 6 komponen hydrant gedung
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
          {/* Bilah persetujuan (laporan tersimpan saja) */}
          {inspeksi && (
            <ApprovalBar
              category="hydrant"
              refId={inspeksi.id}
              status={inspeksi.approvalStatus}
              submittedById={inspeksi.approvalSubmittedById}
              accent={AKSIEN_HYDRANT}
            />
          )}
          {terkunci && (
            <div className="no-print flex items-center gap-2 p-2.5 rounded-[5px] border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[11px] font-medium">
              <Lock size={13} className="shrink-0" />
              <span>Laporan terkunci — menunggu persetujuan. Gunakan “Kembalikan” untuk menyunting lagi.</span>
            </div>
          )}
          {/* Component Checklists Grid (6 components) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                Daftar 6 Komponen Hydrant
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* 1. Box Hydrant */}
              <div className="p-2.5 rounded-[5px] border border-[var(--border)] bg-[var(--bg-main)] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--primary)]">1. Box Hydrant</span>
                  <span className="text-[10px] text-[var(--muted)]">Fisik & Kaca</span>
                </div>
                <select
                  value={boxHydrant}
                  disabled={terkunci}
                  onChange={(e) => setBoxHydrant(e.target.value as HydrantComponentStatus)}
                  className="w-full text-xs p-1.5 rounded-[4px] border border-[var(--border)] bg-[var(--bg-sidebar)] text-[var(--primary)] focus:outline-none focus:border-[#2383e2]"
                >
                  <option value="LAYAK">LAYAK</option>
                  <option value="TIDAK_LAYAK">TIDAK LAYAK</option>
                  <option value="HILANG">HILANG</option>
                </select>
              </div>

              {/* 2. Fire Hose */}
              <div className="p-2.5 rounded-[5px] border border-[var(--border)] bg-[var(--bg-main)] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--primary)]">2. Fire Hose</span>
                  <span className="text-[10px] text-[var(--muted)]">Selang Utama</span>
                </div>
                <select
                  value={fireHose}
                  disabled={terkunci}
                  onChange={(e) => setFireHose(e.target.value as HydrantComponentStatus)}
                  className="w-full text-xs p-1.5 rounded-[4px] border border-[var(--border)] bg-[var(--bg-sidebar)] text-[var(--primary)] focus:outline-none focus:border-[#2383e2]"
                >
                  <option value="LAYAK">LAYAK</option>
                  <option value="TIDAK_LAYAK">TIDAK LAYAK</option>
                  <option value="HILANG">HILANG</option>
                </select>
              </div>

              {/* 3. Hose Coupling */}
              <div className="p-2.5 rounded-[5px] border border-[var(--border)] bg-[var(--bg-main)] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--primary)]">3. Hose Coupling</span>
                  <span className="text-[10px] text-[var(--muted)]">Kopling Sambungan</span>
                </div>
                <select
                  value={hoseCoupling}
                  disabled={terkunci}
                  onChange={(e) => setHoseCoupling(e.target.value as HydrantComponentStatus)}
                  className="w-full text-xs p-1.5 rounded-[4px] border border-[var(--border)] bg-[var(--bg-sidebar)] text-[var(--primary)] focus:outline-none focus:border-[#2383e2]"
                >
                  <option value="LAYAK">LAYAK</option>
                  <option value="TIDAK_LAYAK">TIDAK LAYAK</option>
                  <option value="HILANG">HILANG</option>
                </select>
              </div>

              {/* 4. Hose Rack */}
              <div className="p-2.5 rounded-[5px] border border-[var(--border)] bg-[var(--bg-main)] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--primary)]">4. Hose Rack</span>
                  <span className="text-[10px] text-[var(--muted)]">Gantungan Selang</span>
                </div>
                <select
                  value={hoseRack}
                  disabled={terkunci}
                  onChange={(e) => setHoseRack(e.target.value as HydrantComponentStatus)}
                  className="w-full text-xs p-1.5 rounded-[4px] border border-[var(--border)] bg-[var(--bg-sidebar)] text-[var(--primary)] focus:outline-none focus:border-[#2383e2]"
                >
                  <option value="LAYAK">LAYAK</option>
                  <option value="TIDAK_LAYAK">TIDAK LAYAK</option>
                  <option value="HILANG">HILANG</option>
                </select>
              </div>

              {/* 5. Nozzle */}
              <div className="p-2.5 rounded-[5px] border border-[var(--border)] bg-[var(--bg-main)] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--primary)]">5. Nozzle</span>
                  <span className="text-[10px] text-[var(--muted)]">Corong Semprot</span>
                </div>
                <select
                  value={nozzle}
                  disabled={terkunci}
                  onChange={(e) => setNozzle(e.target.value as HydrantComponentStatus)}
                  className="w-full text-xs p-1.5 rounded-[4px] border border-[var(--border)] bg-[var(--bg-sidebar)] text-[var(--primary)] focus:outline-none focus:border-[#2383e2]"
                >
                  <option value="LAYAK">LAYAK</option>
                  <option value="TIDAK_LAYAK">TIDAK LAYAK</option>
                  <option value="HILANG">HILANG</option>
                </select>
              </div>

              {/* 6. Valve/Pillar Hydrant */}
              <div className="p-2.5 rounded-[5px] border border-[var(--border)] bg-[var(--bg-main)] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--primary)]">6. Valve/Pillar Hydrant</span>
                  <span className="text-[10px] text-[var(--muted)]">Kran & Tekanan</span>
                </div>
                <select
                  value={valvePillar}
                  disabled={terkunci}
                  onChange={(e) => setValvePillar(e.target.value as HydrantComponentStatus)}
                  className="w-full text-xs p-1.5 rounded-[4px] border border-[var(--border)] bg-[var(--bg-sidebar)] text-[var(--primary)] focus:outline-none focus:border-[#2383e2]"
                >
                  <option value="LAYAK">LAYAK</option>
                  <option value="TIDAK_LAYAK">TIDAK LAYAK</option>
                  <option value="HILANG">HILANG</option>
                </select>
              </div>
            </div>
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
                disabled={terkunci}
                onChange={(e) => {
                  setOverallStatus(e.target.value as OverallStatus);
                  setIsOverridden(true);
                }}
                className={`text-xs font-semibold px-2 py-1 rounded-[4px] border cursor-pointer ${
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
              Catatan Hasil Pemeriksaan Lapangan
            </label>
            <textarea
              rows={2}
              value={notes}
              disabled={terkunci}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Tekanan valve stabil di 8 bar. Selang dan nozzle bersih siap pakai..."
              className="w-full text-xs p-2.5 rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] placeholder-[var(--muted)] focus:outline-none focus:border-[#2383e2]"
            />
          </div>

          {/* Foto Bukti Fisik — unggahan nyata ke Garage via /api/uploads */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--primary)] flex items-center gap-1.5">
              <Camera size={13} />
              <span>Foto Bukti Fisik Inspeksi</span>
            </label>
            {foto.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {foto.map((f) => (
                  <div
                    key={f.id}
                    className="relative w-24 h-20 rounded-[4px] overflow-hidden border border-[var(--border)] image-outline group"
                  >
                    <img src={f.url} alt={f.caption} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => onHapusFoto(f.id)}
                      title="Hapus foto"
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/65 text-white/90 hover:text-red-400 hidden group-hover:flex items-center justify-center cursor-pointer"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <FileFotoButton
              terkunci={terkunci}
              belumTersimpan={inspeksi == null}
              sibuk={mengunggah}
              onFile={(file) => onUnggahFoto(file, KETERANGAN_FOTO)}
            />
          </div>

          {/* Footer Controls */}
          <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={terkunci}
              className="px-3 py-1.5 rounded-[4px] border border-[var(--border-strong)] hover:bg-[var(--bg-hover)] text-xs font-semibold text-[var(--primary)] cursor-pointer pressable"
            >
              Simpan Sebagai Draft (Tetap Berjalan)
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-[4px] hover:bg-[var(--bg-hover)] text-xs text-[var(--secondary)] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={terkunci}
                className="px-4 py-1.5 rounded-[4px] bg-[#eb5757] hover:bg-[#d94444] text-white text-xs font-semibold shadow-xs cursor-pointer pressable disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Selesaikan &amp; Terbitkan Laporan
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
