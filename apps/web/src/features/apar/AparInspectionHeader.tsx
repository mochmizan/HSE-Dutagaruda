import React from 'react';
import { X, ShieldCheck } from 'lucide-react';
import type { AparUnitItem } from '../../types/hse';

interface AparInspectionHeaderProps {
  unit: AparUnitItem;
  terbit: boolean;
  onClose: () => void;
}

/** Kepala formulir: identitas unit, cip zona/jenis, badge Terbit, tombol tutup. */
export const AparInspectionHeader: React.FC<AparInspectionHeaderProps> = ({
  unit,
  terbit,
  onClose,
}) => {
  return (
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
  );
};
