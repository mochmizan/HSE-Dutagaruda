import React from 'react';
import type { AparComponentStatus } from '../../types/domain';
import { COMPONENT_FIELDS, OPTIONS } from './AparInspectionFields';

interface AparComponentChecklistProps {
  values: Record<string, AparComponentStatus>;
  catatanKomponen: Record<string, string>;
  setValue: (key: string, v: AparComponentStatus) => void;
  setCatatanKomponen: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

/**
 * Daftar 7 komponen fisik APAR.
 *
 * Tiap kartu selalu menampilkan kotak catatan: nonaktif saat komponen standar
 * (`BAIK`), aktif saat `TIDAK_BAIK` / `NA` (HILANG).
 */
export const AparComponentChecklist: React.FC<AparComponentChecklistProps> = ({
  values,
  catatanKomponen,
  setValue,
  setCatatanKomponen,
}) => {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
        Daftar 7 Komponen APAR
      </label>
      <div className="grid grid-cols-2 gap-2.5">
        {COMPONENT_FIELDS.map((f) => (
          <div
            key={f.key}
            className="p-2.5 rounded-[5px] border border-[var(--border)] bg-[var(--bg-main)] space-y-1.5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[var(--primary)]">{f.label}</span>
              <span className="text-[10px] text-[var(--muted)]">{f.hint}</span>
            </div>
            <select
              value={values[f.key] ?? 'BAIK'}
              onChange={(e) => setValue(f.key, e.target.value as AparComponentStatus)}
              className="w-full text-xs p-1.5 rounded-[4px] border border-[var(--border)] bg-[var(--bg-sidebar)] text-[var(--primary)] focus:outline-none focus:border-[#f2994a]"
            >
              {OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o === 'BAIK' ? 'STANDAR' : o === 'TIDAK_BAIK' ? 'TIDAK STANDAR' : 'HILANG'}
                </option>
              ))}
            </select>
            {(values[f.key] ?? 'BAIK') !== 'BAIK' ? (
              <input
                value={catatanKomponen[f.key] ?? ''}
                onChange={(e) => setCatatanKomponen((prev) => ({ ...prev, [f.key]: e.target.value }))}
                placeholder="Uraikan kondisi / ketidakhadiran komponen ini…"
                className="w-full text-[11px] px-2 py-1 rounded-[3px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] placeholder-[var(--muted)] focus:outline-none focus:border-[#f2994a]"
              />
            ) : (
              <input
                value={catatanKomponen[f.key] ?? ''}
                disabled
                placeholder="Komponen standar — tanpa catatan"
                className="w-full text-[11px] px-2 py-1 rounded-[3px] border border-[var(--border)] bg-[var(--bg-sidebar)] text-[var(--muted)] placeholder-[var(--muted)] cursor-not-allowed"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
