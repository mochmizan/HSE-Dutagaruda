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

const SARAN_CATATAN_HIDRAN: Record<KunciKomponenHidran, string[]> = {
  boxHydrant: ['Pintu box seret/macet', 'Kaca/kunci box rusak', 'Box kotor/berdebu'],
  fireHose: ['Selang bocor/getas', 'Selang lembab/berjamur', 'Lipatan selang tidak rapi'],
  hoseCoupling: ['Ulir coupling aus/macet', 'Karet seal coupling rusak'],
  hoseRack: ['Engsel rack berkarat/macet', 'Pin penyangga rack longgar'],
  nozzle: ['Karet pelindung nozzle getas', 'Ujung nozzle tersumbat/penyok'],
  valvePillar: ['Putaran valve berat/macet', 'Rembesan air pada valve'],
};

/**
 * Daftar 6 Komponen Hydrant.
 * Sesuai revisi:
 * - Pilihan hanya STANDAR / TIDAK STANDAR (tulisan Hilang dihapus).
 * - Ketika memilih TIDAK STANDAR, langsung muncul input keterangan di setiap poin.
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
        2. Daftar Pemeriksaan 6 Komponen Hydrant
      </label>
      <span className="text-[10px] text-[var(--muted)]">
        Pilih <strong>Tidak Standar</strong> untuk mengisi keterangan per poin
      </span>
    </div>

    <fieldset disabled={terbit} className={terbit ? 'opacity-60 cursor-not-allowed' : undefined}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {KOMPONEN_HIDRAN.map(({ key, judul, hint }) => {
          const nilaiKomponen = nilai[key] === 'HILANG' ? 'TIDAK_LAYAK' : nilai[key];
          const tidakStandar = nilaiKomponen === 'TIDAK_LAYAK';
          return (
            <div
              key={key}
              className={`p-2.5 rounded-[5px] border space-y-1.5 transition-colors ${
                tidakStandar
                  ? 'border-red-500/45 bg-red-500/[0.04]'
                  : 'border-[var(--border)] bg-[var(--bg-main)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--primary)]">{judul}</span>
                <span className="text-[10px] text-[var(--muted)]">{hint}</span>
              </div>
              <select
                value={nilaiKomponen}
                onChange={(e) => onUbahStatus(key, e.target.value as HydrantComponentStatus)}
                className={`w-full text-xs font-semibold p-1.5 rounded-[4px] border focus:outline-none ${
                  tidakStandar
                    ? 'border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400'
                    : 'border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                }`}
              >
                <option value="LAYAK">STANDAR</option>
                <option value="TIDAK_LAYAK">TIDAK STANDAR</option>
              </select>

              {tidakStandar && (
                <div className="space-y-1.5 pt-1">
                  <label className="block text-[10px] font-semibold text-red-600 dark:text-red-400">
                    Keterangan Tidak Standar ({judul}):
                  </label>
                  <input
                    autoFocus={!catatan[key]}
                    value={catatan[key] ?? ''}
                    onChange={(e) => onUbahCatatan(key, e.target.value)}
                    placeholder={`Tuliskan keterangan ketidaksesuaian ${judul.toLowerCase()}…`}
                    className="w-full text-[11px] px-2 py-1.5 rounded-[4px] border border-red-500/40 bg-[var(--bg-main)] text-[var(--primary)] placeholder-[var(--muted)] focus:outline-none focus:border-red-500"
                  />
                  <div className="flex flex-wrap gap-1">
                    {(SARAN_CATATAN_HIDRAN[key] ?? []).map((saran) => (
                      <button
                        key={saran}
                        type="button"
                        onClick={() => onUbahCatatan(key, saran)}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--bg-sidebar)] hover:bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--secondary)] cursor-pointer"
                      >
                        + {saran}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </fieldset>
  </div>
);
