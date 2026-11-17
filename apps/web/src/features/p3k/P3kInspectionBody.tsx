import React from 'react';
import { STANDARD_P3K_ITEMS, type P3kBoxType, type StandardP3kItemDefinition } from '../../lib/p3kItems';
import { markFor, type P3kMonthData, type P3kMonthItemData } from './types';

interface P3kInspectionBodyProps {
  draft: P3kMonthData;
  itemsCatalog?: StandardP3kItemDefinition[];
  boxType?: P3kBoxType;
  lengkap: number;
  kurang: number;
  kd: number;
  onUbahStatus: (id: number, status: 'STANDAR' | 'TIDAK_STANDAR', standardQty: number) => void;
  onUbahExpired: (id: number, value: boolean) => void;
  onUbahTanggal: (value: string) => void;
  onUbahParaf: (value: string) => void;
}

type ItemState = Record<number, P3kMonthItemData>;

const BarisItem: React.FC<{
  id: number;
  name: string;
  standardQty: number;
  unit: string;
  row: P3kMonthItemData;
  onUbahStatus: (status: 'STANDAR' | 'TIDAK_STANDAR') => void;
  onUbahExpired: (value: boolean) => void;
}> = ({ id, name, standardQty, unit, row, onUbahStatus, onUbahExpired }) => {
  const currentStatus: 'STANDAR' | 'TIDAK_STANDAR' =
    row.actual === '' || Number(row.actual) >= standardQty ? 'STANDAR' : 'TIDAK_STANDAR';
  const tidakStandar = currentStatus === 'TIDAK_STANDAR';

  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-[var(--border)]/60 last:border-none">
      <span className="w-6 text-[11px] text-[var(--muted)] tabular-nums">{id}</span>
      <span className="flex-1 text-xs text-[var(--primary)]">
        {name}
        <span className="block text-[10px] text-[var(--muted)] tabular-nums">
          Kuota Standar: {standardQty} {unit}
        </span>
      </span>
      <select
        value={currentStatus}
        onChange={(e) => onUbahStatus(e.target.value as 'STANDAR' | 'TIDAK_STANDAR')}
        aria-label={`Status ${name}`}
        className={`w-36 text-xs font-semibold px-2 py-1 rounded-[4px] border focus:outline-none cursor-pointer ${
          tidakStandar
            ? 'border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400'
            : 'border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
        }`}
      >
        <option value="STANDAR">STANDAR</option>
        <option value="TIDAK_STANDAR">TIDAK STANDAR</option>
      </select>
      <label className="flex items-center gap-1 text-[10px] text-[var(--muted)] cursor-pointer whitespace-nowrap">
        <input
          type="checkbox"
          checked={row.expired}
          onChange={(e) => onUbahExpired(e.target.checked)}
          className="accent-[#eb5757] w-3.5 h-3.5 cursor-pointer disabled:cursor-not-allowed"
        />
        KD
      </label>
    </div>
  );
};

/**
 * Isi form modal inspeksi P3K: 21 item menggunakan dropdown STANDAR / TIDAK STANDAR
 * (tanpa input angka manual) + flag KD kadaluarsa.
 */
export const P3kInspectionBody: React.FC<P3kInspectionBodyProps> = ({
  draft,
  itemsCatalog = STANDARD_P3K_ITEMS,
  boxType = 'A',
  lengkap,
  kurang,
  kd,
  onUbahStatus,
  onUbahExpired,
  onUbahTanggal,
  onUbahParaf,
}) => {
  const items: ItemState = draft.items;
  const penuh = lengkap === itemsCatalog.length;

  return (
    <fieldset className="space-y-4 min-w-0 border-0 m-0 p-0">
      <div className="rounded-[5px] border border-[#27ae60]/30 bg-[#27ae60]/[0.06] px-3 py-2 flex items-center justify-between text-xs">
        <span className="font-semibold text-[var(--primary)]">
          Standar Kelengkapan: Kotak P3K Tipe {boxType}
        </span>
        <span className="text-[10px] text-[var(--secondary)]">
          {boxType === 'A'
            ? '(≤ 25 Pekerja)'
            : boxType === 'B'
            ? '(≤ 50 Pekerja)'
            : '≤ 100 Pekerja'}
        </span>
      </div>

      {/* Masukan: 21 dropdown STANDAR / TIDAK STANDAR + flag kadaluarsa */}
      <section aria-label="Status kelengkapan 21 item">
        {itemsCatalog.map((item) => {
          const row = items[item.id] ?? { actual: item.standardQty, expired: false };
          return (
            <BarisItem
              key={item.id}
              id={item.id}
              name={item.displayName || item.name}
              standardQty={item.standardQty}
              unit={item.unit}
              row={row}
              onUbahStatus={(status) => onUbahStatus(item.id, status, item.standardQty)}
              onUbahExpired={(value) => onUbahExpired(item.id, value)}
            />
          );
        })}
      </section>

      {/* Hasil: ringkasan bulan + tanggal/paraf rekam */}
      <section aria-label="Hasil pemeriksaan bulan ini" className="rounded-[6px] border border-[var(--border)] bg-[var(--bg-sidebar)]/60 p-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-semibold text-[var(--secondary)] uppercase tracking-wider">
            Hasil Bulan Ini
          </span>
          {penuh ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              STANDAR (LENGKAP)
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              TIDAK STANDAR (PERLU ISI ULANG)
            </span>
          )}
          <span className="text-[10px] text-[var(--muted)] tabular-nums">
            {lengkap}/21 standar · {kurang} tidak standar · {kd} kadaluarsa
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-2.5">
          <label className="block text-[11px] text-[var(--secondary)]">
            Tanggal Inspeksi
            <input
              type="date"
              value={draft.tanggal}
              onChange={(e) => onUbahTanggal(e.target.value)}
              className="mt-1 w-full text-xs bg-transparent border border-[var(--border)] rounded-[4px] px-2 py-1.5 tabular-nums focus:outline-none focus:border-[#27ae60] disabled:opacity-60"
            />
          </label>
          <label className="block text-[11px] text-[var(--secondary)]">
            Petugas Pemeriksa / Paraf
            <input
              type="text"
              value={draft.paraf}
              onChange={(e) => onUbahParaf(e.target.value)}
              placeholder="Takamay Jason Hermantika Irsyad"
              className="mt-1 w-full text-xs bg-transparent border border-[var(--border)] rounded-[4px] px-2 py-1.5 focus:outline-none focus:border-[#27ae60] disabled:opacity-60"
            />
          </label>
        </div>
        <p className="mt-2 text-[10px] text-[var(--muted)]">
          Tanda per sel: √ standar · × tidak standar ·{' '}
          <span className="font-bold text-red-600 dark:text-red-400">KD</span> kadaluarsa.
        </p>
      </section>
    </fieldset>
  );
};

/** Hitung ringkasan draf untuk header + hasil. */
export function ringkasanDraf(
  draft: P3kMonthData,
  itemsCatalog: StandardP3kItemDefinition[] = STANDARD_P3K_ITEMS,
): { lengkap: number; kurang: number; kd: number } {
  let lengkap = 0;
  let kurang = 0;
  let kd = 0;
  for (const item of itemsCatalog) {
    const mark = markFor(item.id, item.standardQty, draft);
    if (mark === 'standar') lengkap += 1;
    else if (mark === 'kurang') kurang += 1;
    else if (mark === 'kd') kd += 1;
  }
  return { lengkap, kurang, kd };
}
