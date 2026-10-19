import React from 'react';
import type { OverallStatus } from '../../types/domain';

interface AparInspectionOutcomeProps {
  overallStatus: OverallStatus;
  setOverallStatus: React.Dispatch<React.SetStateAction<OverallStatus>>;
  isOverridden: boolean;
  setIsOverridden: React.Dispatch<React.SetStateAction<boolean>>;
  notes: string;
  setNotes: React.Dispatch<React.SetStateAction<string>>;
  tindakLanjut: string;
  setTindakLanjut: React.Dispatch<React.SetStateAction<string>>;
}

/**
 * Status akhir otomatis (boleh diubah manual) + catatan temuan tambahan +
 * tindakan rekomendasi.
 */
export const AparInspectionOutcome: React.FC<AparInspectionOutcomeProps> = ({
  overallStatus,
  setOverallStatus,
  isOverridden,
  setIsOverridden,
  notes,
  setNotes,
  tindakLanjut,
  setTindakLanjut,
}) => {
  return (
    <>
      {/* Status akhir otomatis + ubah manual */}
      <div className="p-3 rounded-[6px] border border-[var(--border)] bg-[var(--bg-sidebar)] space-y-2">
        <div className="flex items-center justify-between gap-2">
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
            onChange={(e) => {
              setOverallStatus(e.target.value as OverallStatus);
              setIsOverridden(true);
            }}
            className={`text-xs font-semibold px-2 py-1 rounded-[4px] border cursor-pointer tabular-nums ${
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

      {/* Catatan */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-[var(--primary)]">
          Catatan Temuan Tambahan
        </label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Contoh: Tekanan pada zona hijau, segel utuh, selang lentur siap pakai…"
          className="w-full text-xs p-2.5 rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] placeholder-[var(--muted)] focus:outline-none focus:border-[#f2994a]"
        />
      </div>

      {/* Tindak lanjut */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-[var(--primary)]">
          Tindakan Rekomendasi / Tindak Lanjut{' '}
          <span className="text-[10px] font-normal text-[var(--muted)]">(opsional)</span>
        </label>
        <textarea
          rows={2}
          value={tindakLanjut}
          onChange={(e) => setTindakLanjut(e.target.value)}
          placeholder="Contoh: Isi ulang tabung & ganti segel sebelum akhir bulan…"
          className="w-full text-xs p-2.5 rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] placeholder-[var(--muted)] focus:outline-none focus:border-[#f2994a]"
        />
      </div>
    </>
  );
};
