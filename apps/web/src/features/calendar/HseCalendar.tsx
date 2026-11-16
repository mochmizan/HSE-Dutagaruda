import React from 'react';
import {
  Building2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
  addDays,
} from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { InspectionReport, InspectionCategory, CATEGORY_CONFIG } from '../../types/hse';
import type { LokasiRingkas } from '../konteksLokasi';

interface HseCalendarProps {
  currentDate: Date;
  selectedDate: Date | null;
  onSelectDate: (date: Date | null) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  reports: InspectionReport[];
  activeCategoryFilter: InspectionCategory | 'ALL';
  sites?: LokasiRingkas[];
  selectedSiteId?: string;
  onSelectSiteId?: (siteId: string) => void;
}

export const HseCalendar: React.FC<HseCalendarProps> = ({
  currentDate,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  onToday,
  reports,
  activeCategoryFilter,
  sites = [],
  selectedSiteId = 'ALL',
  onSelectSiteId,
}) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const naturalCalendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  let calendarDays = eachDayOfInterval({ start: calendarStart, end: naturalCalendarEnd });

  if (calendarDays.length < 42) {
    const additionalDaysNeeded = 42 - calendarDays.length;
    const lastDay = calendarDays[calendarDays.length - 1];
    const extraStart = addDays(lastDay, 1);
    const extraEnd = addDays(lastDay, additionalDaysNeeded);
    const extraDays = eachDayOfInterval({ start: extraStart, end: extraEnd });
    calendarDays = [...calendarDays, ...extraDays];
  }

  const weekHeaders = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

  const siteFilteredReports =
    !selectedSiteId || selectedSiteId === 'ALL'
      ? reports
      : reports.filter((r) => !r.siteId || r.siteId === selectedSiteId);

  const filteredReports =
    activeCategoryFilter === 'ALL'
      ? siteFilteredReports
      : siteFilteredReports.filter((r) => r.category === activeCategoryFilter);

  const getDayReports = (day: Date) => {
    return filteredReports.filter((r) => isSameDay(parseISO(r.date), day));
  };

  const opsiLokasi =
    sites.length > 0
      ? sites.map((s) => ({
          id: s.id,
          name:
            !s.name || s.name.toLowerCase() === 'pabrik utama' || s.name.toLowerCase() === 'gedung utama'
              ? 'Kantor Pusat'
              : s.name,
        }))
      : [{ id: 'KANTOR_PUSAT', name: 'Kantor Pusat' }];

  return (
    <div className="flex flex-col bg-[var(--bg-main)] border border-[var(--border)] rounded-[8px] shadow-xs overflow-hidden select-none">
      {/* Calendar Header */}
      <div className="min-h-11 py-1.5 px-4 border-b border-[var(--border)] flex flex-wrap items-center justify-between gap-2 bg-[var(--bg-sidebar)]/50">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-36 flex-shrink-0">
            <h2 className="text-sm font-semibold text-[var(--primary)] tracking-tight capitalize truncate">
              {format(currentDate, 'MMMM yyyy', { locale: idLocale })}
            </h2>
          </div>

          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={onPrevMonth}
              title="Bulan sebelumnya"
              aria-label="Bulan sebelumnya"
              className="w-6 h-6 rounded-[3px] flex items-center justify-center hover:bg-[var(--bg-hover)] text-[var(--secondary)] hover:text-[var(--primary)] cursor-pointer pressable"
            >
              <ChevronLeft size={15} strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={onNextMonth}
              title="Bulan berikutnya"
              aria-label="Bulan berikutnya"
              className="w-6 h-6 rounded-[3px] flex items-center justify-center hover:bg-[var(--bg-hover)] text-[var(--secondary)] hover:text-[var(--primary)] cursor-pointer pressable"
            >
              <ChevronRight size={15} strokeWidth={1.75} />
            </button>
          </div>

          <button
            type="button"
            onClick={onToday}
            className="px-2 py-0.5 text-[11px] font-medium border border-[var(--border-strong)] rounded-[3px] hover:bg-[var(--bg-hover)] text-[var(--primary)] transition-colors cursor-pointer pressable flex-shrink-0"
          >
            Hari Ini
          </button>

          {/* Pilihan Bagian / Lokasi di Kalender (Kantor Pusat) */}
          <div className="inline-flex items-center gap-1.5 pl-2 border-l border-[var(--border)]">
            <Building2 size={13} className="text-[#2383e2] flex-shrink-0" />
            <span className="text-[11px] font-medium text-[var(--secondary)]">Bagian:</span>
            <select
              aria-label="Pilih Bagian Kalender"
              value={selectedSiteId}
              onChange={(e) => onSelectSiteId?.(e.target.value)}
              className="text-[11px] font-semibold px-2 py-0.5 rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-main)] text-[var(--primary)] focus:outline-none focus:border-[#2383e2] cursor-pointer"
            >
              {opsiLokasi.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name === 'JPM Dukuh Atas' ? 'Kantor Pusat (JPM Dukuh Atas)' : s.name}
                </option>
              ))}
              <option value="ALL">Semua Bagian</option>
            </select>
          </div>
        </div>

        {/* Category Legend */}
        <div className="hidden md:flex items-center gap-3 text-[11px] text-[var(--muted)]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#f2994a]" />
            <span>Inspeksi APAR</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#eb5757]" />
            <span>Inspeksi Hydrant</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#27ae60]" />
            <span>Kotak P3K</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#2f80ed]" />
            <span>Safety Patrol</span>
          </div>
        </div>
      </div>

      {/* Weekday Headers - Strictly equal 7 columns */}
      <div className="grid grid-cols-[repeat(7,minmax(0,1fr))] w-full border-b border-[var(--border)] text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)] bg-[var(--bg-sidebar)]/30">
        {weekHeaders.map((header) => (
          <div key={header} className="py-1.5 min-w-0 border-r border-[var(--border)] last:border-r-0 truncate">
            {header}
          </div>
        ))}
      </div>

      {/* Month Days Grid */}
      <div className="grid grid-cols-[repeat(7,minmax(0,1fr))] w-full divide-x divide-y divide-[var(--border)] bg-[var(--bg-main)]">
        {calendarDays.map((day, idx) => {
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
          const today = isToday(day);
          const dayReports = getDayReports(day);

          return (
            <div
              key={idx}
              onClick={() => onSelectDate(isSelected ? null : day)}
              className={`h-[68px] min-w-0 w-full p-1.5 flex flex-col justify-between transition-colors cursor-pointer group overflow-hidden ${
                !isCurrentMonth ? 'bg-[var(--bg-hover)]/25 text-[var(--muted)]' : 'text-[var(--primary)]'
              } ${
                isSelected ? 'ring-2 ring-[#2383e2] ring-inset bg-[#2383e2]/5' : 'hover:bg-[var(--bg-hover)]'
              }`}
            >
              <div className="flex items-center justify-between min-w-0 w-full">
                <span
                  className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-medium leading-none tabular-nums flex-shrink-0 ${
                    today
                      ? 'bg-[#eb5757] text-white font-bold'
                      : !isCurrentMonth
                      ? 'opacity-40'
                      : ''
                  }`}
                >
                  {format(day, 'd')}
                </span>

                {dayReports.length > 0 && (
                  <span className="text-[9px] font-mono tabular-nums text-[var(--muted)] font-medium truncate ml-1">
                    {dayReports.length} lap
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-0.5 mt-0.5 w-full min-w-0 overflow-hidden">
                {dayReports.slice(0, 2).map((rep) => {
                  const meta = CATEGORY_CONFIG[rep.category];
                  const statusLabel =
                    rep.overallStatus === 'TIDAK_LAYAK'
                      ? 'TIDAK STANDAR'
                      : rep.overallStatus === 'LAYAK_DENGAN_CATATAN'
                      ? 'STANDAR (CATATAN)'
                      : 'STANDAR';
                  return (
                    <div
                      key={rep.id}
                      title={`${meta.label}: ${rep.assetCode} (${statusLabel})`}
                      style={{
                        backgroundColor: meta.bgTint,
                        color: meta.colorHex,
                        borderColor: meta.borderTint,
                      }}
                      className={`w-full min-w-0 px-1 py-0.5 border rounded-[3px] text-[9px] font-medium flex items-center gap-1 truncate ${
                        !isCurrentMonth ? 'opacity-40' : ''
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: meta.colorHex }} />
                      <span className="truncate flex-1 font-mono text-[9px] leading-tight">{rep.assetCode}</span>
                    </div>
                  );
                })}

                {dayReports.length > 2 && (
                  <span className="text-[8px] font-mono text-[var(--muted)] pl-0.5 leading-none">
                    +{dayReports.length - 2} lap
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
