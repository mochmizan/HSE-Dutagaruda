import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface NoUrutProps {
  /** Nomor baris pada urutan tampil saat ini (1..n). */
  nomor: number;
  bisaNaik: boolean;
  bisaTurun: boolean;
  onNaik: () => void;
  onTurun: () => void;
}

const KELAS_TOMBOL =
  'p-0 leading-none rounded-[2px] text-[var(--muted)] transition-colors ' +
  'hover:text-[var(--primary)] hover:bg-[var(--bg-hover)] active:scale-[0.9] ' +
  'disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-transparent ' +
  'disabled:hover:text-[var(--muted)] focus-visible:outline-2 focus-visible:outline-[var(--primary)]';

/**
 * Sel "No." tabel inspeksi: nomor baris plus panah naik/turun.
 *
 * Nomor sengaja tetap 1..n mengikuti urutan tampil, bukan nomor identitas
 * aset — setelah baris dipindah, nomornya ikut bergeser.
 *
 * Panah disembunyikan saat mencetak (`print:hidden`) supaya kertas hanya berisi
 * nomor; urutan yang tercetak tetap urutan yang tersimpan.
 */
export const NoUrut: React.FC<NoUrutProps> = ({
  nomor,
  bisaNaik,
  bisaTurun,
  onNaik,
  onTurun,
}) => (
  <div className="flex items-center justify-center gap-0.5">
    <span className="font-mono tabular-nums w-4 text-right">{nomor}</span>
    <span className="flex flex-col print:hidden">
      <button
        type="button"
        aria-label={`Naikkan baris ${nomor}`}
        title="Naikkan"
        disabled={!bisaNaik}
        onClick={(e) => {
          e.stopPropagation();
          onNaik();
        }}
        className={KELAS_TOMBOL}
      >
        <ChevronUp size={11} strokeWidth={2.5} />
      </button>
      <button
        type="button"
        aria-label={`Turunkan baris ${nomor}`}
        title="Turunkan"
        disabled={!bisaTurun}
        onClick={(e) => {
          e.stopPropagation();
          onTurun();
        }}
        className={KELAS_TOMBOL}
      >
        <ChevronDown size={11} strokeWidth={2.5} />
      </button>
    </span>
  </div>
);
