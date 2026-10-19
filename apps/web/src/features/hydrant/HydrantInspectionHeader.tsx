import React from 'react';
import { X, Flame } from 'lucide-react';
import { formatIndonesianMonthYear } from '../../lib/dates';

interface HydrantInspectionHeaderProps {
  kode: string;
  zoneName: string;
  period: string;
  terbit: boolean;
  onClose: () => void;
}

/** Header modal: identitas unit, penanda Terbit, dan tombol tutup. */
export const HydrantInspectionHeader: React.FC<HydrantInspectionHeaderProps> = ({
  kode,
  zoneName,
  period,
  terbit,
  onClose,
}) => (
  <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-sidebar)]">
    <div className="flex items-center gap-2.5">
      <span className="w-8 h-8 rounded-[4px] bg-[#eb5757]/15 text-[#eb5757] flex items-center justify-center text-base font-bold">
        <Flame size={16} />
      </span>
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-[var(--primary)] tracking-tight">
            Formulir Pemeriksaan: {kode}
          </h3>
          <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#eb5757]/15 text-[#eb5757]">
            {zoneName}
          </span>
          {terbit && (
            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              Terbit
            </span>
          )}
        </div>
        <p className="text-[11px] text-[var(--muted)]">
          Periode: {formatIndonesianMonthYear(`${period}-01`)} · Standar inspeksi 6 komponen hydrant gedung
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
);
