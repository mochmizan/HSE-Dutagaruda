import React, { useEffect, useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { STANDARD_P3K_ITEMS } from '../../lib/p3kItems';
import { markFor, type P3kMonthData, type P3kMonthItemData } from './types';

interface P3kInspectionModalProps {
  isOpen: boolean;
  monthLabel: string;
  initial: P3kMonthData;
  onClose: () => void;
  onSave: (data: P3kMonthData) => void;
  onClear: () => void;
}

type ItemState = Record<number, P3kMonthItemData>;

function cloneItems(src: Record<number, P3kMonthItemData>): ItemState {
  const next: ItemState = {};
  for (const [k, v] of Object.entries(src)) next[Number(k)] = { ...v };
  return next;
}

/** Monthly input form for one P3K box: 21 actual quantities + expiry flags. */
export const P3kInspectionModal: React.FC<P3kInspectionModalProps> = ({
  isOpen,
  monthLabel,
  initial,
  onClose,
  onSave,
  onClear,
}) => {
  const [items, setItems] = useState<ItemState>({});
  const [tanggal, setTanggal] = useState('');
  const [paraf, setParaf] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setItems(cloneItems(initial.items));
    setTanggal(initial.tanggal);
    setParaf(initial.paraf);
  }, [isOpen, initial]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const draft: P3kMonthData = { items, tanggal, paraf };
  let lengkap = 0;
  let kurang = 0;
  let kd = 0;
  for (const item of STANDARD_P3K_ITEMS) {
    const mark = markFor(item.id, item.standardQty, draft);
    if (mark === 'standar') lengkap += 1;
    else if (mark === 'kurang') kurang += 1;
    else if (mark === 'kd') kd += 1;
  }

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg max-h-[90vh] flex flex-col bg-[var(--bg-main)] border border-[var(--border)] rounded-[8px] shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <div>
            <h2 className="text-sm font-bold text-[var(--primary)]">Isi Pemeriksaan – {monthLabel}</h2>
            <p className="text-[11px] text-[var(--muted)] tabular-nums">
              {lengkap}/21 lengkap · {kurang} kurang · {kd} kadaluarsa
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="p-1.5 rounded-[4px] text-[var(--muted)] hover:bg-[var(--bg-hover)] pressable cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
          {STANDARD_P3K_ITEMS.map((item) => {
            const row = items[item.id] ?? { actual: '', expired: false };
            return (
              <div
                key={item.id}
                className="flex items-center gap-2 py-1.5 border-b border-[var(--border)]/60 last:border-none"
              >
                <span className="w-6 text-[11px] text-[var(--muted)] tabular-nums">{item.id}</span>
                <span className="flex-1 text-xs text-[var(--primary)]">
                  {item.name}
                  <span className="block text-[10px] text-[var(--muted)] tabular-nums">
                    Standar: {item.standardQty} {item.unit}
                  </span>
                </span>
                <input
                  type="number"
                  min={0}
                  value={row.actual}
                  onChange={(e) => setActual(item.id, e.target.value)}
                  placeholder="0"
                  aria-label={`Jumlah aktual ${item.name}`}
                  className="w-16 text-center text-xs bg-transparent border border-[var(--border)] rounded-[4px] px-1.5 py-1 tabular-nums focus:outline-none focus:border-[#27ae60]"
                />
                <label className="flex items-center gap-1 text-[10px] text-[var(--muted)] cursor-pointer whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={row.expired}
                    onChange={(e) => setExpired(item.id, e.target.checked)}
                    className="accent-[#eb5757] w-3.5 h-3.5 cursor-pointer"
                  />
                  KD
                </label>
              </div>
            );
          })}

          <div className="grid grid-cols-2 gap-2 pt-3">
            <label className="block text-[11px] text-[var(--secondary)]">
              Tanggal Inspeksi
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="mt-1 w-full text-xs bg-transparent border border-[var(--border)] rounded-[4px] px-2 py-1.5 tabular-nums focus:outline-none focus:border-[#27ae60]"
              />
            </label>
            <label className="block text-[11px] text-[var(--secondary)]">
              Paraf &amp; Inisial
              <input
                type="text"
                value={paraf}
                onChange={(e) => setParaf(e.target.value)}
                placeholder="Nama pemeriksa"
                className="mt-1 w-full text-xs bg-transparent border border-[var(--border)] rounded-[4px] px-2 py-1.5 focus:outline-none focus:border-[#27ae60]"
              />
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-red-600 dark:text-red-400 hover:underline pressable cursor-pointer"
          >
            <Trash2 size={12} /> Hapus Bulan Ini
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-[var(--secondary)] border border-[var(--border)] rounded-[4px] hover:bg-[var(--bg-hover)] pressable cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => onSave(draft)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-[#27ae60] rounded-[4px] hover:brightness-95 pressable cursor-pointer"
            >
              Simpan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
