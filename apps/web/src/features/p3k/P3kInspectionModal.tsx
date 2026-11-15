import React, { useEffect, useState } from 'react';
import type { ApiInspeksiP3k } from '@/services/api/klien';
import { P3kInspectionBody, ringkasanDraf } from './P3kInspectionBody';
import { P3kDeleteConfirmation, P3kInspectionFooter } from './P3kInspectionFooter';
import { P3kInspectionHeader } from './P3kInspectionHeader';
import { P3kInspectionShell } from './P3kInspectionShell';
import type { P3kMonthData, P3kMonthItemData } from './types';

interface P3kInspectionModalProps {
  isOpen: boolean;
  monthLabel: string;
  initial: P3kMonthData;
  /** Rekam tersimpan bulan ini; null = belum ada (belum terbit). */
  rekam: ApiInspeksiP3k | null;
  menyimpan: boolean;
  menghapusBulan: boolean;
  onClose: () => void;
  onSave: (data: P3kMonthData) => Promise<void>;
  onClear: () => void;
}

type ItemState = Record<number, P3kMonthItemData>;

function cloneItems(src: Record<number, P3kMonthItemData>): ItemState {
  const next: ItemState = {};
  for (const [k, v] of Object.entries(src)) next[Number(k)] = { ...v };
  return next;
}

/**
 * Form input satu bulan kotak P3K: 21 kuantitas aktual + flag KD +
 * tanggal/paraf. Semua state + efek di sini; anak-anak presentasional.
 *
 * Potret terbit adalah cerminan rekam tersimpan (ada rekam = terbit =
 * baca-saja), bukan state bebas: satu-satunya penulis `terbit` adalah efek
 * di bawah (`[isOpen, rekam?.id]`). Penerbitan yang gagal tak boleh
 * menyisakan potret "Terbit" untuk rekam yang tak ada. `Edit` membuka kunci
 * lokal (rekam P3K tidak membawa `approval_status` seperti Hydrant, jadi
 * batal-terbit tak menulis apa pun ke server) sampai Terbitkan menyimpan
 * ulang.
 */
export const P3kInspectionModal: React.FC<P3kInspectionModalProps> = ({
  isOpen,
  monthLabel,
  initial,
  rekam,
  menyimpan,
  menghapusBulan,
  onClose,
  onSave,
  onClear,
}) => {
  const [items, setItems] = useState<ItemState>({});
  const [tanggal, setTanggal] = useState('');
  const [paraf, setParaf] = useState('');
  /** Rekam sudah tersimpan: potret baca-saja; tombol berubah menjadi Edit. */
  const [terbit, setTerbit] = useState(false);
  /** `Terbitkan` menulis ke API dulu; potret mengikuti rekam. */
  const [menerbitkan, setMenerbitkan] = useState(false);
  const [konfirmasiHapus, setKonfirmasiHapus] = useState(false);

  // Isi form dari rekam/draf saat dibuka.
  useEffect(() => {
    if (!isOpen) return;
    setItems(cloneItems(initial.items));
    setTanggal(initial.tanggal);
    setParaf(initial.paraf);
  }, [isOpen, initial]);

  // Potret terbit mencerminkan rekam: hanya efek ini yang boleh menulis
  // `terbit` dari rekam, jadi layar tak bisa lebih maju dari server.
  useEffect(() => {
    if (isOpen) setTerbit(Boolean(rekam));
  }, [isOpen, rekam?.id]);

  // Esc + kunci scroll badan saat terbuka. WAJIB di atas
  // `if (!isOpen) return null`: efek harus dipanggil setiap render.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const draft: P3kMonthData = { items, tanggal, paraf };
  const { lengkap, kurang, kd } = ringkasanDraf(draft);

  /** Rekam yang sedang tampil; `terbit` hanya benar bila rekam ini ada. */
  const idRekam = rekam?.id ?? null;

  const setActual = (id: number, raw: string) => {
    setItems((prev) => {
      const row = prev[id] ?? { actual: '', expired: false };
      if (raw === '') return { ...prev, [id]: { ...row, actual: '' } };
      const n = Number.parseInt(raw, 10);
      return { ...prev, [id]: { ...row, actual: Number.isNaN(n) ? row.actual : Math.max(0, n) } };
    });
  };

  const setExpired = (id: number, value: boolean) => {
    setItems((prev) => {
      const row = prev[id] ?? { actual: '', expired: false };
      return { ...prev, [id]: { ...row, expired: value } };
    });
  };

  const handleTerbitkan = async () => {
    setMenerbitkan(true);
    try {
      // Gagal simpan = hook sudah mengingatkan (alert Indonesia); modal
      // tetap terbuka dalam modus sunting, tanpa potret Terbit palsu.
      await onSave(draft);
      onClose();
    } finally {
      setMenerbitkan(false);
    }
  };

  return (
    <P3kInspectionShell
      onSubmit={handleTerbitkan}
      onClose={onClose}
      header={
        <P3kInspectionHeader
          monthLabel={monthLabel}
          terbit={terbit}
          lengkap={lengkap}
          kurang={kurang}
          kd={kd}
          onClose={onClose}
        />
      }
      konfirmasi={
        <P3kDeleteConfirmation
          terbuka={konfirmasiHapus}
          monthLabel={monthLabel}
          onTutup={() => setKonfirmasiHapus(false)}
          onKonfirmasi={onClear}
        />
      }
    >
      <P3kInspectionBody
        draft={draft}
        lengkap={lengkap}
        kurang={kurang}
        kd={kd}
        terbit={terbit}
        onUbahActual={setActual}
        onUbahExpired={setExpired}
        onUbahTanggal={setTanggal}
        onUbahParaf={setParaf}
      />

      <P3kInspectionFooter
        adaInspeksi={Boolean(rekam)}
        menghapusBulan={menghapusBulan || menyimpan}
        terbit={terbit}
        menerbitkan={menerbitkan || menyimpan}
        idRekam={idRekam}
        onMintaKonfirmasi={() => setKonfirmasiHapus(true)}
        onBatalkanTerbit={() => setTerbit(false)}
      />
    </P3kInspectionShell>
  );
};
