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
 * Status akhir otomatis (Standar / Tidak Standar) + Catatan Temuan Tambahan + Tindakan Rekomendasi.
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
      <div className="flex items-center justify-between gap-2">
        <div>
          <label className="text-xs font-semibold text-[var(--primary)]">
            Hasil Status Akhir (Standar / Tidak Standar)
          </label>
          <p className="text-[10px] text-[var(--muted)]">
            Dihitung otomatis dari 7 komponen di atas. Anda dapat menyesuaikan bila ada catatan khusus.
          </p>
        </div>

        <select
          value={overallStatus}
          onChange={(e) => onUbahOverallStatus(e.target.value as OverallStatus)}
          disabled={terbit}
          className={`text-xs font-semibold px-2.5 py-1 rounded-[4px] border cursor-pointer tabular-nums disabled:opacity-60 disabled:cursor-not-allowed ${
            overallStatus === 'LAYAK'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : overallStatus === 'LAYAK_DENGAN_CATATAN'
              ? 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400'
          }`}
        >
          <option value="LAYAK">STANDAR</option>
          <option value="LAYAK_DENGAN_CATATAN">STANDAR DENGAN CATATAN</option>
          <option value="TIDAK_LAYAK">TIDAK STANDAR</option>
        </select>
      </div>

      {isOverridden && (
        <p className="text-[10px] text-amber-600 dark:text-amber-400 italic">
          *Status telah disesuaikan secara manual oleh petugas pemeriksa.
        </p>
      )}
    </div>

    {/* Catatan Temuan Tambahan */}
    <div className="space-y-1">
      <label className="text-xs font-semibold text-[var(--primary)]">
        Catatan Temuan Tambahan
      </label>
      <textarea
        rows={2}
        value={notes}
        onChange={(e) => onUbahNotes(e.target.value)}
        disabled={terbit}
        placeholder="Tuliskan catatan temuan tambahan hasil pemeriksaan unit APAR…"
        className="w-full text-xs p-2.5 rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] placeholder-[var(--muted)] focus:outline-none focus:border-[#2383e2] disabled:opacity-60 disabled:cursor-not-allowed"
      />
    </div>

    {/* Tindakan Rekomendasi */}
    <div className="space-y-1">
      <label className="text-xs font-semibold text-[var(--primary)]">
        Tindakan Rekomendasi
      </label>
      <textarea
        rows={2}
        value={tindakLanjut}
        onChange={(e) => onUbahTindakLanjut(e.target.value)}
        disabled={terbit}
        placeholder="Tuliskan tindakan rekomendasi perbaikan / isi ulang tabung…"
        className="w-full text-xs p-2.5 rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] placeholder-[var(--muted)] focus:outline-none focus:border-[#2383e2] disabled:opacity-60 disabled:cursor-not-allowed"
      />
    </div>
  </>
);
