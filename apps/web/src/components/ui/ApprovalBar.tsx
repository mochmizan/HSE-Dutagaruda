import React from 'react';
import type { ReportWorkflowStatus } from '@/types/hse';

export const WORKFLOW_ORDER: ReportWorkflowStatus[] = ['Draft', 'Submitted', 'Known', 'Approved'];

export const WORKFLOW_LABEL: Record<ReportWorkflowStatus, string> = {
  Draft: 'Draf',
  Submitted: 'Diajukan',
  Known: 'Diketahui',
  Approved: 'Disetujui',
};

export type ApprovalRole = 'Danru' | 'Operational' | 'BuildingManagement';

export const ROLE_OPTIONS: { value: ApprovalRole; label: string }[] = [
  { value: 'Danru', label: 'Danru' },
  { value: 'Operational', label: 'Operational & TR' },
  { value: 'BuildingManagement', label: 'Building Management' },
];

/** Same approval workflow on every inspection page. Locks when Approved. */
interface ApprovalBarProps {
  workflow: ReportWorkflowStatus;
  role: ApprovalRole;
  accent: string;
  onRoleChange: (r: ApprovalRole) => void;
  onAdvance: (next: ReportWorkflowStatus) => void;
}

export const ApprovalBar: React.FC<ApprovalBarProps> = ({ workflow, role, accent, onRoleChange, onAdvance }) => {
  const tone = (s: ReportWorkflowStatus) =>
    s === 'Approved'
      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
      : s === 'Known'
        ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30'
        : s === 'Submitted'
          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
          : 'bg-[var(--bg-hover)] text-[var(--muted)] border-[var(--border)]';
  const can = (needRole: ApprovalRole, from: ReportWorkflowStatus, to: ReportWorkflowStatus) =>
    role === needRole && workflow === from && to === WORKFLOW_ORDER[WORKFLOW_ORDER.indexOf(from) + 1];
  return (
    <div className="no-print flex flex-col sm:flex-row sm:items-center gap-3 mb-4 p-3 rounded-[6px] border border-[var(--border)] bg-[var(--bg-sidebar)]/60">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">Status Laporan</span>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-[3px] text-[11px] font-bold border tabular-nums ${tone(workflow)}`}>
          {WORKFLOW_LABEL[workflow]}
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <label htmlFor="approval-role" className="text-[var(--muted)] font-medium">Peran Anda</label>
        <select
          id="approval-role"
          value={role}
          onChange={(e) => onRoleChange(e.target.value as ApprovalRole)}
          className="text-xs px-2 py-1.5 rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] focus:outline-none tabular-nums"
        >
          {ROLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          disabled={!can('Danru', 'Draft', 'Submitted')}
          onClick={() => onAdvance('Submitted')}
          title="Danru mengajukan laporan draf"
          className="px-2.5 py-1.5 text-[11px] font-semibold rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] cursor-pointer pressable disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Ajukan
        </button>
        <button
          type="button"
          disabled={!can('Operational', 'Submitted', 'Known')}
          onClick={() => onAdvance('Known')}
          title="Operational & TR mengetahui laporan"
          className="px-2.5 py-1.5 text-[11px] font-semibold rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] cursor-pointer pressable disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Ketahui
        </button>
        <button
          type="button"
          disabled={!can('BuildingManagement', 'Known', 'Approved')}
          onClick={() => onAdvance('Approved')}
          title="Building Management menyetujui laporan"
          style={{ backgroundColor: accent }}
          className="px-2.5 py-1.5 text-[11px] font-semibold rounded-[4px] text-white cursor-pointer pressable disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Setujui
        </button>
      </div>
    </div>
  );
};
