import React from 'react';
import { CATEGORY_ACCENT } from '@/components/ui/accents';

interface AparStatsProps {
  total: number;
  jumlahZona: number;
  inProgress: number;
  completed: number;
  expiring: number;
}

/** Empat kartu ringkas di atas tabel APAR. */
export const AparStats: React.FC<AparStatsProps> = ({
  total,
  jumlahZona,
  inProgress,
  completed,
  expiring,
}) => (
  <div className="no-print grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
    <div className="p-3 bg-[var(--bg-main)] border border-[var(--border)] rounded-[6px] shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">Total Terdaftar</span>
        <span className="text-xs">🧯</span>
      </div>
      <div className="my-1.5">
        <div className="text-2xl font-bold font-mono text-[var(--primary)] tabular-nums">{total} Unit</div>
        <div className="text-[10px] text-[var(--muted)] mt-0.5 tabular-nums">{jumlahZona} Zona Terpantau</div>
      </div>
      <div className="text-[10px] text-[var(--muted)] pt-1 border-t border-[var(--border)]">Wajib periksa 1x per bulan</div>
    </div>

    <div
      className="p-3 rounded-[6px] shadow-xs flex flex-col justify-between border"
      style={{
        background: `linear-gradient(to bottom, ${CATEGORY_ACCENT.apar}17, ${CATEGORY_ACCENT.apar}05)`,
        borderColor: `${CATEGORY_ACCENT.apar}59`,
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: CATEGORY_ACCENT.apar }}>
          Sedang Berjalan
        </span>
        <span
          className="text-[10px] font-bold px-1.5 py-0.2 rounded text-white"
          style={{ backgroundColor: CATEGORY_ACCENT.apar }}
        >
          Prioritas
        </span>
      </div>
      <div className="my-1.5">
        <div className="text-2xl font-bold font-mono tabular-nums" style={{ color: CATEGORY_ACCENT.apar }}>
          {inProgress} Unit
        </div>
        <div className="text-[10px] mt-0.5" style={{ color: `${CATEGORY_ACCENT.apar}cc` }}>
          Menunggu / dalam proses verifikasi
        </div>
      </div>
      <div
        className="text-[10px] pt-1 border-t font-medium"
        style={{ color: CATEGORY_ACCENT.apar, borderColor: `${CATEGORY_ACCENT.apar}33` }}
      >
        Fokus inspeksi shift minggu ini
      </div>
    </div>

    <div className="p-3 bg-gradient-to-b from-emerald-500/[0.08] to-emerald-500/[0.02] dark:from-emerald-500/[0.14] dark:to-emerald-500/[0.04] border border-emerald-500/30 rounded-[6px] shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
          Selesai Diperiksa
        </span>
        <span className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.2 rounded">
          Lengkap
        </span>
      </div>
      <div className="my-1.5">
        <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
          {completed} Unit
        </div>
        <div className="text-[10px] text-[var(--muted)] mt-0.5">Hasil kelayakan terverifikasi</div>
      </div>
      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 pt-1 border-t border-emerald-500/20 font-medium">
        Laporan telah diterbitkan
      </div>
    </div>

    <div className="p-3 bg-[var(--bg-main)] border border-amber-500/30 rounded-[6px] shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
          Kadaluarsa ≤90 Hari
        </span>
        <span className="text-xs">⏳</span>
      </div>
      <div className="my-1.5">
        <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 tabular-nums">
          {expiring} Unit
        </div>
        <div className="text-[10px] text-[var(--muted)] mt-0.5">Segera jadwalkan isi ulang / ganti</div>
      </div>
      <div className="text-[10px] text-amber-600 dark:text-amber-400 pt-1 border-t border-amber-500/20 font-medium">
        Pantau periode kedaluwarsa di bawah
      </div>
    </div>
  </div>
);

