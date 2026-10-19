import React from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Printer } from 'lucide-react';
import { UnduhPdfButton } from '@/components/ui';
import { TombolPerluas } from '@/features/navigation';

interface P3kHeaderProps {
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
  onBack: () => void;
  year: string;
  onShiftYear: (delta: number) => void;
  jangkarEkspor: string | null;
  onPrint: () => void;
}

/** Bilah atas P3K: judul, pengalih tahun, unduh PDF, dan cetak. */
export const P3kHeader: React.FC<P3kHeaderProps> = ({
  isCollapsed,
  onToggleCollapsed,
  onBack,
  year,
  onShiftYear,
  jangkarEkspor,
  onPrint,
}) => (
  <div className="no-print flex items-center justify-between gap-2 pb-3 mb-4 border-b border-[var(--border)]">
    <div className="flex items-center gap-2 min-w-0">
      {isCollapsed && <TombolPerluas onKlik={onToggleCollapsed} />}
      <button
        type="button"
        onClick={onBack}
        aria-label="Kembali"
        className="p-1.5 rounded-[4px] text-[var(--muted)] hover:bg-[var(--bg-hover)] pressable cursor-pointer"
      >
        <ArrowLeft size={16} />
      </button>
      <h1 className="text-lg font-bold text-[var(--primary)] tracking-tight truncate">
        Inspeksi Kotak P3K
      </h1>
    </div>
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onShiftYear(-1)}
          aria-label="Tahun sebelumnya"
          className="p-1.5 rounded-[4px] text-[var(--muted)] hover:bg-[var(--bg-hover)] pressable cursor-pointer"
        >
          <ChevronLeft size={15} />
        </button>
        <span className="text-sm font-bold tabular-nums min-w-12 text-center">{year}</span>
        <button
          type="button"
          onClick={() => onShiftYear(1)}
          aria-label="Tahun berikutnya"
          className="p-1.5 rounded-[4px] text-[var(--muted)] hover:bg-[var(--bg-hover)] pressable cursor-pointer"
        >
          <ChevronRight size={15} />
        </button>
      </div>
      <UnduhPdfButton category="p3k-yearly" refId={jangkarEkspor} label="Unduh PDF" namaBerkas={year} />
      <button
        type="button"
        onClick={onPrint}
        title="Cetak lembar laporan ke printer atau simpan sebagai PDF"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#27ae60] rounded-[4px] hover:brightness-95 pressable cursor-pointer"
      >
        <Printer size={13} /> Cetak
      </button>
    </div>
  </div>
);
