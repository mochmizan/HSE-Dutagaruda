import React from 'react';

type NadaKartu = 'netral' | 'aksen' | 'hijau' | 'amber';

interface KartuStatistikProps {
  nada: NadaKartu;
  judul: string;
  nilai: number;
  satuan?: string;
  /** Baris kedua di bawah angka, mis. jumlah zona. */
  rincian?: string;
  /** Lencana kecil di kanan judul, mis. `Lengkap` / `Prioritas`. */
  lencana?: string;
  /** Kaki kartu di atas garis pemisah. */
  kaki: string;
  ikon?: React.ReactNode;
  /** Warna aksen untuk `nada="aksen"`; wajib bila nada aksen. */
  aksen?: string;
  /** Isi tambahan di bawah angka — dipakai saat kartu melebar (mis. bilah progres). */
  isi?: React.ReactNode;
}

const KELAS_WADAH: Record<NadaKartu, string> = {
  netral: 'bg-[var(--bg-main)] border-[var(--border)]',
  aksen: '',
  hijau:
    'bg-gradient-to-br from-emerald-500/[0.10] via-emerald-500/[0.04] to-transparent dark:from-emerald-500/[0.16] dark:via-emerald-500/[0.06] border-emerald-500/30',
  amber:
    'bg-gradient-to-br from-amber-500/[0.10] via-amber-500/[0.04] to-transparent dark:from-amber-500/[0.16] dark:via-amber-500/[0.06] border-amber-500/30',
};

const KELAS_LENCANA: Record<NadaKartu, string> = {
  netral: 'bg-[var(--bg-hover)] text-[var(--secondary)] border-[var(--border)]',
  hijau: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  amber: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  aksen: 'text-white border-transparent',
};

const KELAS_ANGKA: Record<NadaKartu, string> = {
  netral: 'text-[var(--primary)]',
  hijau: 'text-emerald-600 dark:text-emerald-400',
  amber: 'text-amber-600 dark:text-amber-400',
  aksen: '',
};

const KELAS_JUDUL: Record<NadaKartu, string> = {
  netral: 'text-[var(--muted)]',
  hijau: 'text-emerald-600 dark:text-emerald-400',
  amber: 'text-amber-600 dark:text-amber-400',
  aksen: '',
};

const KELAS_IKON: Record<NadaKartu, string> = {
  netral: 'bg-[var(--bg-hover)] border-[var(--border)]',
  hijau: 'bg-emerald-500/15 border-emerald-500/25',
  amber: 'bg-amber-500/15 border-amber-500/25',
  aksen: 'bg-white/20 border-white/30',
};

const KELAS_KAKI: Record<NadaKartu, string> = {
  netral: 'text-[var(--muted)] border-[var(--border)]',
  hijau: 'text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  amber: 'text-amber-600 dark:text-amber-400 border-amber-500/20',
  aksen: '',
};

/**
 * Satu kartu statistik untuk halaman inspeksi.
 *
 * Hydrant dan APAR memakai komponen yang sama supaya bentuk, ukuran angka, dan
 * warnanya tidak menyimpang antar halaman.
 */
export const KartuStatistik: React.FC<KartuStatistikProps> = ({
  nada,
  judul,
  nilai,
  satuan = 'Unit',
  rincian,
  lencana,
  kaki,
  ikon,
  aksen,
  isi,
}) => {
  const gayaAksen =
    nada === 'aksen' && aksen
      ? {
          background: `linear-gradient(to bottom, ${aksen}17, ${aksen}05)`,
          borderColor: `${aksen}59`,
        }
      : undefined;

  const gayaJudul = nada === 'aksen' && aksen ? { color: aksen } : undefined;
  const gayaAngka = nada === 'aksen' && aksen ? { color: aksen } : undefined;
  const gayaLencana = nada === 'aksen' && aksen ? { backgroundColor: aksen } : undefined;
  const gayaKaki =
    nada === 'aksen' && aksen ? { color: aksen, borderColor: `${aksen}33` } : undefined;

  return (
    <div
      className={`p-3 rounded-[6px] border shadow-xs flex flex-col justify-between ${KELAS_WADAH[nada]}`}
      style={gayaAksen}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {ikon && (
            <span
              className={`w-6 h-6 rounded-[5px] border grid place-items-center text-[12px] leading-none flex-shrink-0 ${KELAS_IKON[nada]}`}
            >
              {ikon}
            </span>
          )}
          <span
            className={`text-[11px] uppercase tracking-wider font-semibold truncate ${KELAS_JUDUL[nada]}`}
            style={gayaJudul}
          >
            {judul}
          </span>
        </div>
        {lencana && (
          <span
            className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-[3px] border flex-shrink-0 ${KELAS_LENCANA[nada]}`}
            style={gayaLencana}
          >
            {lencana}
          </span>
        )}
      </div>

      <div className="mt-2.5">
        <div className="flex items-baseline gap-1.5">
          <span
            className={`text-[26px] leading-none font-bold font-mono tabular-nums ${KELAS_ANGKA[nada]}`}
            style={gayaAngka}
          >
            {nilai}
          </span>
          <span className="text-[11px] font-medium text-[var(--muted)]">{satuan}</span>
        </div>
        {rincian && (
          <p className="mt-1 text-[10px] text-[var(--muted)] tabular-nums">{rincian}</p>
        )}
        {isi}
      </div>

      <div
        className={`mt-2.5 pt-1.5 border-t text-[10px] font-medium ${KELAS_KAKI[nada]}`}
        style={gayaKaki}
      >
        {kaki}
      </div>
    </div>
  );
};
