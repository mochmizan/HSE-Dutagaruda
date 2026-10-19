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

const COMPONENT_FIELDS: { key: keyof AparDraft & string; label: string; hint: string }[] = [
  { key: 'safetyPin', label: '1. Safety Pin', hint: 'Pin Pengaman' },
  { key: 'corong', label: '2. Corong', hint: 'Mulut Semprot' },
  { key: 'segel', label: '3. Segel', hint: 'Segel Pabrik' },
  { key: 'tekanan', label: '4. Tekanan', hint: 'Jarum Manometer' },
  { key: 'tabung', label: '5. Tabung', hint: 'Bodi & Karat' },
  { key: 'selang', label: '6. Selang', hint: 'Fleksibilitas' },
  { key: 'katupTuas', label: '7. Katup/Tuas', hint: 'Tuas Penekan' },
];

const OPTIONS: AparComponentStatus[] = ['BAIK', 'TIDAK_BAIK', 'NA'];

/** Label tanpa nomor urut untuk baris catatan gabungan. */
const LABEL_KOMPONEN_APAR: Record<string, string> = Object.fromEntries(
  COMPONENT_FIELDS.map((f) => [f.key, f.label.replace(/^\d+\.\s*/, '')]),
);

/** Gabungkan komentar per komponen + catatan tambahan jadi satu teks. */
function susunCatatanApar(
  values: Record<string, string>,
  catatanKomponen: Record<string, string>,
  tambahan: string,
): string {
  const baris: string[] = [];
  for (const [key, label] of Object.entries(LABEL_KOMPONEN_APAR)) {
    if (values[key] && values[key] !== 'BAIK' && catatanKomponen[key]?.trim()) {
      baris.push(`${label}: ${catatanKomponen[key].trim()}`);
    }
  }
  if (tambahan.trim()) baris.push(`Catatan: ${tambahan.trim()}`);
  return baris.join('\n');
}

