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
    'bg-gradient-to-b from-emerald-500/[0.08] to-emerald-500/[0.02] dark:from-emerald-500/[0.14] dark:to-emerald-500/[0.04] border-emerald-500/30',
  amber: 'bg-[var(--bg-main)] border-amber-500/30',
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

  const warnaJudul = nada === 'aksen' && aksen ? { color: aksen } : undefined;

  return (
    <div
      className={`p-3 rounded-[6px] border shadow-xs flex flex-col justify-between ${KELAS_WADAH[nada]}`}
      style={gayaAksen}
    >
      <div className="flex items-center justify-between">
        <span
          className={`text-[11px] uppercase tracking-wider ${
            nada === 'netral' ? 'font-semibold text-[var(--muted)]' : 'font-bold'
          } ${
            nada === 'hijau'
              ? 'text-emerald-600 dark:text-emerald-400'
              : nada === 'amber'
              ? 'text-amber-600 dark:text-amber-400'
              : ''
          }`}
          style={warnaJudul}
        >
          {judul}
        </span>
        {lencana ? (
          <span
            className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
              nada === 'hijau'
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                : nada === 'aksen'
                ? 'text-white'
                : ''
            }`}
            style={nada === 'aksen' && aksen ? { backgroundColor: aksen } : undefined}
          >
            {lencana}
          </span>
        ) : (
          ikon && <span className="text-xs">{ikon}</span>
        )}
      </div>

      <div className="my-1.5">
        <div className="flex items-end gap-2 flex-wrap">
          <div
            className={`text-2xl font-bold font-mono tabular-nums ${
              nada === 'netral'
                ? 'text-[var(--primary)]'
                : nada === 'hijau'
                ? 'text-emerald-600 dark:text-emerald-400'
                : nada === 'amber'
                ? 'text-amber-600 dark:text-amber-400'
                : ''
            }`}
            style={nada === 'aksen' && aksen ? { color: aksen } : undefined}
          >
            {nilai} {satuan}
          </div>
          {rincian && (
            <div className="text-[10px] text-[var(--muted)] pb-1 tabular-nums">{rincian}</div>
          )}
        </div>
        {isi}
      </div>

      <div
        className={`text-[10px] pt-1 border-t font-medium ${
          nada === 'netral'
            ? 'text-[var(--muted)] border-[var(--border)] font-normal'
            : nada === 'hijau'
            ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
            : nada === 'amber'
            ? 'text-amber-600 dark:text-amber-400 border-amber-500/20'
            : ''
        }`}
        style={nada === 'aksen' && aksen ? { color: aksen, borderColor: `${aksen}33` } : undefined}
      >
        {kaki}
      </div>
    </div>
  );
};
