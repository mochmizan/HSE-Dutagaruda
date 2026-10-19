import React from 'react';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import type { AparUnitItem } from '../../types/hse';
import { COMPONENT_LABELS, ComponentChip, EligibilityBadge } from './AparBadges';
import { getEffectiveDetails } from './AparTable';

interface AparCardsProps {
  units: AparUnitItem[];
  onPilihKartu: (kode: string) => void;
  aksen: string;
}

/**
 * Tampilan kartu Section A halaman APAR.
 *
 * Dipisah dari AparPage. Tombol "Buka Kartu" membuka kartu tahunan unit itu,
 * bukan modal inspeksi — perilaku ini dipertahankan apa adanya.
 */
export const AparCards: React.FC<AparCardsProps> = ({ units, onPilihKartu, aksen }) => (
  <div className="apar-card-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
    {units.map((unit) => {
      const details = getEffectiveDetails(unit);
      const isCompleted = unit.status === 'SELESAI';
      const isOnProgress = unit.status === 'SEDANG_BERJALAN';
      return (
        <div
          key={unit.id}
          className={`p-3.5 rounded-[6px] border bg-[var(--bg-main)] hover:shadow-xs transition-all flex flex-col justify-between ${
            isOnProgress ? 'border-amber-500/40' : isCompleted ? 'border-emerald-500/30' : 'border-[var(--border)]'
          }`}
        >
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-[var(--primary)] tracking-tight font-mono tabular-nums">
                  APAR {unit.kode}
                </h3>
                <span className="text-[10px] text-[var(--secondary)]">
                  {unit.zoneName} • {unit.jenis} {unit.ukuran}
                </span>
              </div>
              <EligibilityBadge unit={unit} />
            </div>
            <div className="mt-3 pt-2 border-t border-[var(--border)]">
              <div className="flex flex-wrap gap-1">
                {COMPONENT_LABELS.map((c) => (
                  <ComponentChip key={c.key} label={c.label} status={details?.[c.key]} />
                ))}
              </div>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[var(--border)] flex items-center justify-between text-xs">
            <span className="text-[10px] text-[var(--muted)] font-mono tabular-nums">
              Exp. {format(parseISO(unit.expiredDate), 'dd MMM yyyy', { locale: idLocale })}
            </span>
            <button
              type="button"
              onClick={() => onPilihKartu(unit.kode)}
              className="no-print px-3 py-1 text-xs font-semibold rounded-[4px] text-white shadow-xs cursor-pointer pressable"
              style={{ backgroundColor: aksen }}
            >
              Buka Kartu
            </button>
          </div>
        </div>
      );
    })}
  </div>
);
