import React from 'react';
import type { OverallStatus } from '../../types/hse';

interface AparInspectionOutcomeProps {
  overallStatus: OverallStatus;
  isOverridden: boolean;
  terbit: boolean;
  notes: string;
  tindakLanjut: string;
  onUbahOverallStatus: (value: OverallStatus) => void;
  onUbahNotes: (value: string) => void;
  onUbahTindakLanjut: (value: string) => void;
}

/**
 * Status akhir otomatis + catatan temuan + tindak lanjut.
 *
 * Select status menulis `isOverridden`; status otomatis hanya dihitung ulang
 * selama petugas belum menimpanya.
 */
export const AparInspectionOutcome: React.FC<AparInspectionOutcomeProps> = ({
  overallStatus,
  isOverridden,
  terbit,
  notes,
  tindakLanjut,
  onUbahOverallStatus,
  onUbahNotes,
  onUbahTindakLanjut,
}) => (
  <>
    {/* Auto-computed Status Bar with Manual Override */}
    <div className="p-3 rounded-[6px] border border-[var(--border)] bg-[var(--bg-sidebar)] space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-xs font-semibold text-[var(--primary)]">
            Hasil Status Akhir (Saran Otomatis)
          </label>
          <p className="text-[10px] text-[var(--muted)]">
            Dihitung otomatis dari 7 komponen di atas. Anda dapat mengubahnya jika ada catatan khusus.
          </p>
        </div>

        <select
          value={overallStatus}
          onChange={(e) => onUbahOverallStatus(e.target.value as OverallStatus)}
          disabled={terbit}
          className={`text-xs font-semibold px-2 py-1 rounded-[4px] border cursor-pointer tabular-nums disabled:opacity-60 disabled:cursor-not-allowed ${
            overallStatus === 'LAYAK'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : overallStatus === 'LAYAK_DENGAN_CATATAN'
              ? 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400'
          }`}
        >
          <option value="LAYAK">LAYAK</option>
          <option value="LAYAK_DENGAN_CATATAN">LAYAK DENGAN CATATAN</option>
          <option value="TIDAK_LAYAK">TIDAK LAYAK</option>
        </select>
      </div>

      {isOverridden && (
        <p className="text-[10px] text-amber-600 dark:text-amber-400 italic">
          *Status telah disesuaikan secara manual oleh petugas pemeriksa.
        </p>
      )}
    </div>

    {/* Notes */}
    <div className="space-y-1">
      <label className="text-xs font-semibold text-[var(--primary)]">
        Catatan Temuan Tambahan
      </label>
      <textarea
        rows={2}
        value={notes}
        onChange={(e) => onUbahNotes(e.target.value)}
        disabled={terbit}
        placeholder="Contoh: Tekanan pada zona hijau, segel utuh, selang lentur siap pakai…"
        className="w-full text-xs p-2.5 rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] placeholder-[var(--muted)] focus:outline-none focus:border-[#2383e2] disabled:opacity-60 disabled:cursor-not-allowed"
      />
    </div>

    {/* Tindak lanjut — opsional */}
    <div className="space-y-1">
      <label className="text-xs font-semibold text-[var(--primary)]">
        Tindakan Rekomendasi / Tindak Lanjut{' '}
        <span className="text-[10px] font-normal text-[var(--muted)]">(opsional)</span>
      </label>
      <textarea
        rows={2}
        value={tindakLanjut}
        onChange={(e) => onUbahTindakLanjut(e.target.value)}
        disabled={terbit}
        placeholder="Contoh: Isi ulang tabung dan ganti segel sebelum akhir bulan…"
        className="w-full text-xs p-2.5 rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] placeholder-[var(--muted)] focus:outline-none focus:border-[#2383e2] disabled:opacity-60 disabled:cursor-not-allowed"
      />
    </div>
  </>
);
