import React from 'react';
import { BriefcaseMedical, X } from 'lucide-react';

interface P3kInspectionHeaderProps {
  monthLabel: string;
  lengkap: number;
  kurang: number;
  kd: number;
  onClose: () => void;
}

/** Kepala modal: identitas bulan, ringkasan, dan tombol tutup (statis). */
export const P3kInspectionHeader: React.FC<P3kInspectionHeaderProps> = ({
  monthLabel,
  lengkap,
  kurang,
  kd,
  onClose,
}) => (
  <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-sidebar)]">
    <div className="flex items-center gap-2.5">
      <span className="w-8 h-8 rounded-[4px] bg-[#27ae60]/15 text-[#27ae60] flex items-center justify-center text-base font-bold">
        <BriefcaseMedical size={16} />
      </span>
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-[var(--primary)] tracking-tight">
            Formulir Pemeriksaan: {monthLabel}
          </h3>
        </div>
        <p className="text-[11px] text-[var(--muted)] tabular-nums">
          {lengkap}/21 lengkap · {kurang} kurang · {kd} kadaluarsa · Standar inspeksi 21 item kotak P3K
        </p>
      </div>
    </div>

    <button
      type="button"
      onClick={onClose}
      aria-label="Tutup"
      className="w-7 h-7 rounded-[4px] flex items-center justify-center text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--bg-hover)] cursor-pointer pressable"
    >
      <X size={16} />
    </button>
  </div>
);
