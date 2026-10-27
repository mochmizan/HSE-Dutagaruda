import React from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, LayoutGrid, TableIcon } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

export type ViewMode = 'TABLE' | 'CARDS';

interface ViewToggleProps {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
}

/** Pengalih Tabel/Kartu — segmented control seragam: pil putih aktif
 *  (identik tab filter, plus `dark:bg-[var(--bg-hover)]` agar kontras
 *  di mode gelap). Dipakai Hydrant & APAR. */
export const ViewToggle: React.FC<ViewToggleProps> = ({ value, onChange }) => {
  const base = 'p-1.5 rounded-[4px] flex items-center gap-1 cursor-pointer pressable transition-colors';
  const opsi: { key: ViewMode; judul: string; title: string; Ikon: React.FC<{ size?: number }> }[] = [
    { key: 'TABLE', judul: 'Tabel', title: 'Tampilan Tabel (mudah dicetak / ekspor)', Ikon: TableIcon },
    { key: 'CARDS', judul: 'Kartu', title: 'Tampilan Kartu', Ikon: LayoutGrid },
  ];
  return (
    <div className="flex items-center bg-[var(--bg-sidebar)] p-0.5 rounded-[5px] border border-[var(--border)] text-xs">
      {opsi.map(({ key, judul, title, Ikon }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          title={title}
          aria-pressed={value === key}
          className={`${base} ${
            value === key
              ? 'bg-white dark:bg-[var(--bg-hover)] text-[var(--primary)] font-semibold shadow-xs'
              : 'text-[var(--secondary)] hover:text-[var(--primary)]'
          }`}
        >
          <Ikon size={14} />
          <span className="hidden sm:inline text-[11px]">{judul}</span>
        </button>
      ))}
    </div>
  );
};

/** Shared month switcher shell. Page owns the date state. */
interface MonthSwitcherProps {
  value: Date;
  accent: string;
  onChange: (d: Date) => void;
  formatValue?: (d: Date) => string;
}

export const MonthSwitcher: React.FC<MonthSwitcherProps> = ({ value, accent, onChange, formatValue }) => (
  <div className="flex items-center bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-[5px] p-0.5 shadow-2xs">
    <button
      type="button"
      onClick={() => onChange(new Date(value.getFullYear(), value.getMonth() - 1, 1))}
      title="Bulan Sebelumnya"
      className="w-6 h-6 rounded-[3px] flex items-center justify-center text-[var(--secondary)] hover:text-[var(--primary)] hover:bg-[var(--bg-hover)] cursor-pointer pressable transition-colors"
    >
      <ChevronLeft size={13} />
    </button>
    <div className="relative flex items-center">
      <select
        value={`${value.getFullYear()}-${value.getMonth()}`}
        onChange={(e) => {
          const [y, m] = e.target.value.split('-').map(Number);
          onChange(new Date(y, m, 1));
        }}
        style={{ color: accent }}
        className="text-xs font-semibold bg-transparent cursor-pointer py-0.5 px-2 focus:outline-none capitalize pr-5 appearance-none tabular-nums"
      >
        {Array.from({ length: 12 }, (_, m) => {
          const d = new Date(value.getFullYear(), m, 1);
          return (
            <option key={m} value={`${value.getFullYear()}-${m}`} className="bg-[var(--bg-main)] text-[var(--primary)]">
              {formatValue ? formatValue(d) : format(d, 'MMMM yyyy', { locale: idLocale })}
            </option>
          );
        })}
      </select>
      <ChevronDown size={11} className="absolute right-1 pointer-events-none" style={{ color: accent }} />
    </div>
    <button
      type="button"
      onClick={() => onChange(new Date(value.getFullYear(), value.getMonth() + 1, 1))}
      title="Bulan Berikutnya"
      className="w-6 h-6 rounded-[3px] flex items-center justify-center text-[var(--secondary)] hover:text-[var(--primary)] hover:bg-[var(--bg-hover)] cursor-pointer pressable transition-colors"
    >
      <ChevronRight size={13} />
    </button>
  </div>
);

interface YearSwitcherProps {
  year: string;
  onChange: (y: string) => void;
  /** Warna teks tahun; default biru aksi agar seragam dengan MonthSwitcher. */
  accent?: string;
}

/** Pengalih tahun — satu bahasa visual dengan MonthSwitcher: pil
 *  `bg-sidebar` + border + chevron 13px + teks aksen. */
export const YearSwitcher: React.FC<YearSwitcherProps> = ({ year, onChange, accent = '#2f80ed' }) => (
  <div className="flex items-center bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-[5px] p-0.5 shadow-2xs">
    <button
      type="button"
      onClick={() => onChange(String(Number(year) - 1))}
      aria-label="Tahun sebelumnya"
      title="Tahun Sebelumnya"
      className="w-6 h-6 rounded-[3px] flex items-center justify-center text-[var(--secondary)] hover:text-[var(--primary)] hover:bg-[var(--bg-hover)] cursor-pointer pressable transition-colors"
    >
      <ChevronLeft size={13} />
    </button>
    <span
      className="text-xs font-semibold tabular-nums px-2 min-w-12 text-center"
      style={{ color: accent }}
    >
      {year}
    </span>
    <button
      type="button"
      onClick={() => onChange(String(Number(year) + 1))}
      aria-label="Tahun berikutnya"
      title="Tahun Berikutnya"
      className="w-6 h-6 rounded-[3px] flex items-center justify-center text-[var(--secondary)] hover:text-[var(--primary)] hover:bg-[var(--bg-hover)] cursor-pointer pressable transition-colors"
    >
      <ChevronRight size={13} />
    </button>
  </div>
);
