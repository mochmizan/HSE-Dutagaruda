import React from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

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
}

/** Shared year stepper. */
export const YearSwitcher: React.FC<YearSwitcherProps> = ({ year, onChange }) => (
  <div className="flex items-center gap-1">
    <button
      type="button"
      onClick={() => onChange(String(Number(year) - 1))}
      aria-label="Tahun sebelumnya"
      className="p-1.5 rounded-[4px] text-[var(--muted)] hover:bg-[var(--bg-hover)] pressable cursor-pointer"
    >
      <ChevronLeft size={15} />
    </button>
    <span className="text-sm font-bold tabular-nums min-w-12 text-center">{year}</span>
    <button
      type="button"
      onClick={() => onChange(String(Number(year) + 1))}
      aria-label="Tahun berikutnya"
      className="p-1.5 rounded-[4px] text-[var(--muted)] hover:bg-[var(--bg-hover)] pressable cursor-pointer"
    >
      <ChevronRight size={15} />
    </button>
  </div>
);
