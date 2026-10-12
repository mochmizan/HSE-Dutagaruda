import React from 'react';
import { ArrowLeft, MapPin } from 'lucide-react';

/** Shared page header: back + title + actions. Screen only. */
interface PageHeaderProps {
  /** Nama perusahaan pada breadcrumb (dari konteks lokasi). */
  clientName: string;
  /** Nama lokasi aktif (dari konteks lokasi). */
  siteName: string;
  title: string;
  breadcrumb: string;
  icon: React.ReactNode;
  accent: string;
  subtitle: string;
  monthSlot?: React.ReactNode;
  showThisMonth?: boolean;
  onThisMonth?: () => void;
  addLabel?: string;
  onAdd?: () => void;
  printSlot?: React.ReactNode;
  onBack: () => void;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  clientName,
  siteName,
  title,
  breadcrumb,
  icon,
  accent,
  subtitle,
  monthSlot,
  showThisMonth,
  onThisMonth,
  addLabel,
  onAdd,
  printSlot,
  onBack,
}) => (
  <div className="no-print flex flex-col space-y-2 pb-3 mb-4 border-b border-[var(--border)]">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-[var(--primary)] font-medium transition-colors cursor-pointer pressable"
          style={{ ['--tw-text-opacity' as string]: undefined }}
          onMouseEnter={(e) => (e.currentTarget.style.color = accent)}
          onMouseLeave={(e) => (e.currentTarget.style.color = '')}
        >
          <ArrowLeft size={13} />
          <span>Kembali ke Dashboard Kalender</span>
        </button>
        <span>/</span>
        <span className="hover:text-[var(--primary)] cursor-pointer">{clientName}</span>
        <span>/</span>
        <span className="text-[var(--primary)] font-medium">{breadcrumb}</span>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
        <MapPin size={12} />
        <span>{siteName}</span>
      </div>
    </div>

    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-[6px] flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${accent}26`, color: accent }}
        >
          {icon}
        </div>
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-lg font-bold text-[var(--primary)] tracking-tight">{title}</h1>
            {monthSlot}
            {showThisMonth && (
              <button
                type="button"
                onClick={onThisMonth}
                className="text-[11px] font-medium px-2 py-0.5 rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--bg-hover)] cursor-pointer transition-colors shadow-2xs"
              >
                Bulan Ini
              </button>
            )}
          </div>
          <p className="text-xs text-[var(--muted)] mt-0.5">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {addLabel && onAdd && (
          <button
            type="button"
            onClick={onAdd}
            style={{ backgroundColor: accent }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-white text-xs font-semibold rounded-[4px] shadow-xs cursor-pointer pressable hover:brightness-95"
          >
            {addLabel}
          </button>
        )}
        {printSlot}
      </div>
    </div>
  </div>
);
