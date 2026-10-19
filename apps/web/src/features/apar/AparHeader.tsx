import React from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { PrintButton, UnduhPdfButton } from '@/components/ui';
import { TombolPerluas } from '@/features/navigation';
import { CATEGORY_ACCENT } from '@/components/ui/accents';

interface AparHeaderProps {
  namaProyek: string;
  siteName: string;
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
  period: string;
  isDefaultPeriod: boolean;
  onShiftMonth: (delta: number) => void;
  onPilihPeriode: (periode: string) => void;
  onResetPeriode: () => void;
  onTambah: () => void;
  jangkarBulanan: string | null;
  onCetakLaporan: () => void;
}

/**
 * Kepala halaman APAR: remah roti, judul, pengalih bulan, dan aksi atas.
 *
 * Pilihan bulan memakai tahun periode berjalan, bukan 2026 yang dipatok.
 */
export const AparHeader: React.FC<AparHeaderProps> = ({
  namaProyek,
  siteName,
  isCollapsed,
  onToggleCollapsed,
  period,
  isDefaultPeriod,
  onShiftMonth,
  onPilihPeriode,
  onResetPeriode,
  onTambah,
  jangkarBulanan,
  onCetakLaporan,
}) => {
  // `period` bisa kosong sesaat (mis. select tanpa opsi cocok). Tanpa pagar ini
  // `Number("")` = 0 dan daftar bulan jatuh ke tahun 1900.
  const tahun = /^\d{4}-\d{2}$/.test(period) ? period.slice(0, 4) : String(new Date().getFullYear());
  return (
    <div className="no-print flex flex-col space-y-2 pb-3 mb-4 border-b border-[var(--border)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
          {isCollapsed && <TombolPerluas onKlik={onToggleCollapsed} />}
          <span className="text-[var(--primary)] font-medium">{namaProyek}</span>
          <span>/</span>
          <span className="hover:text-[var(--primary)] cursor-pointer">{siteName}</span>
          <span>/</span>
          <span className="text-[var(--primary)] font-medium">Inspeksi APAR</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-[6px] flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${CATEGORY_ACCENT.apar}26`, color: CATEGORY_ACCENT.apar }}
          >
            <ShieldCheck size={18} strokeWidth={2.2} />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg font-bold text-[var(--primary)] tracking-tight">
                Laporan Inspeksi APAR
              </h1>
            </div>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Monitoring progres pemeriksaan fisik 7 komponen APAR gedung per unit
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-[5px] p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => onShiftMonth(-1)}
              title="Bulan Sebelumnya"
              className="w-6 h-6 rounded-[3px] flex items-center justify-center text-[var(--secondary)] hover:text-[var(--primary)] hover:bg-[var(--bg-hover)] cursor-pointer pressable transition-colors"
            >
              <ChevronLeft size={13} />
            </button>
            <div className="relative flex items-center">
              <select
                value={period}
                onChange={(e) => onPilihPeriode(e.target.value)}
                className="text-xs font-semibold bg-transparent cursor-pointer py-0.5 px-2 focus:outline-none capitalize pr-5 appearance-none tabular-nums"
                style={{ color: '#2f80ed' }}
              >
                {Array.from({ length: 12 }, (_, m) => {
                  const d = new Date(Number(tahun), m, 1);
                  const value = format(d, 'yyyy-MM');
                  return (
                    <option key={value} value={value} className="bg-[var(--bg-main)] text-[var(--primary)]">
                      {format(d, 'MMMM yyyy', { locale: idLocale })}
                    </option>
                  );
                })}
              </select>
              <ChevronDown
                size={11}
                className="absolute right-1 pointer-events-none"
                style={{ color: '#2f80ed' }}
              />
            </div>
            <button
              type="button"
              onClick={() => onShiftMonth(1)}
              title="Bulan Berikutnya"
              className="w-6 h-6 rounded-[3px] flex items-center justify-center text-[var(--secondary)] hover:text-[var(--primary)] hover:bg-[var(--bg-hover)] cursor-pointer pressable transition-colors"
            >
              <ChevronRight size={13} />
            </button>
          </div>
          {!isDefaultPeriod && (
            <button
              type="button"
              onClick={onResetPeriode}
              className="text-[11px] font-medium px-2 py-0.5 rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--bg-hover)] cursor-pointer transition-colors shadow-2xs"
            >
              Bulan Ini
            </button>
          )}
          <button
            type="button"
            onClick={onTambah}
            title="Tambah zona & unit APAR"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-white text-xs font-semibold rounded-[4px] shadow-xs cursor-pointer pressable active:scale-[0.96] transition-transform duration-150 ease-[cubic-bezier(0.2,0,0,1)]"
            style={{ backgroundColor: '#2f80ed' }}
          >
            <span>Tambah APAR</span>
          </button>
          <UnduhPdfButton category="apar-monthly" refId={jangkarBulanan} namaBerkas={period} />
          <PrintButton onClick={onCetakLaporan} label="Cetak Laporan" />
        </div>
      </div>
    </div>
  );
};