/** Pecahkan teks gabungan balik ke per komponen + tambahan. */
function uraiCatatanApar(penuh: string): {
  catatanKomponen: Record<string, string>;
  tambahan: string;
} {
  const catatanKomponen: Record<string, string> = {};
  let tambahan = '';
  for (const raw of (penuh || '').split('\n')) {
    const baris = raw.trim();
    if (!baris) continue;
    let cocok = false;
    for (const [key, label] of Object.entries(LABEL_KOMPONEN_APAR)) {
      if (baris.startsWith(`${label}:`)) {
        catatanKomponen[key] = baris.slice(label.length + 1).trim();
        cocok = true;
        break;
      }
    }
    if (cocok) continue;
    if (baris.startsWith('Catatan:')) tambahan = baris.slice(8).trim();
    else tambahan = tambahan ? `${tambahan}\n${baris}` : baris;
  }
  return { catatanKomponen, tambahan };
}

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
    const draft = unit.draftDetails;
    const rep = unit.completedReport?.aparDetails;
    const pick = (k: string): AparComponentStatus =>
      (draft?.[k as keyof AparDraft] as AparComponentStatus | undefined) ??
      (rep?.[k as keyof typeof rep] as AparComponentStatus | undefined) ??
      'BAIK';
    const next: Record<string, AparComponentStatus> = {};
    for (const f of COMPONENT_FIELDS) next[f.key] = pick(f.key);
    setValues(next);
    // Teks catatan menyimpan gabungan; urai balik per komponen + tambahan.
    const catatanMentah = (draft?.notes as string | undefined) ?? unit.completedReport?.summaryNotes ?? '';
    const urai = uraiCatatanApar(catatanMentah);
    setCatatanKomponen(urai.catatanKomponen);
    setNotes(urai.tambahan);
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

  const buildDraft = (): AparDraft => ({
    ...unit.draftDetails,
    safetyPin: values.safetyPin ?? 'BAIK',
    corong: values.corong ?? 'BAIK',
    segel: values.segel ?? 'BAIK',
    tekanan: values.tekanan ?? 'BAIK',
    tabung: values.tabung ?? 'BAIK',
    selang: values.selang ?? 'BAIK',
    katupTuas: values.katupTuas ?? 'BAIK',
    notes: susunCatatanApar(values, catatanKomponen, notes),
    tindakLanjut,
    overallStatus,
  });

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
                {terbit && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    Terbit
                  </span>
                )}
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
        <form onSubmit={handleComplete} className="flex-1 overflow-y-auto p-4">
        <fieldset disabled={terbit} className="min-w-0 w-full space-y-4">
          {/* Dokumentasi foto — unggahan nyata ke Garage via /api/uploads.
              Grid dua kolom: tiap slot kartu berisi tombol + pratinjau
              diskalakan maksimal ke lebar kolomnya. */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--primary)] flex items-center gap-1.5">
              <Camera size={13} />
              <span>Foto Dokumentasi</span>
            </label>
            <div className="grid grid-cols-2 gap-2 items-stretch">
              {(
                [
                  { slot: 'Kartu' as const, keterangan: 'Kartu APAR', disabled: false, hint: 'Foto kartu gantung APAR' },
                  { slot: 'Berat' as const, keterangan: 'Penimbangan CO2', disabled: isPowder, hint: isPowder ? 'Nonaktif untuk APAR Powder (khusus CO₂)' : 'Foto hasil penimbangan (CO₂)' },
                  { slot: 'Pengecekan' as const, keterangan: 'Pengecekan fisik', disabled: false, hint: 'Foto proses pengecekan fisik' },
                ]
              ).map((f) => {
                const slotFoto = foto.filter((g) => g.caption === f.keterangan);
                return (
                  <div
                    key={f.slot}
                    className="rounded-[5px] border border-[var(--border)] bg-[var(--bg-main)] p-2 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-[var(--primary)] truncate">{f.slot}</p>
                        <p className="text-[10px] text-[var(--muted)] truncate">{f.hint}</p>
                      </div>
                      <FileFotoButton
                        nonaktif={f.disabled}
                        belumTersimpan={inspeksi == null}
                        sibuk={mengunggah}
                        onFile={(file) => onUnggahFoto(f.slot, file)}
                      />
                    </div>
                    {slotFoto.length > 0 ? (
                      <div className="relative rounded-[4px] overflow-hidden border border-[var(--border)] image-outline">
                        <a
                          href={slotFoto[0].url}
                          target="_blank"
                          rel="noreferrer"
                          title={`Buka pratinjau foto ${f.slot.toLowerCase()} di tab baru`}
                        >
                          <img
                            src={slotFoto[0].url}
                            alt={`Dokumentasi ${f.slot} APAR ${unit.kode}`}
                            className="w-full h-auto object-contain image-outline"
                          />
                        </a>
                        {slotFoto.length > 1 && (
                          <span className="absolute bottom-1 right-1 text-[9px] font-mono px-1 rounded-full bg-black/60 text-white">
                            +{slotFoto.length - 1}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => onHapusFoto(slotFoto[0].id)}
                          title="Hapus foto"
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/65 text-white/90 hover:text-red-400 flex items-center justify-center cursor-pointer"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    ) : (
                      <div className="w-full aspect-[4/3] rounded-[4px] border border-dashed border-[var(--border-strong)] flex items-center justify-center text-[10px] text-[var(--muted)] text-center px-1">
                        {f.disabled ? 'Tidak berlaku untuk jenis ini' : inspeksi == null ? 'Simpan dulu untuk unggah' : 'Belum ada foto'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

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
                        {o === 'BAIK' ? 'STANDAR' : o === 'TIDAK_BAIK' ? 'TIDAK STANDAR' : 'HILANG'}
                      </option>
                    ))}
                  </select>
                  {(values[f.key] ?? 'BAIK') !== 'BAIK' ? (
                    <input
                      value={catatanKomponen[f.key] ?? ''}
                      onChange={(e) => setCatatanKomponen((prev) => ({ ...prev, [f.key]: e.target.value }))}
                      placeholder="Uraikan kondisi / ketidakhadiran komponen ini…"
                      className="w-full text-[11px] px-2 py-1 rounded-[3px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] placeholder-[var(--muted)] focus:outline-none focus:border-[#f2994a]"
                    />
                  ) : (
                    <input
                      value={catatanKomponen[f.key] ?? ''}
                      disabled
                      placeholder="Komponen standar — tanpa catatan"
                      className="w-full text-[11px] px-2 py-1 rounded-[3px] border border-[var(--border)] bg-[var(--bg-sidebar)] text-[var(--muted)] placeholder-[var(--muted)] cursor-not-allowed"
                    />
                  )}
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
              Catatan Temuan Tambahan
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
              Tindakan Rekomendasi / Tindak Lanjut{' '}
              <span className="text-[10px] font-normal text-[var(--muted)]">(opsional)</span>
            </label>
            <textarea
              rows={2}
              value={tindakLanjut}
              onChange={(e) => setTindakLanjut(e.target.value)}
              placeholder="Contoh: Isi ulang tabung & ganti segel sebelum akhir bulan…"
              className="w-full text-xs p-2.5 rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] placeholder-[var(--muted)] focus:outline-none focus:border-[#f2994a]"
            />
          </div>

        </fieldset>

          {/* Kaki */}
          <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-4 flex-wrap">
              {!terbit && (
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={menyimpanDraf}
                  className="px-3 py-1.5 rounded-[4px] border border-[var(--border-strong)] hover:bg-[var(--bg-hover)] text-xs font-semibold text-[var(--primary)] cursor-pointer pressable disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {menyimpanDraf ? 'Menyimpan…' : 'Simpan Draft'}
                </button>
              )}
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
                    // Batalkan terbit: satu medan DRAF ditulis ke rekam yang
                    // tampil, baris cache ditulis dari balasan server, dan efek
                    // `terbit` yang mengembalikan popup ke bentuk pra-terbit.
                    if (!idRekam) return;
                    setMembatalkanTerbit(true);
                    try {
                      await onBatalkanTerbit(idRekam);
                    } catch {
                      // onError mutasi sudah melaporkan pesannya.
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
              ? `Rekaman inspeksi APAR ${unit.kode} bulan ini beserta seluruh fotonya akan dihapus. Unitnya tetap ada dan kembali “Belum Dimulai”. Lanjutkan?`
              : `Unit APAR ${unit.kode} beserta seluruh rekaman inspeksi dan fotonya akan dihapus permanen. Lanjutkan?`
          }
          confirmLabel="Ya, hapus"
          accent="#f2994a"
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
