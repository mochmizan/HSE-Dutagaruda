import React from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Flame, Plus, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { UnduhPdfButton } from '@/components/ui';
import { TombolPerluas } from '@/features/navigation';

interface HydrantToolbarProps {
  namaProyek: string;
  siteName: string;
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
  selectedMonth: Date;
  isCurrentMonth: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onResetToCurrentMonth: () => void;
  onPilihBulan: (bulan: Date) => void;
  onTambahZona: () => void;
  onCetak: () => void;
  jangkarEkspor: string | null;
  period: string;
}

/**
 * Kepala halaman Hydrant: remah roti, judul, pengalih bulan, dan aksi atas.
 *
 * Dipisah dari HydrantPage agar halaman tinggal mengurus state dan data.
 * Pilihan bulan memakai tahun berjalan, bukan tahun 2026 yang dipatok seperti
 * versi sebelumnya — daftar lama tidak bisa memilih bulan di tahun lain.
 */
export const HydrantToolbar: React.FC<HydrantToolbarProps> = ({
  namaProyek,
  siteName,
  isCollapsed,
  onToggleCollapsed,
  selectedMonth,
  isCurrentMonth,
  onPrevMonth,
  onNextMonth,
  onResetToCurrentMonth,
  onPilihBulan,
  onTambahZona,
  onCetak,
  jangkarEkspor,
  period,
}) => {
  const tahun = selectedMonth.getFullYear();
  return (
    <div className="no-print flex flex-col space-y-2 pb-3 mb-4 border-b border-[var(--border)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
          {isCollapsed && <TombolPerluas onKlik={onToggleCollapsed} />}
          <span className="text-[var(--primary)] font-medium">{namaProyek}</span>
          <span>/</span>
          <span className="hover:text-[var(--primary)] cursor-pointer">{siteName}</span>
          <span>/</span>
          <span className="text-[var(--primary)] font-medium">Inspeksi Hydrant</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[6px] bg-[#eb5757]/15 text-[#eb5757] flex items-center justify-center text-lg font-bold flex-shrink-0">
            <Flame size={18} strokeWidth={2.2} />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg font-bold text-[var(--primary)] tracking-tight">
                Laporan Inspeksi Hydrant
              </h1>
            </div>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Monitoring progres pemeriksaan fisik 6 komponen hydrant gedung per unit
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isCurrentMonth && (
            <button
              type="button"
              onClick={onResetToCurrentMonth}
              className="text-[11px] font-medium px-2 py-0.5 rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--bg-hover)] cursor-pointer transition-colors shadow-2xs"
            >
              Bulan Ini
            </button>
          )}

          <div className="flex items-center bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-[5px] p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={onPrevMonth}
              title="Bulan Sebelumnya"
              className="w-6 h-6 rounded-[3px] flex items-center justify-center text-[var(--secondary)] hover:text-[var(--primary)] hover:bg-[var(--bg-hover)] cursor-pointer pressable transition-colors"
            >
              <ChevronLeft size={13} />
            </button>

            <div className="relative flex items-center">
              <select
                value={`${tahun}-${selectedMonth.getMonth()}`}
                onChange={(e) => {
                  const [y, m] = e.target.value.split('-').map(Number);
                  onPilihBulan(new Date(y, m, 1));
                }}
                className="text-xs font-semibold text-[#2f80ed] bg-transparent cursor-pointer py-0.5 px-2 focus:outline-none capitalize pr-5 appearance-none"
              >
                {Array.from({ length: 12 }, (_, m) => (
                  <option
                    key={m}
                    value={`${tahun}-${m}`}
                    className="bg-[var(--bg-main)] text-[var(--primary)]"
                  >
                    {format(new Date(tahun, m, 1), 'MMMM yyyy', { locale: idLocale })}
                  </option>
                ))}
              </select>
              <ChevronDown size={11} className="absolute right-1 text-[#2f80ed] pointer-events-none" />
            </div>

            <button
              type="button"
              onClick={onNextMonth}
              title="Bulan Berikutnya"
              className="w-6 h-6 rounded-[3px] flex items-center justify-center text-[var(--secondary)] hover:text-[var(--primary)] hover:bg-[var(--bg-hover)] cursor-pointer pressable transition-colors"
            >
              <ChevronRight size={13} />
            </button>
          </div>

          <button
            type="button"
            onClick={onTambahZona}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2f80ed] hover:bg-[#2b77d4] text-white text-xs font-semibold rounded-[4px] shadow-xs cursor-pointer pressable disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>Tambah Zona &amp; Unit</span>
          </button>

          <UnduhPdfButton category="hydrant-monthly" refId={jangkarEkspor} namaBerkas={period} />

          <button
            type="button"
            onClick={onCetak}
            title="Cetak lembar laporan ke printer atau simpan sebagai PDF"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-main)] hover:bg-[var(--bg-hover)] text-[var(--primary)] border border-[var(--border)] text-xs font-semibold rounded-[4px] shadow-2xs cursor-pointer pressable"
          >
            <Printer size={14} />
            <span>Cetak</span>
          </button>
        </div>
      </div>
    </div>
  );
};
