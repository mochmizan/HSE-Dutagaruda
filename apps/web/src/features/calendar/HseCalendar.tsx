import React from 'react';
import {
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

interface HseCalendarProps {
  currentDate: Date;
  selectedDate: Date | null;
  onSelectDate: (date: Date | null) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  reports: InspectionReport[];
  activeCategoryFilter: InspectionCategory | 'ALL';
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
}) => {
  // Calendar days grid calculation (Monday start)
  // Industry-standard fixed 6-week layout (42 days) ensures consistent row height and prevents layout shifts
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

  // Filter reports by active category if not ALL
  const filteredReports = activeCategoryFilter === 'ALL'
    ? reports
    : reports.filter((r) => r.category === activeCategoryFilter);

  // Group reports by day string YYYY-MM-DD
  const getDayReports = (day: Date) => {
    return filteredReports.filter((r) => isSameDay(parseISO(r.date), day));
  };

  return (
    <div className="flex flex-col bg-[var(--bg-main)] border border-[var(--border)] rounded-[8px] shadow-xs overflow-hidden select-none">
      {/* Calendar Header */}
      <div className="h-11 px-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-sidebar)]/50">
        <div className="flex items-center gap-2">
          {/* Month & Year Title in snug fixed width container so buttons never shift */}
          <div className="w-36 flex-shrink-0">
            <h2 className="text-sm font-semibold text-[var(--primary)] tracking-tight capitalize truncate">
              {format(currentDate, 'MMMM yyyy', { locale: idLocale })}
            </h2>
          </div>

          {/* Navigation Controls in fixed position */}
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
        </div>

        {/* Category Legend */}
        <div className="hidden md:flex items-center gap-3 text-[11px] text-[var(--muted)]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#eb5757]" />
            <span>Hydrant</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#f2994a]" />
            <span>APAR</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#27ae60]" />
            <span>Kotak P3K</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#2f80ed]" />
            <span>Patroli K3</span>
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

      {/* Month Days Grid - Enforced fixed column widths & increased comfortable cell height */}
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
              {/* Day Number Header */}
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

              {/* Category Markers on this Date - Stacked full-width bars that never expand cell width */}
              <div className="flex flex-col gap-0.5 mt-0.5 w-full min-w-0 overflow-hidden">
                {dayReports.slice(0, 2).map((rep) => {
                  const meta = CATEGORY_CONFIG[rep.category];
                  return (
                    <div
                      key={rep.id}
                      title={`${meta.label}: ${rep.assetCode} (${rep.overallStatus})`}
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
