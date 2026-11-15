import React from 'react';
import type { AparComponentStatus } from '../../types/hse';
import { KOMPONEN_APAR } from './komponenApar';
import type { KunciKomponenApar, NilaiKomponenApar } from './komponenApar';

interface AparComponentChecklistProps {
  nilai: NilaiKomponenApar;
  catatan: Record<string, string>;
  terbit: boolean;
  onUbahStatus: (key: KunciKomponenApar, value: AparComponentStatus) => void;
  onUbahCatatan: (key: KunciKomponenApar, value: string) => void;
}

/**
 * Daftar 7 komponen APAR.
 *
 * Kotak catatan selalu tampil: nonaktif saat komponen BAIK, dapat diisi saat
 * TIDAK BAIK / HILANG (kontrak catatan modal inspeksi di features/AGENTS.md).
 */
export const AparComponentChecklist: React.FC<AparComponentChecklistProps> = ({
  nilai,
  catatan,
  terbit,
  onUbahStatus,
  onUbahCatatan,
}) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
        Daftar 7 Komponen APAR
      </label>
    </div>

    <fieldset disabled={terbit} className={terbit ? 'opacity-60 cursor-not-allowed' : undefined}>
      <div className="grid grid-cols-2 gap-2.5">
        {KOMPONEN_APAR.map(({ key, judul, hint }) => {
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
                onChange={(e) => onUbahStatus(key, e.target.value as AparComponentStatus)}
                className="w-full text-xs p-1.5 rounded-[4px] border border-[var(--border)] bg-[var(--bg-sidebar)] text-[var(--primary)] focus:outline-none focus:border-[#2383e2]"
              >
                <option value="BAIK">BAIK</option>
                <option value="TIDAK_BAIK">TIDAK BAIK</option>
                <option value="NA">HILANG</option>
              </select>
              {(nilaiKomponen === 'TIDAK_BAIK' || nilaiKomponen === 'NA') ? (
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
