import { Check, X, Clock, AlertCircle, CheckCircle2, Camera } from 'lucide-react';
import type { AparUnitItem } from '../../types/hse';

export const COMPONENT_LABELS = [
  { key: 'safetyPin', label: 'Safety Pin' },
  { key: 'corong', label: 'Corong' },
  { key: 'segel', label: 'Segel' },
  { key: 'tekanan', label: 'Tekanan' },
  { key: 'tabung', label: 'Tabung' },
  { key: 'selang', label: 'Selang' },
  { key: 'katupTuas', label: 'Katup/Tuas' },
] as const;

export type AparComponentKey = (typeof COMPONENT_LABELS)[number]['key'];
export const COMPONENT_KEYS: AparComponentKey[] = COMPONENT_LABELS.map((c) => c.key);

type AparDetails = NonNullable<AparUnitItem['draftDetails']>;

const getDetails = (unit: AparUnitItem): Record<string, string | undefined> | undefined => {
  const rep = unit.completedReport?.aparDetails as Record<string, string | undefined> | undefined;
  const draft = unit.draftDetails as Record<string, string | undefined> | undefined;
  if (!rep && !draft) return undefined;
  const merged: Record<string, string | undefined> = { ...rep };
  for (const [k, v] of Object.entries(draft ?? {})) {
    if (v !== undefined) merged[k] = v;
  }
  return merged;
};

const getOverall = (unit: AparUnitItem) =>
  unit.draftDetails?.overallStatus ?? unit.completedReport?.overallStatus;

export const unitHasIssue = (unit: AparUnitItem): boolean => {
  const d = getDetails(unit);
  if (!d) return false;
  return COMPONENT_KEYS.some((k) => d[k] === 'TIDAK_BAIK');
};

/** Cip verifikasi satu komponen: BAIK hijau ✓ / TIDAK_BAIK merah X / NA amber / belum abu-abu •. */
export const ComponentChip: React.FC<{ label: string; status?: string }> = ({ label, status }) => {
  const isOk = status === 'BAIK';
  const isBad = status === 'TIDAK_BAIK';
  const isNa = status === 'NA';
  return (
    <span
      title={`${label}: ${status === 'BAIK' ? 'Baik' : status === 'TIDAK_BAIK' ? 'Tidak Baik' : status === 'NA' ? 'Tidak Berlaku' : 'Belum diperiksa'}`}
      className={`px-1.5 py-0.5 rounded-[3px] text-[10px] font-mono border inline-flex items-center gap-0.5 ${
        isOk
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold'
          : isBad
          ? 'bg-red-500/20 border-red-500/40 text-red-600 dark:text-red-400 font-bold'
          : isNa
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 font-semibold'
          : 'bg-[var(--bg-hover)] border-[var(--border)] text-[var(--muted)]'
      }`}
    >
      <span>{label}</span>
      {isOk ? (
        <Check size={9} strokeWidth={2.5} />
      ) : isBad ? (
        <X size={10} strokeWidth={2.5} />
      ) : isNa ? (
        <span className="font-bold">NA</span>
      ) : (
        <span className="text-[8px]">•</span>
      )}
    </span>
  );
};

/** Lencana status kelayakan unit: LAYAK / Layak–Catatan / TIDAK LAYAK / Berjalan / Belum Dimulai. */
export const EligibilityBadge: React.FC<{ unit: AparUnitItem }> = ({ unit }) => {
  const overall = getOverall(unit);
  if (unit.status === 'SELESAI' && overall === 'LAYAK') {
    return (
      <span className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
        <CheckCircle2 size={11} /> LAYAK
      </span>
    );
  }
  if (unit.status === 'SELESAI' && overall === 'LAYAK_DENGAN_CATATAN') {
    return (
      <span className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
        <AlertCircle size={11} /> Layak — Catatan
      </span>
    );
  }
  if (unit.status === 'SELESAI' && overall === 'TIDAK_LAYAK') {
    return (
      <span className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
        <X size={11} strokeWidth={2.5} /> TIDAK LAYAK
      </span>
    );
  }
  if (unit.status === 'SEDANG_BERJALAN') {
    return (
      <span className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
        <Clock size={11} /> Berjalan
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-[3px] text-[10px] font-medium bg-[var(--bg-hover)] text-[var(--muted)] border border-[var(--border)]">
      <AlertCircle size={11} /> Belum Dimulai
    </span>
  );
};

export type PhotoKind = 'kartu' | 'berat' | 'cek';

const PHOTO_CELLS: { kind: PhotoKind; label: string; field: keyof AparDetails }[] = [
  { kind: 'kartu', label: 'Kartu', field: 'photoKartuUrl' },
  { kind: 'berat', label: 'Berat', field: 'photoBeratUrl' },
  { kind: 'cek', label: 'Pengecekan', field: 'photoPengecekanUrl' },
];

/** Tiga sel dokumentasi foto; sel Berat nonaktif (abu-abu) untuk APAR Powder. */
export const DocCell: React.FC<{ unit: AparUnitItem; onRequestPhoto: (unitId: string, kind: PhotoKind) => void }> = ({
  unit,
  onRequestPhoto,
}) => (
  <div className="flex items-start justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
    {PHOTO_CELLS.map((cell) => {
      const url = unit.draftDetails?.[cell.field] as string | undefined;
      const disabledForPowder = cell.kind === 'berat' && unit.jenis === 'POWDER';
      return (
        <div key={cell.kind} className="flex flex-col items-center gap-0.5">
          <button
            type="button"
            disabled={disabledForPowder}
            onClick={() => onRequestPhoto(unit.id, cell.kind)}
            title={
              disabledForPowder
                ? `Penimbangan berat hanya untuk APAR CO₂ (unit ini ${unit.jenis})`
                : url
                ? `Ganti foto ${cell.label} APAR ${unit.kode}`
                : `Unggah foto ${cell.label} APAR ${unit.kode}`
            }
            className={`w-10 h-10 rounded-[4px] border overflow-hidden flex items-center justify-center pressable ${
              disabledForPowder
                ? 'bg-[var(--bg-hover)] border-[var(--border)] text-[var(--muted)] opacity-40 cursor-not-allowed'
                : url
                ? 'border-emerald-500/40 cursor-pointer image-outline'
                : 'bg-[var(--bg-hover)] border-dashed border-[var(--border)] text-[var(--muted)] hover:text-[var(--primary)] cursor-pointer'
            }`}
          >
            {url ? (
              <img src={url} alt={`Dokumentasi ${cell.label} APAR ${unit.kode}`} className="w-full h-full object-cover" />
            ) : disabledForPowder ? (
              <span className="text-[10px] font-bold">–</span>
            ) : (
              <Camera size={13} />
            )}
          </button>
          <span className="text-[9px] text-[var(--muted)] leading-none">{cell.label}</span>
        </div>
      );
    })}
  </div>
);
