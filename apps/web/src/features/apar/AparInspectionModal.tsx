import React, { useEffect, useState } from 'react';
import { X, ShieldCheck, Camera, Trash2 } from 'lucide-react';
import type { AparUnitItem } from '../../types/hse';
import type { AparComponentStatus, OverallStatus } from '../../types/domain';
import { computeAparOverallStatus } from '../../lib/statusCalculator';
import { ConfirmModal, FileFotoButton } from '@/components/ui';
import type { ApiInspeksiApar } from '@/services/api/klien';
import type { FotoTampil } from '@/services/api/queries';

type AparDraft = NonNullable<AparUnitItem['draftDetails']>;

interface AparInspectionModalProps {
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
  onCompleteInspection: (unit: AparUnitItem, draft: AparDraft, overall: OverallStatus) => void;
  onHapusBulan?: () => void;
  /** Status mutasi hapus (tombol menandai proses). */
  menghapusBulan?: boolean;
}

const COMPONENT_FIELDS: { key: keyof AparDraft & string; label: string; hint: string }[] = [
  { key: 'safetyPin', label: '1. Safety Pin', hint: 'Pin Pengaman' },
  { key: 'corong', label: '2. Corong', hint: 'Mulut Semprot' },
  { key: 'segel', label: '3. Segel', hint: 'Segel Pabrik' },
  { key: 'tekanan', label: '4. Tekanan', hint: 'Jarum Manometer' },
  { key: 'tabung', label: '5. Tabung', hint: 'Bodi & Karat' },
  { key: 'selang', label: '6. Selang', hint: 'Fleksibilitas' },
  { key: 'katupTuas', label: '7. Katup/Tuas', hint: 'Tuas Penekan' },
];

const APAR_ACCENT = '#f2994a';

