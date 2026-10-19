import React from 'react';

interface RingkasanInspeksiProps {
  /** Judul kartu kiri, mis. `Total Hydrant Terdaftar` / `Total APAR Terdaftar`. */
  judulTotal: string;
  /** Ikon kecil di kanan judul kartu kiri. */
  ikon: React.ReactNode;
  /** Kaki kartu kiri, mis. `Wajib periksa 1x per bulan`. */
  kakiTotal: string;
  total: number;
  selesai: number;
  berjalan: number;
  jumlahZona: number;
  /** Kaki kartu kanan. */
  kakiSelesai: string;
}

const persen = (bagian: number, total: number) => (total ? Math.round((bagian / total) * 100) : 0);

/** Cincin progres kecil untuk kartu "Selesai Diperiksa". */
const CincinProgres: React.FC<{ persen: number }> = ({ persen: nilai }) => {
  const r = 23;
  const keliling = 2 * Math.PI * r;
  const terisi = (Math.min(100, Math.max(0, nilai)) / 100) * keliling;
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" className="flex-shrink-0" aria-hidden="true">
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        strokeWidth="5"
        className="stroke-[var(--bg-hover)]"
      />
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        strokeWidth="5"
        strokeLinecap="round"
        className="stroke-emerald-500 transition-[stroke-dasharray] duration-500 ease-out"
        strokeDasharray={`${terisi} ${keliling - terisi}`}
        transform="rotate(-90 32 32)"
      />
      <text
        x="32"
        y="32"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-[var(--primary)] text-[13px] font-bold tabular-nums"
      >
        {nilai}%
      </text>
    </svg>
  );
};

/** Satu potongan bilah komposisi. */
const Potongan: React.FC<{ lebar: number; kelas: string; judul: string }> = ({ lebar, kelas, judul }) => (
  <div className={`${kelas} transition-[width] duration-500 ease-out`} style={{ width: `${lebar}%` }} title={judul} />
);

/**
 * Dua kartu ringkas di atas tabel: total unit dan unit selesai.
 *
 * Dipakai Hydrant dan APAR tanpa variasi, supaya kedua halaman tidak bisa
 * berbeda bentuk. Kartu kiri memakai ruangnya untuk bilah komposisi
 * (selesai/berjalan/belum), kartu kanan untuk cincin persentase — bukan empat
 * kartu sempit yang masing-masing hanya memuat satu angka.
 */
export const RingkasanInspeksi: React.FC<RingkasanInspeksiProps> = ({
  judulTotal,
  ikon,
  kakiTotal,
  total,
  selesai,
  berjalan,
  jumlahZona,
  kakiSelesai,
}) => {
  const belum = Math.max(0, total - selesai - berjalan);
  const pSelesai = persen(selesai, total);
  const pBerjalan = persen(berjalan, total);
  const pBelum = Math.max(0, 100 - pSelesai - pBerjalan);

  return (
    <div className="no-print grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
      {/* ── Total terdaftar + komposisi ── */}
      <div className="p-3.5 bg-[var(--bg-main)] border border-[var(--border)] rounded-[6px] shadow-xs flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <span className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
            {judulTotal}
          </span>
          <span className="text-xs leading-none">{ikon}</span>
        </div>

        <div className="mt-1.5 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="text-2xl font-bold font-mono text-[var(--primary)] tabular-nums leading-none">
              {total} <span className="text-sm font-semibold">Unit</span>
            </div>
            <div className="text-[10px] text-[var(--muted)] mt-1.5 tabular-nums">
              {jumlahZona} Zona Terpantau
            </div>
          </div>

          {/* Komposisi: satu bilah, tiga warna, legenda di bawahnya. */}
          <div className="flex-1 min-w-[150px] max-w-[260px]">
            <div className="flex h-2 rounded-full overflow-hidden bg-[var(--bg-hover)]">
              <Potongan lebar={pSelesai} kelas="bg-emerald-500" judul={`${selesai} selesai`} />
              <Potongan lebar={pBerjalan} kelas="bg-amber-500" judul={`${berjalan} berjalan`} />
              <Potongan lebar={pBelum} kelas="bg-[var(--border)]" judul={`${belum} belum diperiksa`} />
            </div>
            <div className="mt-1.5 flex items-center gap-3 flex-wrap text-[10px] text-[var(--muted)] tabular-nums">
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {selesai} selesai
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {berjalan} berjalan
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--border)]" />
                {belum} belum
              </span>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-2.5 text-[10px] text-[var(--muted)] border-t border-[var(--border)]">
          {kakiTotal}
        </div>
      </div>

      {/* ── Selesai diperiksa + cincin ── */}
      <div className="p-3.5 bg-gradient-to-br from-emerald-500/[0.10] to-emerald-500/[0.02] dark:from-emerald-500/[0.16] dark:to-emerald-500/[0.04] border border-emerald-500/30 rounded-[6px] shadow-xs flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Selesai Diperiksa
          </span>
          <span className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.2 rounded">
            Lengkap
          </span>
        </div>

        <div className="mt-1.5 flex items-center justify-between gap-4">
          <div>
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums leading-none">
              {selesai} <span className="text-sm font-semibold">Unit</span>
            </div>
            <div className="text-[10px] text-[var(--muted)] mt-1.5 tabular-nums">
              dari {total} unit terdaftar
            </div>
          </div>
          <CincinProgres persen={pSelesai} />
        </div>

        <div className="mt-auto pt-2.5 text-[10px] text-emerald-600 dark:text-emerald-400 border-t border-emerald-500/20 font-medium">
          {kakiSelesai}
        </div>
      </div>
    </div>
  );
};
