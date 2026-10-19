import React from 'react';
import type { HydrantComponentStatus } from '../../types/hse';
import { KOMPONEN_HIDRAN } from './komponenHidran';
import type { KunciKomponenHidran, NilaiKomponenHidran } from './komponenHidran';

interface HydrantComponentChecklistProps {
  nilai: NilaiKomponenHidran;
  catatan: Record<string, string>;
  terbit: boolean;
  onUbahStatus: (key: KunciKomponenHidran, value: HydrantComponentStatus) => void;
  onUbahCatatan: (key: KunciKomponenHidran, value: string) => void;
}

/**
 * Component Checklists Grid (6 components).
 *
 * Kotak catatan selalu tampil: nonaktif saat komponen STANDAR, dapat diisi saat
 * TIDAK STANDAR / HILANG (kontrak catatan modal inspeksi di features/AGENTS.md).
 */
export const HydrantComponentChecklist: React.FC<HydrantComponentChecklistProps> = ({
  nilai,
  catatan,
  terbit,
  onUbahStatus,
  onUbahCatatan,
}) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
        Daftar 6 Komponen Hydrant
      </label>
    </div>

    <fieldset disabled={terbit} className={terbit ? 'opacity-60 cursor-not-allowed' : undefined}>
      <div className="grid grid-cols-2 gap-2.5">
        {KOMPONEN_HIDRAN.map(({ key, judul, hint }) => {
          const nilaiKomponen = nilai[key];
          return (
            <div
              key={key}
              className="p-2.5 rounded-[5px] border border-[var(--border)] bg-[var(--bg-main)] space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--primary)]">{judul}</span>
                <span className="text-[10px] text-[var(--muted)]">{hint}</span>
              </div>
              <select
                value={nilaiKomponen}
                onChange={(e) => onUbahStatus(key, e.target.value as HydrantComponentStatus)}
                className="w-full text-xs p-1.5 rounded-[4px] border border-[var(--border)] bg-[var(--bg-sidebar)] text-[var(--primary)] focus:outline-none focus:border-[#2383e2]"
              >
                <option value="LAYAK">STANDAR</option>
                <option value="TIDAK_LAYAK">TIDAK STANDAR</option>
                <option value="HILANG">HILANG</option>
              </select>
              {(nilaiKomponen === 'TIDAK_LAYAK' || nilaiKomponen === 'HILANG') ? (
                <input
                  value={catatan[key] ?? ''}
                  onChange={(e) => onUbahCatatan(key, e.target.value)}
                  placeholder="Uraikan kondisi / ketidakhadiran komponen ini…"
                  className="w-full text-[11px] px-2 py-1 rounded-[3px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] placeholder-[var(--muted)] focus:outline-none focus:border-[#2383e2]"
                />
              ) : (
                <input
                  value={catatan[key] ?? ''}
                  disabled
                  placeholder="Komponen standar — tanpa catatan"
                  className="w-full text-[11px] px-2 py-1 rounded-[3px] border border-[var(--border)] bg-[var(--bg-sidebar)] text-[var(--muted)] placeholder-[var(--muted)] cursor-not-allowed"
                />
              )}
            </div>
          );
        })}
      </div>
    </fieldset>
  </div>
);