const OPTIONS: AparComponentStatus[] = ['BAIK', 'TIDAK_BAIK', 'NA'];

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
  onHapusBulan,
  menghapusBulan = false,
}) => {
  const [values, setValues] = useState<Record<string, AparComponentStatus>>({});
  const [notes, setNotes] = useState('');
  const [tindakLanjut, setTindakLanjut] = useState('');
  const [overallStatus, setOverallStatus] = useState<OverallStatus>('LAYAK');
  const [isOverridden, setIsOverridden] = useState(false);
  const [konfirmasiHapusBulan, setKonfirmasiHapusBulan] = useState(false);

  // Init dari draftDetails, fallback ke completedReport.aparDetails (draft menang).
  useEffect(() => {
    if (!unit) return;
    const draft = unit.draftDetails;
    const rep = unit.completedReport?.aparDetails;
    const pick = (k: string): AparComponentStatus =>
      (draft?.[k as keyof AparDraft] as AparComponentStatus | undefined) ??
      (rep?.[k as keyof typeof rep] as AparComponentStatus | undefined) ??
      'BAIK';
    const next: Record<string, AparComponentStatus> = {};
    for (const f of COMPONENT_FIELDS) next[f.key] = pick(f.key);
    setValues(next);
    setNotes((draft?.notes as string | undefined) ?? unit.completedReport?.summaryNotes ?? '');
    setTindakLanjut((draft?.tindakLanjut as string | undefined) ?? '');
    const savedOverall =
      (draft?.overallStatus as OverallStatus | undefined) ?? unit.completedReport?.overallStatus;
    if (savedOverall) {
      setOverallStatus(savedOverall);
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

  if (!isOpen || !unit) return null;

  const isPowder = unit.jenis === 'POWDER';

  const buildDraft = (): AparDraft => ({
    ...unit.draftDetails,
    safetyPin: values.safetyPin ?? 'BAIK',
    corong: values.corong ?? 'BAIK',
    segel: values.segel ?? 'BAIK',
    tekanan: values.tekanan ?? 'BAIK',
    tabung: values.tabung ?? 'BAIK',
    selang: values.selang ?? 'BAIK',
    katupTuas: values.katupTuas ?? 'BAIK',
    notes,
    tindakLanjut,
    overallStatus,
  });

  const handleSaveDraft = () => {
    onSaveDraft(unit.id, buildDraft());
    onClose();
  };

  const handleComplete = (e: React.FormEvent) => {
    e.preventDefault();
    onCompleteInspection(unit, buildDraft(), overallStatus);
    onClose();
  };

  const setValue = (key: string, v: AparComponentStatus) => {
    setValues((prev) => ({ ...prev, [key]: v }));
    setIsOverridden(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 select-none no-print"
      onClick={onClose}
    >
      <div
        className="bg-[var(--bg-modal)] border border-[var(--border)] rounded-[8px] shadow-popover w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden emil-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Formulir pemeriksaan APAR ${unit.kode}`}
      >
        {/* Kepala */}
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-sidebar)]">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-[4px] bg-[#f2994a]/15 text-[#f2994a] flex items-center justify-center">
              <ShieldCheck size={16} />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-semibold text-[var(--primary)] tracking-tight tabular-nums">
                  Formulir Pemeriksaan: APAR {unit.kode}
                </h3>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#f2994a]/15 text-[#f2994a]">
                  {unit.zoneName}
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono border border-[var(--border)] text-[var(--muted)] tabular-nums">
                  {unit.period} • {unit.jenis} {unit.ukuran}
                </span>
              </div>
              <p className="text-[11px] text-[var(--muted)]">
                Standar inspeksi 7 komponen fisik APAR
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup formulir"
            className="w-7 h-7 rounded-[4px] flex items-center justify-center text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--bg-hover)] cursor-pointer pressable"
          >
            <X size={16} />
          </button>
        </div>

        {/* Isi formulir */}
        <form onSubmit={handleComplete} className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              Daftar 7 Komponen APAR
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {COMPONENT_FIELDS.map((f) => (
                <div
                  key={f.key}
                  className="p-2.5 rounded-[5px] border border-[var(--border)] bg-[var(--bg-main)] space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[var(--primary)]">{f.label}</span>
                    <span className="text-[10px] text-[var(--muted)]">{f.hint}</span>
                  </div>
                  <select
                    value={values[f.key] ?? 'BAIK'}
                    onChange={(e) => setValue(f.key, e.target.value as AparComponentStatus)}
                    className="w-full text-xs p-1.5 rounded-[4px] border border-[var(--border)] bg-[var(--bg-sidebar)] text-[var(--primary)] focus:outline-none focus:border-[#f2994a]"
                  >
                    {OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o === 'BAIK' ? 'BAIK' : o === 'TIDAK_BAIK' ? 'TIDAK BAIK' : 'NA (Tidak Berlaku)'}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Status akhir otomatis + ubah manual */}
          <div className="p-3 rounded-[6px] border border-[var(--border)] bg-[var(--bg-sidebar)] space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div>
                <label className="text-xs font-semibold text-[var(--primary)]">
                  Hasil Status Akhir (Saran Otomatis)
                </label>
                <p className="text-[10px] text-[var(--muted)]">
                  Dihitung otomatis dari 7 komponen di atas. Anda dapat mengubahnya jika ada catatan khusus.
                </p>
              </div>
              <select
                value={overallStatus}
                onChange={(e) => {
                  setOverallStatus(e.target.value as OverallStatus);
                  setIsOverridden(true);
                }}
                className={`text-xs font-semibold px-2 py-1 rounded-[4px] border cursor-pointer tabular-nums ${
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

          {/* Catatan */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--primary)]">
              Catatan Hasil Pemeriksaan Lapangan
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Tekanan pada zona hijau, segel utuh, selang lentur siap pakai…"
              className="w-full text-xs p-2.5 rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] placeholder-[var(--muted)] focus:outline-none focus:border-[#f2994a]"
            />
          </div>

          {/* Tindak lanjut */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--primary)]">
              Tindak Lanjut <span className="font-normal text-[var(--muted)]">(wajib bila ada komponen Tidak Baik)</span>
            </label>
            <textarea
              rows={2}
              value={tindakLanjut}
              onChange={(e) => setTindakLanjut(e.target.value)}
              placeholder="Contoh: Isi ulang tabung & ganti segel sebelum akhir bulan…"
              className="w-full text-xs p-2.5 rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] placeholder-[var(--muted)] focus:outline-none focus:border-[#f2994a]"
            />
          </div>

          {/* Dokumentasi foto — unggahan nyata ke Garage via /api/uploads */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--primary)] flex items-center gap-1.5">
              <Camera size={13} />
              <span>Foto Dokumentasi</span>
            </label>
            {(
              [
                { slot: 'Kartu' as const, keterangan: 'Kartu APAR', disabled: false, hint: 'Foto kartu gantung APAR' },
                { slot: 'Berat' as const, keterangan: 'Penimbangan CO2', disabled: isPowder, hint: isPowder ? 'Nonaktif untuk APAR Powder (khusus CO₂)' : 'Foto hasil penimbangan (CO₂)' },
                { slot: 'Pengecekan' as const, keterangan: 'Pengecekan fisik', disabled: false, hint: 'Foto proses pengecekan fisik' },
              ]
            ).map((f) => {
              const slotFoto = foto.filter((g) => g.caption === f.keterangan);
              return (
                <div key={f.slot} className="space-y-1.5 rounded-[5px] border border-[var(--border)] bg-[var(--bg-main)] p-2">
                  <div className="flex items-center gap-2">
                    <span className="w-24 shrink-0 text-[11px] font-medium text-[var(--secondary)]">{f.slot}</span>
                    <span className="flex-1 text-[10px] text-[var(--muted)]">{f.hint}</span>
                    <FileFotoButton
                      nonaktif={f.disabled}
                      belumTersimpan={inspeksi == null}
                      sibuk={mengunggah}
                      onFile={(file) => onUnggahFoto(f.slot, file)}
                    />
                  </div>
                  {slotFoto.length > 0 && (
                    <div className="flex items-center gap-2 pl-[104px]">
                      {slotFoto.map((g) => (
                        <div
                          key={g.id}
                          className="relative w-14 h-14 rounded-[4px] border border-[var(--border)] overflow-hidden group image-outline shrink-0"
                        >
                          <a href={g.url} target="_blank" rel="noreferrer" title={`Buka pratinjau foto ${f.slot.toLowerCase()} di tab baru`}>
                            <img
                              src={g.url}
                              alt={`Dokumentasi ${f.slot} APAR ${unit.kode}`}
                              className="w-full h-full object-cover"
                            />
                          </a>
                          <button
                            type="button"
                            onClick={() => onHapusFoto(g.id)}
                            title="Hapus foto"
                            className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/65 text-white/90 hover:text-red-400 hidden group-hover:flex items-center justify-center cursor-pointer"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Kaki */}
          <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="px-3 py-1.5 rounded-[4px] border border-[var(--border-strong)] hover:bg-[var(--bg-hover)] text-xs font-semibold text-[var(--primary)] cursor-pointer pressable disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Simpan Draft
              </button>
              {inspeksi && onHapusBulan && (
                <button
                  type="button"
                  onClick={() => setKonfirmasiHapusBulan(true)}
                  disabled={menghapusBulan}
                  className="inline-flex items-center gap-1.5 text-[11px] font-medium text-red-600 dark:text-red-400 hover:underline pressable cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:no-underline"
                >
                  <Trash2 size={12} /> Hapus
                </button>
              )}
            </div>
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
                className="px-4 py-1.5 rounded-[4px] bg-[#f2994a] hover:bg-[#e08830] text-white text-xs font-semibold shadow-xs cursor-pointer pressable disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Selesaikan &amp; Terbitkan
              </button>
            </div>
          </div>
        </form>

        {/* Konfirmasi hapus rekam inspeksi (beserta foto dokumentasinya) */}
        <ConfirmModal
          isOpen={konfirmasiHapusBulan}
          title="Hapus Inspeksi"
          message={`Rekaman inspeksi APAR ${unit.kode} bulan ini beserta seluruh foto dokumentasinya akan dihapus permanen. Lanjutkan?`}
          confirmLabel="Hapus"
          accent="#f2994a"
          onClose={() => setKonfirmasiHapusBulan(false)}
          onConfirm={() => {
            setKonfirmasiHapusBulan(false);
            onHapusBulan?.();
          }}
        />
      </div>
    </div>
  );
};
