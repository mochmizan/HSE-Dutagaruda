import React from 'react';

interface P3kStatistikProps {
  filled: number;
  kurang: number;
  kd: number;
}

/** Tiga kartu ringkas: bulan terisi, sel di bawah standar, dan kadaluarsa. */
export const P3kStatistik: React.FC<P3kStatistikProps> = ({ filled, kurang, kd }) => (
  <div className="no-print grid grid-cols-3 gap-3 mb-4">
    {[
      { label: 'Bulan Terisi', value: `${filled}/12` },
      { label: 'Sel Di Bawah Standar', value: String(kurang) },
      { label: 'Kadaluarsa', value: String(kd) },
    ].map((s) => (
      <div
        key={s.label}
        className="px-3 py-2.5 rounded-[6px] border border-[var(--border)] bg-[var(--bg-sidebar)]/60"
      >
        <p className="text-xl font-bold tabular-nums text-[var(--primary)]">{s.value}</p>
        <p className="text-[10px] text-[var(--muted)] mt-0.5">{s.label}</p>
      </div>
    ))}
  </div>
);
