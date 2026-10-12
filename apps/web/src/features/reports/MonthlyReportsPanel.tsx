import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Calendar,
  User,
  CheckCircle2,
  AlertCircle,
  XCircle,
  X,
  Target,
  Loader2,
} from 'lucide-react';
import { format, parseISO, isSameDay } from 'date-fns';
import { InspectionReport, InspectionCategory, CATEGORY_CONFIG, OverallStatus } from '../../types/hse';
import { id as idLocale } from 'date-fns/locale';

interface MonthlyReportsPanelProps {
  reports: InspectionReport[];
  selectedDate: Date | null;
  onClearDateFilter: () => void;
  activeCategoryFilter: InspectionCategory | 'ALL';
  onSelectCategoryFilter: (cat: InspectionCategory | 'ALL') => void;
  onOpenReportDetail: (report: InspectionReport) => void;
  sedangMemuat?: boolean;
}

export const MonthlyReportsPanel: React.FC<MonthlyReportsPanelProps> = ({
  reports,
  selectedDate,
  onClearDateFilter,
  activeCategoryFilter,
  onOpenReportDetail,
  sedangMemuat = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL_MONTH' | 'SELECTED_DATE'>('ALL_MONTH');
  const reportItemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // When a date is selected, scroll smoothly to its matching card in the full list
  useEffect(() => {
    if (selectedDate && filterMode === 'ALL_MONTH') {
      const match = reports.find((r) => isSameDay(parseISO(r.date), selectedDate));
      if (match && reportItemRefs.current[match.id]) {
        reportItemRefs.current[match.id]?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  }, [selectedDate, filterMode, reports]);

  // If user clears date filter externally, reset to ALL_MONTH
  useEffect(() => {
    if (!selectedDate && filterMode === 'SELECTED_DATE') {
      setFilterMode('ALL_MONTH');
    }
  }, [selectedDate, filterMode]);

  // Filter by category
  let categoryFiltered = reports;
  if (activeCategoryFilter !== 'ALL') {
    categoryFiltered = categoryFiltered.filter((r) => r.category === activeCategoryFilter);
  }

  // Reports matching selected date
  const selectedDateReports = selectedDate
    ? categoryFiltered.filter((r) => isSameDay(parseISO(r.date), selectedDate))
    : [];

  // Determine active displayed list
  let displayed = categoryFiltered;
  if (selectedDate && filterMode === 'SELECTED_DATE') {
    displayed = selectedDateReports;
  }

  // Filter by search query
  if (searchTerm.trim()) {
    const q = searchTerm.toLowerCase();
    displayed = displayed.filter(
      (r) =>
        r.assetCode.toLowerCase().includes(q) ||
        r.zoneName.toLowerCase().includes(q) ||
        r.inspectorName.toLowerCase().includes(q) ||
        (r.summaryNotes && r.summaryNotes.toLowerCase().includes(q))
    );
  }

  // Status color badges
  const renderStatusBadge = (status: OverallStatus) => {
    switch (status) {
      case 'LAYAK':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={10} /> LAYAK
          </span>
        );
      case 'LAYAK_DENGAN_CATATAN':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] text-[10px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <AlertCircle size={10} /> CATATAN
          </span>
        );
      case 'TIDAK_LAYAK':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] text-[10px] font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400">
            <XCircle size={10} /> TIDAK LAYAK
          </span>
        );
    }
  };

  return (
    <aside className="w-84 h-screen border-l border-[var(--border)] bg-[var(--bg-sidebar)] flex flex-col select-none flex-shrink-0 z-20">
      {/* Panel Header */}
      <div className="p-3 border-b border-[var(--border)] space-y-2 bg-[var(--bg-sidebar)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={15} className="text-[#2383e2]" />
            <span className="text-xs font-semibold text-[var(--primary)] tracking-tight">
              Daftar Laporan Bulan Ini
            </span>
          </div>

          <span className="text-[10px] bg-[var(--bg-active)] text-[var(--muted)] font-mono font-semibold px-2 py-0.5 rounded-full tabular-nums">
            {displayed.length} laporan
          </span>
        </div>

        {/* View mode toggle (Semua Bulan Ini vs Tanggal Terpilih) */}
        <div className="flex items-center gap-1 bg-[var(--bg-main)] p-0.5 rounded-[4px] border border-[var(--border)] text-[11px]">
          <button
            type="button"
            onClick={() => setFilterMode('ALL_MONTH')}
            className={`flex-1 py-1 px-2 rounded-[3px] font-medium text-center transition-colors cursor-pointer ${
              filterMode === 'ALL_MONTH'
                ? 'bg-[var(--bg-hover)] text-[var(--primary)] font-semibold shadow-xs'
                : 'text-[var(--muted)] hover:text-[var(--primary)]'
            }`}
          >
            Semua ({categoryFiltered.length})
          </button>
          <button
            type="button"
            onClick={() => {
              if (selectedDate) setFilterMode('SELECTED_DATE');
            }}
            disabled={!selectedDate}
            title={!selectedDate ? 'Pilih tanggal pada kalender' : undefined}
            className={`flex-1 py-1 px-2 rounded-[3px] font-medium text-center transition-colors ${
              !selectedDate
                ? 'opacity-40 cursor-not-allowed text-[var(--muted)]'
                : filterMode === 'SELECTED_DATE'
                ? 'bg-[#2383e2] text-white font-semibold shadow-xs cursor-pointer'
                : 'text-[var(--muted)] hover:text-[var(--primary)] cursor-pointer'
            }`}
          >
            {selectedDate ? format(selectedDate, 'd MMM', { locale: idLocale }) : 'Tanggal'} ({selectedDateReports.length})
          </button>
        </div>

        {/* Selected date focus indicator bar when in ALL_MONTH mode */}
        {selectedDate && filterMode === 'ALL_MONTH' && (
          <div className="flex items-center justify-between px-2 py-1 bg-[#2383e2]/10 border border-[#2383e2]/25 rounded-[4px] text-xs text-[#2383e2]">
            <div className="flex items-center gap-1 min-w-0">
              <Target size={11} className="flex-shrink-0" />
              <span className="font-medium text-[11px] truncate">
                Fokus: {format(selectedDate, 'd MMMM yyyy', { locale: idLocale })}
              </span>
              <span className="text-[10px] opacity-75 font-mono">
                ({selectedDateReports.length})
              </span>
            </div>
            <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setFilterMode('SELECTED_DATE')}
                className="text-[10px] underline hover:opacity-80 cursor-pointer"
              >
                Hanya Hari Ini
              </button>
              <button
                type="button"
                onClick={onClearDateFilter}
                title="Hapus fokus tanggal"
                aria-label="Hapus fokus tanggal"
                className="hover:opacity-75 cursor-pointer pressable"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        )}

        {/* Search input */}
        <input
          type="text"
          placeholder="Cari kode unit, zona, atau catatan..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-2.5 py-1 text-xs bg-[var(--bg-main)] border border-[var(--border)] rounded-[4px] text-[var(--primary)] placeholder-[var(--muted)] focus:outline-none focus:border-[#2383e2]"
        />
      </div>

      {/* Reports Scrollable Feed */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2 divide-y divide-[var(--border)]/40">
        {displayed.length === 0 ? (
          <div className="py-12 px-4 text-center text-xs text-[var(--muted)]">
            {sedangMemuat && reports.length === 0 ? (
              <>
                <Loader2 size={24} className="mx-auto mb-2 opacity-40 animate-spin" />
                <p className="font-medium">Memuat laporan…</p>
              </>
            ) : (
              <>
                <FileText size={24} className="mx-auto mb-2 opacity-40" />
                <p className="font-medium">Tidak ada laporan ditemukan</p>
                <p className="text-[11px] mt-1">
                  {filterMode === 'SELECTED_DATE'
                    ? 'Tidak ada inspeksi pada tanggal ini.'
                    : 'Coba pilih kategori atau kata kunci lain.'}
                </p>
                {filterMode === 'SELECTED_DATE' && (
                  <button
                    type="button"
                    onClick={() => setFilterMode('ALL_MONTH')}
                    className="mt-3 px-2.5 py-1 text-xs font-semibold text-[#2383e2] bg-[#2383e2]/10 hover:bg-[#2383e2]/20 rounded-[3px] cursor-pointer"
                  >
                    Lihat Semua Laporan Bulan Ini
                  </button>
                )}
              </>
            )}
          </div>
        ) : (
          displayed.map((report) => {
            const meta = CATEGORY_CONFIG[report.category];
            const parsedDate = parseISO(report.date);
            const isSelectedDateReport = selectedDate ? isSameDay(parsedDate, selectedDate) : false;

            return (
              <div
                key={report.id}
                ref={(el) => {
                  reportItemRefs.current[report.id] = el;
                }}
                onClick={() => onOpenReportDetail(report)}
                className="pt-2 first:pt-0 group cursor-pointer"
              >
                <div
                  className={`p-2.5 rounded-[5px] bg-[var(--bg-main)] border transition-all space-y-2 pressable-subtle ${
                    isSelectedDateReport
                      ? 'border-[#2383e2] ring-1 ring-[#2383e2]/40 shadow-xs bg-[#2383e2]/[0.03]'
                      : 'border-[var(--border)] hover:border-[var(--border-strong)] hover:shadow-xs'
                  }`}
                >
                  {/* Category badge & Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span
                        style={{
                          backgroundColor: meta.bgTint,
                          color: meta.colorHex,
                          borderColor: meta.borderTint,
                        }}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] border text-[10px] font-semibold whitespace-nowrap"
                      >
                        <span>{meta.icon}</span>
                        <span>{meta.label}</span>
                      </span>

                      {isSelectedDateReport && (
                        <span className="text-[9px] font-bold text-[#2383e2] bg-[#2383e2]/15 px-1.5 py-0.2 rounded">
                          • Terpilih
                        </span>
                      )}
                    </div>

                    {renderStatusBadge(report.overallStatus)}
                  </div>

                  {/* Asset Code & Zone */}
                  <div>
                    <h4 className="text-xs font-semibold text-[var(--primary)] leading-tight group-hover:text-[#2383e2] transition-colors">
                      {report.assetCode}
                    </h4>
                    <p className="text-[11px] text-[var(--muted)] truncate mt-0.5">
                      {report.zoneName}
                    </p>
                  </div>

                  {/* Summary notes with smart quotes and pretty wrap */}
                  {report.summaryNotes && (
                    <p className="text-[11px] text-[var(--secondary)] line-clamp-2 italic bg-[var(--bg-sidebar)]/60 p-1.5 rounded-[3px] border border-[var(--border)] [text-wrap:pretty]">
                      “{report.summaryNotes}”
                    </p>
                  )}

                  {/* Footer: Date & Inspector */}
                  <div className="flex items-center justify-between pt-1 border-t border-[var(--border)] text-[10px] text-[var(--muted)]">
                    <span className="flex items-center gap-1 font-mono tabular-nums">
                      <Calendar size={11} strokeWidth={1.75} /> {format(parsedDate, 'd MMM, HH:mm')}
                    </span>
                    <span className="flex items-center gap-1 truncate max-w-[120px]">
                      <User size={11} /> {report.inspectorName.split(' ')[0]}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
