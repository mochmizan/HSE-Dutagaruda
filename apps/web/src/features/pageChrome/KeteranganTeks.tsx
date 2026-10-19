import React, { useEffect, useRef, useState } from 'react';

interface KeteranganTeksProps {
  /** Isi kolom Keterangan; boleh kosong. */
  teks?: string;
}

/** Tinggi tiga baris pada `line-height: 1.4`. */
const TINGGI_TIGA_BARIS = '4.2em';

/**
 * Isi kolom "Keterangan" pada tabel inspeksi.
 *
 * Dipotong maksimal tiga baris. Bila teksnya lebih panjang, baris terakhir
 * diredupkan dengan mask gradien — bukan garis potong keras — supaya terbaca
 * sebagai "masih ada lagi", dan teks utuhnya muncul sebagai tooltip.
 *
 * Mask dipakai alih-alih lapisan gradien berwarna karena baris tabel punya
 * latar berbeda (hijau, merah, netral); mask memudarkan teksnya sendiri
 * sehingga tidak bergantung pada warna latar di belakangnya.
 */
export const KeteranganTeks: React.FC<KeteranganTeksProps> = ({ teks }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [terpotong, setTerpotong] = useState(false);
  const isi = teks?.trim();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ukur = () => setTerpotong(el.scrollHeight - el.clientHeight > 1);
    ukur();

    const pengamat = new ResizeObserver(ukur);
    pengamat.observe(el);
    return () => pengamat.disconnect();
  }, [isi]);

  if (!isi) {
    return <span className="text-[10px] text-[var(--muted)]">–</span>;
  }

  return (
    <div className="relative text-left">
      <div
        ref={ref}
        title={isi}
        className="whitespace-pre-line break-words leading-[1.4] overflow-hidden"
        style={{
          maxHeight: TINGGI_TIGA_BARIS,
          ...(terpotong
            ? {
                maskImage: 'linear-gradient(to bottom, #000 62%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, #000 62%, transparent 100%)',
              }
            : null),
        }}
      >
        {isi}
      </div>
    </div>
  );
};
