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
 * Selalu mod sunting: bulan terisi dibuka dengan nilai yang langsung bisa
 * diubah, `Terbitkan` menyimpan ulang (upsert), `Hapus Bulan Ini` selalu
 * tampil di kiri (konfirmasi dulu via ConfirmModal).
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
  const [konfirmasiHapus, setKonfirmasiHapus] = useState(false);
  // `rekam` dipertahankan di props agar pemanggil tak berubah; alur lama
  // selalu sunting sehingga nilainya tak memengaruhi mod.
  void rekam;

  // Isi form dari rekam/draf saat dibuka. Selalu mod sunting: bulan terisi
  // pun dibuka dengan nilai yang langsung bisa diubah — tanpa potret
  // baca-saja / tombol Edit.
  useEffect(() => {
    if (!isOpen) return;
    setItems(cloneItems(initial.items));
    setTanggal(initial.tanggal);
    setParaf(initial.paraf);
  }, [isOpen, initial]);

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
    // Gagal simpan = hook sudah mengingatkan (alert Indonesia); modal
    // tetap terbuka dalam modus sunting.
    await onSave(draft);
    onClose();
  };

  return (
    <P3kInspectionShell
      onSubmit={handleTerbitkan}
      onClose={onClose}
      header={
        <P3kInspectionHeader
          monthLabel={monthLabel}
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
        onUbahActual={setActual}
        onUbahExpired={setExpired}
        onUbahTanggal={setTanggal}
        onUbahParaf={setParaf}
      />

      <P3kInspectionFooter
        menghapusBulan={menghapusBulan || menyimpan}
        menyimpan={menyimpan}
        onMintaKonfirmasi={() => setKonfirmasiHapus(true)}
      />
    </P3kInspectionShell>
  );
};
