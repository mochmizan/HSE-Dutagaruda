import React, { useEffect, useState } from 'react';
import type { ApiInspeksiP3k } from '@/services/api/klien';
import { STANDARD_P3K_ITEMS, type P3kBoxType, type StandardP3kItemDefinition } from '@/lib/p3kItems';
import { P3kInspectionBody, ringkasanDraf } from './P3kInspectionBody';
import { P3kDeleteConfirmation, P3kInspectionFooter, type CakupanHapusP3k } from './P3kInspectionFooter';
import { P3kInspectionHeader } from './P3kInspectionHeader';
import { P3kInspectionShell } from './P3kInspectionShell';
import type { P3kMonthData, P3kMonthItemData } from './types';

interface P3kInspectionModalProps {
  isOpen: boolean;
  monthLabel: string;
  unitKode?: string;
  initial: P3kMonthData;
  itemsCatalog?: StandardP3kItemDefinition[];
  boxType?: P3kBoxType;
  rekam: ApiInspeksiP3k | null;
  menyimpan: boolean;
  menghapusBulan: boolean;
  menghapusUnit?: boolean;
  onClose: () => void;
  onSave: (data: P3kMonthData) => Promise<void>;
  onClear: () => void;
  onHapusUnit?: () => void;
}

type ItemState = Record<number, P3kMonthItemData>;

function initItems(
  src: Record<number, P3kMonthItemData>,
  catalog: StandardP3kItemDefinition[],
): ItemState {
  const next: ItemState = {};
  for (const std of catalog) {
    const existing = src[std.id];
    if (existing && existing.actual !== '') {
      next[std.id] = { ...existing };
    } else {
      next[std.id] = { actual: std.standardQty, expired: existing?.expired ?? false };
    }
  }
  return next;
}

export const P3kInspectionModal: React.FC<P3kInspectionModalProps> = ({
  isOpen,
  monthLabel,
  unitKode = '',
  initial,
  itemsCatalog = STANDARD_P3K_ITEMS,
  boxType = 'A',
  rekam,
  menyimpan,
  menghapusBulan,
  menghapusUnit = false,
  onClose,
  onSave,
  onClear,
  onHapusUnit,
}) => {
  const [items, setItems] = useState<ItemState>({});
  const [tanggal, setTanggal] = useState('');
  const [paraf, setParaf] = useState('');
  const [konfirmasiHapus, setKonfirmasiHapus] = useState<CakupanHapusP3k | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setItems(initItems(initial.items, itemsCatalog));
    setTanggal(initial.tanggal);
    setParaf(initial.paraf || 'Takamay Jason H. I.');
  }, [isOpen, initial, itemsCatalog]);

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
  const { lengkap, kurang, kd } = ringkasanDraf(draft, itemsCatalog);

  const setStatus = (id: number, status: 'STANDAR' | 'TIDAK_STANDAR', standardQty: number) => {
    setItems((prev) => {
      const row = prev[id] ?? { actual: standardQty, expired: false };
      return {
        ...prev,
        [id]: { ...row, actual: status === 'STANDAR' ? standardQty : 0 },
      };
    });
  };

  const setExpired = (id: number, value: boolean) => {
    setItems((prev) => {
      const row = prev[id] ?? { actual: '', expired: false };
      return { ...prev, [id]: { ...row, expired: value } };
    });
  };

  const handleTerbitkan = async () => {
    await onSave(draft);
    onClose();
  };

  return (
    <P3kInspectionShell
      onSubmit={handleTerbitkan}
      onClose={onClose}
      header={
        <P3kInspectionHeader
          monthLabel={`${monthLabel} · Tipe ${boxType}`}
          lengkap={lengkap}
          kurang={kurang}
          kd={kd}
          onClose={onClose}
        />
      }
      konfirmasi={
        <P3kDeleteConfirmation
          konfirmasi={konfirmasiHapus}
          unitKode={unitKode || monthLabel}
          monthLabel={monthLabel}
          onTutup={() => setKonfirmasiHapus(null)}
          onKonfirmasi={(cakupan) => {
            setKonfirmasiHapus(null);
            if (cakupan === 'BULAN') onClear();
            else onHapusUnit?.();
          }}
        />
      }
    >
      <P3kInspectionBody
        draft={draft}
        itemsCatalog={itemsCatalog}
        boxType={boxType}
        lengkap={lengkap}
        kurang={kurang}
        kd={kd}
        onUbahStatus={setStatus}
        onUbahExpired={setExpired}
        onUbahTanggal={setTanggal}
        onUbahParaf={setParaf}
      />

      <P3kInspectionFooter
        adaUnit={Boolean(onHapusUnit)}
        adaInspeksi={Boolean(rekam)}
        menghapusBulan={menghapusBulan || menyimpan}
        menghapusUnit={menghapusUnit}
        menyimpan={menyimpan}
        onMintaKonfirmasi={setKonfirmasiHapus}
      />
    </P3kInspectionShell>
  );
};
