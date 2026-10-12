import React from 'react';

/** One StatCard shape on every page. Big tabular value + label. */
interface StatCardProps {
  label: string;
  value: string;
  sub: string;
  foot: string;
  accent?: string;
  tone?: 'plain' | 'accent' | 'done';
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, sub, foot, accent, tone = 'plain' }) => {
  if (tone === 'accent' && accent) {
    return (
      <div
        className="p-3 rounded-[6px] shadow-xs flex flex-col justify-between border"
        style={{ background: `linear-gradient(to bottom, ${accent}17, ${accent}05)`, borderColor: `${accent}59` }}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: accent }}>{label}</span>
          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded text-white" style={{ backgroundColor: accent }}>Prioritas</span>
        </div>
        <div className="my-1.5">
          <div className="text-2xl font-bold font-mono tabular-nums" style={{ color: accent }}>{value}</div>
          <div className="text-[10px] mt-0.5" style={{ color: `${accent}cc` }}>{sub}</div>
        </div>
        <div className="text-[10px] pt-1 border-t font-medium" style={{ color: accent, borderColor: `${accent}33` }}>{foot}</div>
      </div>
    );
  }
  if (tone === 'done') {
    return (
      <div className="p-3 bg-gradient-to-b from-emerald-500/[0.08] to-emerald-500/[0.02] dark:from-emerald-500/[0.14] dark:to-emerald-500/[0.04] border border-emerald-500/30 rounded-[6px] shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{label}</span>
          <span className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.2 rounded">Lengkap</span>
        </div>
        <div className="my-1.5">
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">{value}</div>
          <div className="text-[10px] text-[var(--muted)] mt-0.5">{sub}</div>
        </div>
        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 pt-1 border-t border-emerald-500/20 font-medium">{foot}</div>
      </div>
    );
  }
  return (
    <div className="p-3 bg-[var(--bg-main)] border border-[var(--border)] rounded-[6px] shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">{label}</span>
      </div>
      <div className="my-1.5">
        <div className="text-2xl font-bold font-mono text-[var(--primary)] tabular-nums">{value}</div>
        <div className="text-[10px] text-[var(--muted)] mt-0.5 tabular-nums">{sub}</div>
      </div>
      <div className="text-[10px] text-[var(--muted)] pt-1 border-t border-[var(--border)]">{foot}</div>
    </div>
  );
};
