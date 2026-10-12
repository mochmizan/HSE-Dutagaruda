import React from 'react';
import {
  X,
  Calendar,
  MapPin,
  User,
  Download,
  Printer,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileCheck,
  Edit3,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { InspectionReport, CATEGORY_CONFIG } from '../../types/hse';

interface ReportDetailModalProps {
  report: InspectionReport | null;
  onClose: () => void;
  onEdit?: (report: InspectionReport) => void;
}

const HYDRANT_LABELS: Record<string, string> = {
  boxHydrant: 'Box Hydrant',
  fireHose: 'Fire Hose',
  hoseCoupling: 'Hose Coupling',
  hoseRack: 'Hose Rack',
  nozzle: 'Nozzle',
  valvePillar: 'Valve/Pillar Hydrant',
};

const APAR_LABELS: Record<string, string> = {
  safetyPin: 'Pin Pengaman',
  corong: 'Corong Pemancar',
  segel: 'Segel Pengunci',
  tekanan: 'Tekanan Manometer',
  tabung: 'Kondisi Tabung',
  selang: 'Selang APAR',
  katupTuas: 'Katup / Tuas Pembuka',
};

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  report,
  onClose,
  onEdit,
}) => {
  if (!report) return null;

  const meta = CATEGORY_CONFIG[report.category];
  const dateFormatted = format(parseISO(report.date), 'EEEE, d MMMM yyyy · HH:mm', { locale: idLocale });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className="relative w-full max-w-xl bg-[var(--bg-modal)] text-[var(--primary)] border border-[var(--border)] rounded-[8px] shadow-[var(--shadow-popover)] overflow-hidden flex flex-col z-10 emil-modal select-none max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-sidebar)]/50">
          <div className="flex items-center gap-2">
            <span
              style={{
                backgroundColor: meta.bgTint,
                color: meta.colorHex,
                borderColor: meta.borderTint,
              }}
              className="px-2 py-0.5 border rounded-[3px] text-xs font-semibold flex items-center gap-1"
            >
              <span>{meta.icon}</span>
              <span>{meta.label}</span>
            </span>

            <h3 className="text-sm font-semibold text-[var(--primary)] truncate">
              {report.assetCode} – Rekam Hasil Inspeksi
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog"
            className="w-6 h-6 rounded-[3px] flex items-center justify-center text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--bg-hover)] cursor-pointer pressable"
          >
            <X size={15} strokeWidth={2} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-2 p-2.5 bg-[var(--bg-sidebar)]/40 rounded-[5px] border border-[var(--border)]">
            <div className="flex items-center gap-1.5 text-[var(--secondary)]">
              <Calendar size={13} />
              <span className="text-[var(--primary)] font-mono">{dateFormatted}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[var(--secondary)]">
              <MapPin size={13} />
              <span className="text-[var(--primary)] truncate">{report.zoneName}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[var(--secondary)]">
              <User size={13} />
              <span className="text-[var(--primary)]">{report.inspectorName}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[var(--secondary)]">
              <FileCheck size={13} />
              <span className="text-[var(--primary)] font-semibold">
                Status: {report.overallStatus}
              </span>
            </div>
          </div>

          {/* Detail Periksa Hydrant */}
          {report.hydrantDetails && (
            <div className="space-y-1.5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                Verifikasi 6 Komponen Hydrant
              </h4>
              <div className="grid grid-cols-2 gap-1.5 border border-[var(--border)] rounded-[4px] p-2 bg-[var(--bg-main)]">
                {Object.entries(report.hydrantDetails).map(([key, val]) => (
                  <div key={key} className="flex items-center justify-between p-1 border-b border-[var(--border)] last:border-b-0">
                    <span className="text-[var(--secondary)]">
                      {HYDRANT_LABELS[key] || key}
                    </span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {val}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detail Periksa APAR */}
          {report.aparDetails && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                  Verifikasi 7 Komponen APAR
                </h4>
                <span className="text-[10px] text-[var(--muted)] font-mono">
                  {report.aparDetails.jenis} ({report.aparDetails.ukuran}) · Kadaluarsa: {report.aparDetails.expiredDate}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 border border-[var(--border)] rounded-[4px] p-2 bg-[var(--bg-main)]">
                {Object.entries(report.aparDetails)
                  .filter(([k]) => !['jenis', 'ukuran', 'expiredDate', 'beratCo2Kg'].includes(k))
                  .map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between p-1 border-b border-[var(--border)]">
                      <span className="text-[var(--secondary)]">
                        {APAR_LABELS[key] || key}
                      </span>
                      <span className={val === 'BAIK' ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
                        {val}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Detail Periksa P3K */}
          {report.p3kDetails && (
            <div className="space-y-1.5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                Pemeriksaan Kotak P3K (21 Item Standar)
              </h4>
              <div className="p-2 border border-[var(--border)] rounded-[4px] bg-[var(--bg-main)] space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span>Total Item Terverifikasi:</span>
                  <span className="font-mono font-semibold tabular-nums">{report.p3kDetails.itemsTotal} / 21</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span>Item di Bawah Standar:</span>
                  <span className={`font-mono font-semibold tabular-nums ${report.p3kDetails.itemsUnderStandard > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {report.p3kDetails.itemsUnderStandard} item
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span>Perlu Pengisian Ulang (Restock):</span>
                  <span className="font-semibold text-rose-600">
                    {report.p3kDetails.needsRestock ? 'YA (Perlu Pengadaan)' : 'TIDAK (Lengkap)'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Temuan Patroli */}
          {report.patrolDetails && (
            <div className="space-y-1.5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                Temuan Lapangan Patroli K3
              </h4>
              <div className="p-2 border border-[var(--border)] rounded-[4px] bg-[var(--bg-main)] space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span>Catatan Lokasi Observasi:</span>
                  <span className="font-semibold">{report.patrolDetails.locationNote}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span>Total Temuan Tercatat:</span>
                  <span className="font-mono font-semibold tabular-nums">{report.patrolDetails.findingsCount} temuan</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span>Temuan Kritis (Tindakan Cepat):</span>
                  <span className="font-mono font-semibold tabular-nums text-rose-600">{report.patrolDetails.criticalCount} kritis</span>
                </div>
              </div>
            </div>
          )}

          {/* Summary notes */}
          {report.summaryNotes && (
            <div className="space-y-1">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                Catatan Petugas Pemeriksa
              </h4>
              <div className="p-2 bg-[var(--bg-sidebar)] rounded-[4px] border border-[var(--border)] text-[var(--primary)] italic [text-wrap:pretty]">
                “{report.summaryNotes}”
              </div>
            </div>
          )}

          {/* Photo attachment preview */}
          {report.photoUrl && (
            <div className="space-y-1">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                Bukti Foto Dokumentasi Pemeriksaan
              </h4>
              <img
                src={report.photoUrl}
                alt="Bukti Foto Pemeriksaan"
                className="w-full h-36 object-cover rounded-[5px] border border-[var(--border)] image-outline"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end px-4 py-2.5 border-t border-[var(--border)] bg-[var(--bg-sidebar)]/50">
          <button
            type="button"
            onClick={() => {
              if (onEdit) {
                onEdit(report);
              } else {
                onClose();
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-1 text-xs bg-[#eb5757] hover:bg-[#d94444] text-white font-semibold rounded-[4px] cursor-pointer pressable shadow-2xs"
          >
            <Edit3 size={12} strokeWidth={2} />
            <span>Edit</span>
          </button>
        </div>
      </div>
    </div>
  );
};
