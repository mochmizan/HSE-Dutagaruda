import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Flame,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Search,
  Filter,
  MapPin,
  Calendar,
  User,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ExternalLink,
  Printer,
  Table as TableIcon,
  LayoutGrid,
  Check,
  X,
  XCircle,
  HelpCircle,
  Camera,
} from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
  HydrantUnitItem,
  InspectionReport,
  HydrantInspectionStatus,
} from '../../types/hse';
import { HydrantInspectionModal } from './HydrantInspectionModal';
import { AddZoneHydrantModal, HydrantCreationItem } from './AddZoneHydrantModal';
import { AddFindingModal } from './AddFindingModal';
import { HydrantFindingItem } from './types';
import { ApprovalBar, PhotoCard, WORKFLOW_ORDER, type ApprovalRole } from '@/components/ui';
import type { ReportWorkflowStatus } from '../../types/hse';
import {
  petakanUnitHidran,
  useUnitHidran,
  useInspeksiHidran,
  useSimpanInspeksiHidran,
  useBuatUnitHidran,
  useUbahUnitHidran,
} from '@/services/api/queries';
import { useKonteksLokasi } from '@/features/konteksLokasi';

interface HydrantPageProps {
  onBack: () => void;
  onOpenReportDetail?: (report: InspectionReport) => void;
}

export const HydrantPage: React.FC<HydrantPageProps> = ({ onBack, onOpenReportDetail }) => {
  const lokasi = useKonteksLokasi();
  const unitQuery = useUnitHidran();
  const inspeksiQuery = useInspeksiHidran();
  const simpanInspeksi = useSimpanInspeksiHidran();
  const buatUnit = useBuatUnitHidran();
  const ubahUnit = useUbahUnitHidran();

  const [filterTab, setFilterTab] = useState<'ON_PROGRESS' | 'ALL' | 'COMPLETED'>('ALL');
  const [zoneFilter, setZoneFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'TABLE' | 'CARDS'>('TABLE');

  // Modals state
  const [activeInspectionUnit, setActiveInspectionUnit] = useState<HydrantUnitItem | null>(null);
  const [isAddZoneModalOpen, setIsAddZoneModalOpen] = useState(false);
  const [isAddFindingModalOpen, setIsAddFindingModalOpen] = useState(false);

  // Alur persetujuan laporan (sama di semua halaman inspeksi; terkunci saat Disetujui)
  const [workflow, setWorkflow] = useState<ReportWorkflowStatus>('Draft');
  const [role, setRole] = useState<ApprovalRole>('Danru');
  const locked = workflow === 'Approved';
  const advanceWorkflow = (next: ReportWorkflowStatus) => {
    const idx = WORKFLOW_ORDER.indexOf(workflow);
    if (WORKFLOW_ORDER[idx + 1] === next) setWorkflow(next);
  };

  // Month navigation state
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date(2026, 8, 1));
  const handlePrevMonth = () => setSelectedMonth((prev) => subMonths(prev, 1));
  const handleNextMonth = () => setSelectedMonth((prev) => addMonths(prev, 1));
  const handleResetToCurrentMonth = () => setSelectedMonth(new Date(2026, 8, 1));
  const monthLabel = format(selectedMonth, 'MMMM yyyy', { locale: idLocale });
  const isCurrentMonth = selectedMonth.getFullYear() === 2026 && selectedMonth.getMonth() === 8;
  const period = format(selectedMonth, 'yyyy-MM');

  // Unit + hasil inspeksi bulan terpilih dari API, dipetakan ke model UI.
  const units = petakanUnitHidran(
    unitQuery.data ?? [],
    inspeksiQuery.data ?? [],
    lokasi.zonaIdKeNama,
    period,
  );
  const zones = lokasi.zonaNamaList;

  // Catatan Hasil Temuan (Findings documentation photos & descriptions)
  const [findings, setFindings] = useState<HydrantFindingItem[]>([
    {
      id: 'f-1',
      imageUrl: '/findings/finding-1.png',
      description: 'Hose Coupling tidak ada',
      unitCode: 'HYD-01',
      createdAt: '16 Sep 2026',
    },
    {
      id: 'f-2',
      imageUrl: '/findings/finding-2.png',
      description: 'Selang Hydrant robek',
      unitCode: 'HYD-03',
      createdAt: '16 Sep 2026',
    },
    {
      id: 'f-3',
      imageUrl: '/findings/finding-3.png',
      description: 'Outlet sambungan karat dan berair',
      unitCode: 'HYD-04',
      createdAt: '16 Sep 2026',
    },
    {
      id: 'f-4',
      imageUrl: '/findings/finding-4.png',
      description: 'Tidak ada isi pada box Hydrant',
      unitCode: 'HYD-06',
      createdAt: '16 Sep 2026',
    },
    {
      id: 'f-5',
      imageUrl: '/findings/finding-5.png',
      description: 'Hydrant tidak bisa menutup rapat',
      unitCode: 'HYD-05',
      createdAt: '16 Sep 2026',
    },
  ]);

  // Derived counts
  const totalUnits = units.length;
  const onProgressUnits = units.filter(
    (u) => u.status === 'SEDANG_BERJALAN' || u.status === 'BELUM_DIPERIKSA'
  );
  const completedUnits = units.filter((u) => u.status === 'SELESAI');

  // Max unit number for auto-incrementing new units
  const maxUnitNumber = units.reduce((max, u) => {
    const num = parseInt(u.kode.replace(/\D/g, ''), 10) || 0;
    return Math.max(max, num);
  }, 0);

  // Filtered units based on tab, zone, and search query
  const filteredUnits = units.filter((unit) => {
    // Tab filter: ON_PROGRESS shows unfinished units
    if (filterTab === 'ON_PROGRESS' && unit.status === 'SELESAI') return false;
    if (filterTab === 'COMPLETED' && unit.status !== 'SELESAI') return false;

    // Zone filter
    if (zoneFilter !== 'ALL' && unit.zoneName !== zoneFilter) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchKode = unit.kode.toLowerCase().includes(q);
      const matchZone = unit.zoneName.toLowerCase().includes(q);
      const matchInspector = unit.inspectorName?.toLowerCase().includes(q) || false;
      const matchNotes = unit.draftDetails?.notes?.toLowerCase().includes(q) || false;
      if (!matchKode && !matchZone && !matchInspector && !matchNotes) return false;
    }

    return true;
  });

  // Draft & terbit sama-sama menyimpan inspeksi ke API (modal selalu mengisi 6 komponen).
  const handleSaveDraft = (unitId: string, draft: HydrantUnitItem['draftDetails']) => {
    const existing = (inspeksiQuery.data ?? []).find(
      (i) => i.unitId === unitId && i.period.startsWith(period),
    );
    simpanInspeksi.mutate({
      id: existing?.id,
      unitId,
      month: period,
      boxHydrant: draft?.boxHydrant ?? 'LAYAK',
      fireHose: draft?.fireHose ?? 'LAYAK',
      hoseCoupling: draft?.hoseCoupling ?? 'LAYAK',
      hoseRack: draft?.hoseRack ?? 'LAYAK',
      nozzle: draft?.nozzle ?? 'LAYAK',
      valvePillar: draft?.valvePillar ?? 'LAYAK',
      overallStatus: draft?.overallStatus,
      overallOverridden: Boolean(draft?.overallStatus),
      notes: draft?.notes,
    });
  };

  const handleCompleteInspection = (newReport: InspectionReport) => {
    const unit = units.find((u) => u.kode === newReport.assetCode);
    if (unit) {
      const d = newReport.hydrantDetails;
      const existing = (inspeksiQuery.data ?? []).find(
        (i) => i.unitId === unit.id && i.period.startsWith(period),
      );
      simpanInspeksi.mutate({
        id: existing?.id,
        unitId: unit.id,
        month: period,
        boxHydrant: d?.boxHydrant ?? 'LAYAK',
        fireHose: d?.fireHose ?? 'LAYAK',
        hoseCoupling: d?.hoseCoupling ?? 'LAYAK',
        hoseRack: d?.hoseRack ?? 'LAYAK',
        nozzle: d?.nozzle ?? 'LAYAK',
        valvePillar: d?.valvePillar ?? 'LAYAK',
        overallStatus: newReport.overallStatus,
        overallOverridden: true,
        notes: newReport.summaryNotes,
      });
    }
    onOpenReportDetail?.(newReport);
  };

  const handleAddZone = (_zoneName: string) => {
    // Zona dibuat bersama unit pada handleAddHydrantUnits (butuh siteId).
  };

  const handleAddHydrantUnits = (newItems: HydrantCreationItem[]) => {
    if (!lokasi.siteId) return;
    const zonaDibuat = new Set<string>();
    newItems.forEach((item) => {
      buatUnit.mutate({
        siteId: lokasi.siteId,
        zonaBaru: zonaDibuat.has(item.zoneName) ? undefined : item.zoneName,
        unit: {
          siteId: lokasi.siteId,
          // Nama zona dikirim sebagai penanda; id zona nyata mengikuti setelah invalidate.
          zoneId: item.zoneName,
          kode: item.kode,
        },
      });
      zonaDibuat.add(item.zoneName);
    });
    if (filterTab === 'COMPLETED') {
      setFilterTab('ON_PROGRESS');
    }
  };

  const handleReassignUnitZone = (unitId: string, newZoneName: string) => {
    ubahUnit.mutate({
      id: unitId,
      body: { zoneId: lokasi.zonaNamaKeId(newZoneName) || newZoneName },
    });
  };

  const handleAddFinding = (item: Omit<HydrantFindingItem, 'id' | 'createdAt'>) => {
    const newFinding: HydrantFindingItem = {
      ...item,
      id: `finding-${Date.now()}`,
      createdAt: '16 Sep 2026',
    };
    setFindings((prev) => [...prev, newFinding]);
  };

  const handleDeleteFinding = (id: string) => {
    setFindings((prev) => prev.filter((f) => f.id !== id));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-[var(--bg-main)] text-[var(--primary)] px-6 py-4 select-none font-sans">
      {/* Formal Printable Document Header (Visible only when printed) */}
      <div className="hidden print:block pb-3 mb-4 border-b border-black">
        <div className="flex items-center justify-between mb-3">
          <img
            src="/findings/report-header-logos.png"
            alt="Logo Mitra & Pengelola JPM Dukuh Atas"
            className="w-full max-h-16 object-contain"
          />
        </div>
        <div className="flex justify-between items-start pt-1">
          <div>
            <h1 className="text-sm font-extrabold text-black">
              LEMBAR LAPORAN PEMERIKSAAN BERKALA HYDRANT GEDUNG
            </h1>
            <p className="text-[10px] text-gray-700">
              Sesuai Standar K3, NFPA 25 & Permenakertrans No. 04/MEN/1980
            </p>
          </div>
          <div className="text-right text-[10px] text-gray-800 leading-tight">
            <p><span className="font-semibold">Lokasi Fasilitas:</span> {lokasi.siteName}</p>
            <p><span className="font-semibold">Periode Inspeksi:</span> {monthLabel}</p>
            <p><span className="font-semibold">Tanggal Cetak:</span> 30 September 2026</p>
          </div>
        </div>
      </div>

      {/* Top Header & Navigation (Screen only) */}
      <div className="no-print flex flex-col space-y-2 pb-3 mb-4 border-b border-[var(--border)]">
        {/* Back Link & Breadcrumb */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1 text-[var(--primary)] hover:text-[#eb5757] font-medium transition-colors cursor-pointer pressable"
            >
              <ArrowLeft size={13} />
              <span>Kembali ke Dashboard Kalender</span>
            </button>
            <span>/</span>
            <span className="hover:text-[var(--primary)] cursor-pointer">{lokasi.clientName}</span>
            <span>/</span>
            <span className="text-[var(--primary)] font-medium">Inspeksi Hydrant</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
            <MapPin size={12} />
            <span>{lokasi.siteName}</span>
          </div>
        </div>

        {/* Page Title, Month Badge & Top Actions */}
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

                {/* Interactive Month Switcher */}
                <div className="flex items-center bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-[5px] p-0.5 shadow-2xs">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    title="Bulan Sebelumnya"
                    className="w-6 h-6 rounded-[3px] flex items-center justify-center text-[var(--secondary)] hover:text-[var(--primary)] hover:bg-[var(--bg-hover)] cursor-pointer pressable transition-colors"
                  >
                    <ChevronLeft size={13} />
                  </button>

                  <div className="relative flex items-center">
                    <select
                      value={`${selectedMonth.getFullYear()}-${selectedMonth.getMonth()}`}
                      onChange={(e) => {
                        const [year, month] = e.target.value.split('-').map(Number);
                        setSelectedMonth(new Date(year, month, 1));
                      }}
                      className="text-xs font-semibold text-[#eb5757] bg-transparent cursor-pointer py-0.5 px-2 focus:outline-none capitalize pr-5 appearance-none"
                    >
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((m) => {
                        const d = new Date(2026, m, 1);
                        return (
                          <option key={m} value={`2026-${m}`} className="bg-[var(--bg-main)] text-[var(--primary)]">
                            {format(d, 'MMMM yyyy', { locale: idLocale })}
                          </option>
                        );
                      })}
                    </select>
                    <ChevronDown size={11} className="absolute right-1 text-[#eb5757] pointer-events-none" />
                  </div>

                  <button
                    type="button"
                    onClick={handleNextMonth}
                    title="Bulan Berikutnya"
                    className="w-6 h-6 rounded-[3px] flex items-center justify-center text-[var(--secondary)] hover:text-[var(--primary)] hover:bg-[var(--bg-hover)] cursor-pointer pressable transition-colors"
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>

                {!isCurrentMonth && (
                  <button
                    type="button"
                    onClick={handleResetToCurrentMonth}
                    className="text-[11px] font-medium px-2 py-0.5 rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--bg-hover)] cursor-pointer transition-colors shadow-2xs"
                  >
                    Bulan Ini
                  </button>
                )}
              </div>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                Monitoring progres pemeriksaan fisik 6 komponen hydrant gedung per unit
              </p>
            </div>
          </div>

          {/* Top Quick Actions: Add Zone/Hydrants & Print */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAddZoneModalOpen(true)}
              disabled={locked}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#eb5757] hover:bg-[#d94444] text-white text-xs font-semibold rounded-[4px] shadow-xs cursor-pointer pressable disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>Tambah Zona & Unit</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              title="Cetak lembar laporan ke printer atau simpan sebagai PDF"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-main)] hover:bg-[var(--bg-hover)] text-[var(--primary)] border border-[var(--border)] text-xs font-semibold rounded-[4px] shadow-2xs cursor-pointer pressable"
            >
              <Printer size={14} />
              <span>Cetak</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alur persetujuan laporan (layar saja; sama di semua halaman inspeksi) */}
      <ApprovalBar
        workflow={workflow}
        role={role}
        accent="#eb5757"
        onRoleChange={setRole}
        onAdvance={advanceWorkflow}
      />

      {/* 4 Summary Stats Cards (Screen view) */}
      <div className="no-print grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {/* Card 1: Total Units */}
        <div className="p-3 bg-[var(--bg-main)] border border-[var(--border)] rounded-[6px] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
              Total Hydrant Terdaftar
            </span>
            <span className="text-xs">ðŸ¢</span>
          </div>
          <div className="my-1.5">
            <div className="text-2xl font-bold font-mono text-[var(--primary)] tabular-nums">
              {totalUnits} Unit
            </div>
            <div className="text-[10px] text-[var(--muted)] mt-0.5">
              {zones.length} Zona Terpantau
            </div>
          </div>
          <div className="text-[10px] text-[var(--muted)] pt-1 border-t border-[var(--border)]">
            Wajib periksa 1x per bulan
          </div>
        </div>

        {/* Card 2: On Progress (Highlighted Red/Amber) */}
        <div className="p-3 bg-gradient-to-b from-[#eb5757]/[0.09] to-[#eb5757]/[0.02] dark:from-[#eb5757]/[0.15] dark:to-[#eb5757]/[0.04] border border-[#eb5757]/35 rounded-[6px] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#eb5757] uppercase tracking-wider">
              Sedang Berjalan (On Progress)
            </span>
            <span className="text-[10px] bg-[#eb5757] text-white font-bold px-1.5 py-0.2 rounded">
              Prioritas
            </span>
          </div>
          <div className="my-1.5">
            <div className="text-2xl font-bold font-mono text-[#eb5757] tabular-nums">
              {onProgressUnits.length} Unit
            </div>
            <div className="text-[10px] text-[#eb5757]/80 mt-0.5">
              Menunggu / dalam proses verifikasi
            </div>
          </div>
          <div className="text-[10px] text-[#eb5757] pt-1 border-t border-[#eb5757]/20 font-medium">
            Fokus inspeksi shift minggu ini
          </div>
        </div>

        {/* Card 3: Completed */}
        <div className="p-3 bg-gradient-to-b from-emerald-500/[0.08] to-emerald-500/[0.02] dark:from-emerald-500/[0.14] dark:to-emerald-500/[0.04] border border-emerald-500/30 rounded-[6px] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Selesai Diperiksa
            </span>
            <span className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.2 rounded">
              Lengkap
            </span>
          </div>
          <div className="my-1.5">
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
              {completedUnits.length} Unit
            </div>
            <div className="text-[10px] text-[var(--muted)] mt-0.5">
              100% Layak beroperasi
            </div>
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 pt-1 border-t border-emerald-500/20 font-medium">
            Laporan telah diterbitkan
          </div>
        </div>

        {/* Card 4: Progress Percentage */}
        <div className="p-3 bg-[var(--bg-main)] border border-[var(--border)] rounded-[6px] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
              Kemajuan Bulan Ini
            </span>
            <span className="text-xs">ðŸ“Š</span>
          </div>
          <div className="my-1.5">
            <div className="text-2xl font-bold font-mono text-[var(--primary)] tabular-nums">
              {totalUnits > 0 ? Math.round((completedUnits.length / totalUnits) * 100) : 0}%
            </div>
            {/* Progress bar */}
            <div className="w-full bg-[var(--bg-hover)] h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className="bg-[#eb5757] h-full rounded-full transition-all duration-300"
                style={{ width: `${totalUnits > 0 ? (completedUnits.length / totalUnits) * 100 : 0}%` }}
              />
            </div>
          </div>
          <div className="text-[10px] text-[var(--muted)] pt-1 border-t border-[var(--border)]">
            Target 100% sebelum 30 September
          </div>
        </div>
      </div>

      {/* Filter Tabs & View Controls Toolbar */}
      <div className="no-print flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 pb-3 mb-3 border-b border-[var(--border)]">
        {/* Segmented Filter Tabs */}
        <div className="flex items-center gap-1 bg-[var(--bg-sidebar)] p-0.5 rounded-[5px] border border-[var(--border)] text-xs flex-wrap">
          <button
            type="button"
            onClick={() => setFilterTab('ALL')}
            className={`py-1.5 px-3 rounded-[4px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              filterTab === 'ALL'
                ? 'bg-[#eb5757] text-white font-semibold shadow-xs'
                : 'text-[var(--secondary)] hover:text-[var(--primary)]'
            }`}
          >
            <span>Semua Unit</span>
            <span
              className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                filterTab === 'ALL'
                  ? 'bg-black/20 text-white'
                  : 'bg-[var(--bg-hover)] text-[var(--muted)]'
              }`}
            >
              {totalUnits}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('ON_PROGRESS')}
            className={`py-1.5 px-3 rounded-[4px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              filterTab === 'ON_PROGRESS'
                ? 'bg-[#eb5757] text-white font-semibold shadow-xs'
                : 'text-[var(--secondary)] hover:text-[var(--primary)]'
            }`}
          >
            <span>Sedang Berjalan (On Progress)</span>
            <span
              className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                filterTab === 'ON_PROGRESS'
                  ? 'bg-black/20 text-white'
                  : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
              }`}
            >
              {onProgressUnits.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('COMPLETED')}
            className={`py-1.5 px-3 rounded-[4px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              filterTab === 'COMPLETED'
                ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                : 'text-[var(--secondary)] hover:text-[var(--primary)]'
            }`}
          >
            <span>Selesai Diperiksa</span>
            <span
              className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                filterTab === 'COMPLETED'
                  ? 'bg-black/20 text-white'
                  : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {completedUnits.length}
            </span>
          </button>
        </div>

        {/* Right Toolbar: Zone Filter, Search & Table/Card View Toggle */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Zone Filter */}
          <select
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] focus:outline-none focus:border-[#eb5757]"
          >
            <option value="ALL">Semua Zona ({zones.length})</option>
            {zones.map((z) => (
              <option key={z} value={z}>{z}</option>
            ))}
          </select>

          {/* Search Box */}
          <div className="relative min-w-[170px] flex-1 sm:flex-initial">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input
              type="text"
              placeholder="Cari unit atau zona..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7 pr-2.5 py-1.5 text-xs bg-[var(--bg-main)] border border-[var(--border)] rounded-[4px] text-[var(--primary)] placeholder-[var(--muted)] focus:outline-none focus:border-[#eb5757]"
            />
          </div>

          {/* Layout Mode Toggle: Table vs Cards (User can revert or switch) */}
          <div className="flex items-center bg-[var(--bg-sidebar)] p-0.5 rounded-[4px] border border-[var(--border)] text-xs">
            <button
              type="button"
              onClick={() => setViewMode('TABLE')}
              title="Tampilan Tabel (Mudah dicetak / ekspor)"
              className={`p-1.5 rounded-[3px] flex items-center gap-1 cursor-pointer transition-colors ${
                viewMode === 'TABLE'
                  ? 'bg-[var(--bg-main)] text-[var(--primary)] font-semibold shadow-2xs border border-[var(--border)]'
                  : 'text-[var(--secondary)] hover:text-[var(--primary)]'
              }`}
            >
              <TableIcon size={14} />
              <span className="hidden sm:inline text-[11px]">Tabel</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('CARDS')}
              title="Tampilan Kartu"
              className={`p-1.5 rounded-[3px] flex items-center gap-1 cursor-pointer transition-colors ${
                viewMode === 'CARDS'
                  ? 'bg-[var(--bg-main)] text-[var(--primary)] font-semibold shadow-2xs border border-[var(--border)]'
                  : 'text-[var(--secondary)] hover:text-[var(--primary)]'
              }`}
            >
              <LayoutGrid size={14} />
              <span className="hidden sm:inline text-[11px]">Kartu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Hydrant Data Content */}
      <div className="space-y-3 pb-8 flex-1">
        {/* Section A Title (Visible in print) */}
        <div className="hidden print:block mb-2">
          <h2 className="text-xs font-bold text-black uppercase tracking-wider">
            A. Hasil Pemeriksaan Fisik Unit Hydrant
          </h2>
        </div>
        {filteredUnits.length === 0 ? (
          <div className="py-16 text-center text-xs text-[var(--muted)] border border-dashed border-[var(--border)] rounded-[8px] bg-[var(--bg-sidebar)]/50">
            <Flame size={32} className="mx-auto mb-2 text-[#eb5757]/40" />
            <p className="font-semibold text-sm text-[var(--primary)]">Tidak ada unit hydrant yang cocok</p>
            <p className="text-xs text-[var(--muted)] mt-1">
              Coba sesuaikan tab filter atau kata kunci pencarian Anda.
            </p>
            <div className="mt-3 flex items-center justify-center gap-2">
              {filterTab !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setFilterTab('ALL')}
                  className="px-3 py-1.5 text-xs font-semibold text-[#eb5757] bg-[#eb5757]/10 hover:bg-[#eb5757]/20 rounded-[4px] cursor-pointer"
                >
                  Tampilkan Semua Unit
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsAddZoneModalOpen(true)}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-[#eb5757] hover:bg-[#d94444] rounded-[4px] cursor-pointer"
              >
                + Tambah Unit Baru
              </button>
            </div>
          </div>
        ) : viewMode === 'TABLE' ? (
          /* ========================================================================= */
          /* TABLE LAYOUT: Print-ready, compact, comprehensive industrial inspection sheet */
          /* ========================================================================= */
          <div className="overflow-x-auto rounded-[6px] border border-[var(--border)] bg-[var(--bg-main)] shadow-2xs">
            <table className="w-full text-center border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-sidebar)]/80 text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wider">
                  <th className="py-2.5 px-3 w-12 text-center align-middle">No.</th>
                  <th className="py-2.5 px-3 min-w-[90px] text-center align-middle">Kode Unit</th>
                  <th className="py-2.5 px-3 min-w-[210px] text-center align-middle">Lokasi & Zona</th>
                  <th className="py-2.5 px-3 min-w-[264px] text-center align-middle">
                    <div className="flex items-center justify-center gap-1 text-center">
                      <span>Verifikasi 6 Komponen</span>
                    </div>
                  </th>
                  <th className="py-2.5 px-3 min-w-[140px] text-center align-middle">Status Kelayakan</th>
                  <th className="py-2.5 px-3 min-w-[200px] text-center align-middle">Petugas & Tanggal</th>
                  <th className="py-2.5 px-3 min-w-[280px] text-center align-middle">Catatan / Temuan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-xs">
                {filteredUnits.map((unit, idx) => {
                  const isCompleted = unit.status === 'SELESAI';
                  const isOnProgress = unit.status === 'SEDANG_BERJALAN';

                  // Component status lookup from completed report or draft
                  const details = unit.completedReport?.hydrantDetails || unit.draftDetails;
                  const box = details?.boxHydrant;
                  const hose = details?.fireHose;
                  const coupling = details?.hoseCoupling;
                  const rack = details?.hoseRack;
                  const nozzle = details?.nozzle;
                  const valve = details?.valvePillar;
                  const isUnitTidakLayak =
                    unit.completedReport?.overallStatus === 'TIDAK_LAYAK' ||
                    unit.draftDetails?.overallStatus === 'TIDAK_LAYAK' ||
                    [box, hose, coupling, rack, nozzle, valve].some(
                      (s) => s === 'TIDAK_LAYAK' || s === 'HILANG'
                    );

                  // Real notes lookup from completed report or draft details (no hardcoded placeholder)
                  const notesText =
                    unit.completedReport?.summaryNotes ||
                    unit.draftDetails?.notes ||
                    '';

                  return (
                    <tr
                      key={unit.id}
                      onClick={() => {
                        if (locked) {
                          if (unit.status === 'SELESAI' && unit.completedReport) {
                            onOpenReportDetail?.(unit.completedReport);
                          }
                          return;
                        }
                        if (unit.status === 'SELESAI' && unit.completedReport) {
                          onOpenReportDetail?.(unit.completedReport);
                        } else {
                          setActiveInspectionUnit(unit);
                        }
                      }}
                      title="Klik baris untuk melihat detail atau memperbarui hasil inspeksi"
                      className={`transition-colors cursor-pointer ${
                        isUnitTidakLayak
                          ? 'bg-gradient-to-r from-[#eb5757]/[0.12] via-[#eb5757]/[0.06] to-[#eb5757]/[0.02] dark:from-[#eb5757]/[0.18] dark:via-[#eb5757]/[0.09] dark:to-[#eb5757]/[0.04] hover:from-[#eb5757]/[0.18] hover:to-[#eb5757]/[0.08]'
                          : isCompleted
                          ? 'bg-gradient-to-r from-emerald-500/[0.12] via-emerald-500/[0.06] to-emerald-500/[0.02] dark:from-emerald-500/[0.18] dark:via-emerald-500/[0.09] dark:to-emerald-500/[0.04] hover:from-emerald-500/[0.18] hover:to-emerald-500/[0.08]'
                          : isOnProgress
                          ? 'bg-[#eb5757]/[0.02] hover:bg-[var(--bg-hover)]/60'
                          : 'hover:bg-[var(--bg-hover)]/60'
                      }`}
                    >
                      {/* 1. Index No. */}
                      <td className="py-2.5 px-3 text-center align-middle font-mono text-[var(--muted)] tabular-nums">
                        {idx + 1}
                      </td>

                      {/* 2. Kode Unit (Text Only) */}
                      <td className="py-2.5 px-3 text-center align-middle font-semibold text-[var(--primary)] font-mono">
                        <span>{unit.kode}</span>
                      </td>

                      {/* 3. Lokasi & Zona */}
                      <td className="py-2.5 px-3 text-center align-middle font-semibold text-[var(--primary)]">
                        <span>{unit.zoneName}</span>
                      </td>

                      {/* 4. 6 Komponen Checklist */}
                      <td className="py-2.5 px-3 text-left align-middle">
                        <div className="flex items-center justify-start gap-1 flex-wrap">
                          {[
                            { label: 'Box Hydrant', status: box },
                            { label: 'Fire Hose', status: hose },
                            { label: 'Hose Coupling', status: coupling },
                            { label: 'Hose Rack', status: rack },
                            { label: 'Nozzle', status: nozzle },
                            { label: 'Valve/Pillar Hydrant', status: valve },
                          ].map((item) => {
                            const isOk = item.status === 'LAYAK';
                            const isNotLayak = item.status === 'TIDAK_LAYAK' || item.status === 'HILANG';
                            const isChecked = Boolean(item.status);

                            return (
                              <span
                                key={item.label}
                                title={`${item.label}: ${item.status || 'Belum diperiksa'}`}
                                className={`px-1.5 py-0.5 rounded-[3px] text-[10px] font-mono border inline-flex items-center gap-0.5 ${
                                  isOk
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold'
                                    : isNotLayak
                                    ? 'bg-red-500/20 border-red-500/40 text-red-600 dark:text-red-400 font-bold'
                                    : isChecked
                                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                                    : 'bg-[var(--bg-hover)] border-[var(--border)] text-[var(--muted)]'
                                }`}
                              >
                                <span>{item.label}</span>
                                {isOk ? (
                                  <Check size={9} strokeWidth={2.5} />
                                ) : isNotLayak ? (
                                  <X size={10} strokeWidth={2.5} className="text-red-600 dark:text-red-400" />
                                ) : (
                                  <span className="text-[8px] text-[var(--muted)]">â€¢</span>
                                )}
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      {/* 5. Status Kelayakan */}
                      <td className="py-2.5 px-3 text-center align-middle">
                        {isUnitTidakLayak ? (
                          <span className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
                            <X size={11} strokeWidth={2.5} /> TIDAK LAYAK
                          </span>
                        ) : isCompleted ? (
                          <span className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 size={11} /> LAYAK
                          </span>
                        ) : isOnProgress ? (
                          <span className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                            <Clock size={11} /> Berjalan
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-[3px] text-[10px] font-medium bg-[var(--bg-hover)] text-[var(--muted)] border border-[var(--border)]">
                            <AlertCircle size={11} /> Belum Dimulai
                          </span>
                        )}
                      </td>

                      {/* 6. Petugas & Tanggal */}
                      <td className="py-2.5 px-3 text-center align-middle text-[11px] text-[var(--secondary)]">
                        <div className="leading-tight text-center flex flex-col items-center justify-center">
                          <p className="font-medium text-[var(--primary)] truncate max-w-[190px] text-center">
                            {unit.inspectorName || 'Alex Chen (Staff)'}
                          </p>
                          <p className="text-[10px] text-[var(--muted)] font-mono mt-0.5 text-center">
                            {isCompleted ? '04 Sep 2026' : unit.scheduledDate || 'Bulan Ini'}
                          </p>
                        </div>
                      </td>

                      {/* 7. Catatan / Temuan (Shows actual notes, never placeholder) */}
                      <td className="py-2.5 px-3 text-center align-middle text-[11px] text-[var(--secondary)]">
                        <div className="flex items-center justify-center text-center">
                          {notesText ? (
                            <span className="italic line-clamp-2 max-w-[320px] text-[var(--primary)] text-center inline-block" title={notesText}>
                              â€œ{notesText}â€
                            </span>
                          ) : (
                            <span className="text-[var(--muted)] text-[10px] text-center inline-block">
                              â€“
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* ========================================================================= */
          /* CARD GRID LAYOUT (Alternative view mode) */
          /* ========================================================================= */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredUnits.map((unit) => {
              const isCompleted = unit.status === 'SELESAI';
              const isOnProgress = unit.status === 'SEDANG_BERJALAN';

              // Component status lookup
              const details = unit.completedReport?.hydrantDetails || unit.draftDetails;
              const box = details?.boxHydrant;
              const hose = details?.fireHose;
              const coupling = details?.hoseCoupling;
              const rack = details?.hoseRack;
              const nozzle = details?.nozzle;
              const valve = details?.valvePillar;
              const isUnitTidakLayak =
                unit.completedReport?.overallStatus === 'TIDAK_LAYAK' ||
                unit.draftDetails?.overallStatus === 'TIDAK_LAYAK' ||
                [box, hose, coupling, rack, nozzle, valve].some(
                  (s) => s === 'TIDAK_LAYAK' || s === 'HILANG'
                );

              return (
                <div
                  key={unit.id}
                  className={`p-3.5 rounded-[6px] border bg-[var(--bg-main)] hover:shadow-xs transition-all flex flex-col justify-between ${
                    isUnitTidakLayak
                      ? 'border-red-500/40 bg-gradient-to-r from-red-500/[0.04] to-transparent'
                      : isOnProgress
                      ? 'border-[#eb5757]/40 bg-gradient-to-r from-[#eb5757]/[0.03] to-transparent'
                      : isCompleted
                      ? 'border-emerald-500/30'
                      : 'border-[var(--border)]'
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-[var(--primary)] tracking-tight font-mono">
                          {unit.kode}
                        </h3>
                        <span className="text-[10px] text-[var(--secondary)]">
                          {unit.zoneName}
                        </span>
                      </div>

                      {/* Status */}
                      {isUnitTidakLayak ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
                          <X size={11} strokeWidth={2.5} /> TIDAK LAYAK
                        </span>
                      ) : isCompleted ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 size={11} /> LAYAK
                        </span>
                      ) : isOnProgress ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                          <Clock size={11} /> Berjalan
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] text-[10px] font-medium bg-[var(--bg-hover)] text-[var(--muted)]">
                          Belum Dimulai
                        </span>
                      )}
                    </div>

                    {/* 6 Components mini chips */}
                    <div className="mt-3 pt-2 border-t border-[var(--border)]">
                      <div className="flex flex-wrap gap-1">
                        {[
                          { label: 'Box Hydrant', status: box },
                          { label: 'Fire Hose', status: hose },
                          { label: 'Hose Coupling', status: coupling },
                          { label: 'Hose Rack', status: rack },
                          { label: 'Nozzle', status: nozzle },
                          { label: 'Valve/Pillar Hydrant', status: valve },
                        ].map((item) => {
                          const isOk = item.status === 'LAYAK' || (isCompleted && !item.status && !isUnitTidakLayak);
                          const isNotLayak = item.status === 'TIDAK_LAYAK' || item.status === 'HILANG';
                          const isChecked = Boolean(item.status) || isCompleted;

                          return (
                            <span
                              key={item.label}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono flex items-center gap-1 border ${
                                isOk
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold'
                                  : isNotLayak
                                  ? 'bg-red-500/20 border-red-500/40 text-red-600 dark:text-red-400 font-bold'
                                  : isChecked
                                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                                  : 'bg-[var(--bg-hover)] border-dashed border-[var(--border)] text-[var(--muted)]'
                              }`}
                            >
                              {isOk ? (
                                <Check size={9} strokeWidth={2.5} />
                              ) : isNotLayak ? (
                                <X size={10} strokeWidth={2.5} className="text-red-600 dark:text-red-400" />
                              ) : (
                                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                              )}
                              <span>{item.label}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Footer & Action */}
                  <div className="mt-3 pt-2.5 border-t border-[var(--border)] flex items-center justify-between text-xs">
                    <span className="text-[10px] text-[var(--muted)] font-mono">
                      {isCompleted ? '04 Sep 2026' : unit.scheduledDate || 'Bulan Ini'}
                    </span>

                    {isCompleted ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (unit.completedReport) {
                            onOpenReportDetail?.(unit.completedReport);
                          }
                        }}
                        className="px-2.5 py-1 text-xs font-semibold rounded-[4px] border border-[var(--border)] hover:bg-[var(--bg-hover)] text-[var(--primary)] cursor-pointer flex items-center gap-1 pressable"
                      >
                        <span>Lihat Laporan</span>
                        <ExternalLink size={11} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={locked}
                        onClick={() => setActiveInspectionUnit(unit)}
                        className="px-3 py-1 text-xs font-semibold rounded-[4px] bg-[#eb5757] hover:bg-[#d94444] text-white shadow-xs cursor-pointer flex items-center gap-1 pressable disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <span>{isOnProgress ? 'Lanjutkan' : 'Mulai Inspeksi'}</span>
                        <ChevronRight size={12} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION B: CATATAN HASIL TEMUAN */}
      {/* ========================================================================= */}
      <div className="my-8 border-t border-[var(--border)] print:border-t print:border-black print:my-6 print:break-before-page" />

      <div className="space-y-4">
        {/* Section Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-[var(--primary)] tracking-tight print:text-black print:text-sm">
              B. Catatan Hasil temuan
            </h2>
            <p className="no-print text-xs text-[var(--muted)] mt-0.5">
              Dokumentasi foto dan catatan fisik ketidaksesuaian unit hydrant di lapangan
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddFindingModalOpen(true)}
            disabled={locked}
            className="no-print px-3 py-1.5 text-xs font-semibold rounded-[4px] bg-[#eb5757] hover:bg-[#d94444] text-white shadow-2xs cursor-pointer flex items-center gap-1.5 pressable disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Camera size={13} strokeWidth={2.2} />
            <span>Tambah Temuan</span>
          </button>
        </div>

        {/* Finding Cards Grid (no table, card only - 75% scaled size) */}
        {findings.length === 0 ? (
          <div className="p-8 rounded-[6px] border border-dashed border-[var(--border)] text-center text-xs text-[var(--muted)] space-y-2">
            <Camera size={24} className="mx-auto text-[var(--muted)] opacity-60" />
            <p className="font-semibold text-[var(--secondary)]">Belum ada catatan hasil temuan</p>
            <p className="text-[11px]">
              Klik tombol "+ Tambah Temuan" untuk menambahkan dokumentasi foto temuan fisik.
            </p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto w-full px-2 sm:px-4">
            <div
              className="grid grid-cols-1 sm:grid-cols-2 gap-y-10 sm:gap-y-12 print:max-w-none print:grid-cols-2 print:gap-x-24 print:gap-y-10"
              style={{ columnGap: 'clamp(3.5rem, 7vw, 6.5rem)' }}
            >
              {findings.map((finding) => (
                <PhotoCard
                  key={finding.id}
                  imageUrl={finding.imageUrl}
                  caption={finding.description}
                  onDelete={locked ? undefined : () => handleDeleteFinding(finding.id)}
                  deleteTitle="Hapus temuan"
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Formal Printable Document Signature Footer (Visible only when printed) */}
      <div className="hidden print:block pt-8 mt-8 border-t border-black print:break-inside-avoid">
        <div className="grid grid-cols-3 gap-6 text-center text-xs text-black">
          <div>
            <p className="font-semibold">Petugas Pemeriksa (Inspector)</p>
            <div className="h-16"></div>
            <p className="font-bold underline">( Alex Chen )</p>
            <p className="text-[10px] text-gray-700">Staff HSE / Teknisi K3</p>
          </div>
          <div>
            <p className="font-semibold">Diverifikasi Oleh (Supervisor)</p>
            <div className="h-16"></div>
            <p className="font-bold underline">( Budi Santoso )</p>
            <p className="text-[10px] text-gray-700">HSE Officer & Koordinator</p>
          </div>
          <div>
            <p className="font-semibold">Disetujui Oleh (Site Manager)</p>
            <div className="h-16"></div>
            <p className="font-bold underline">( Ir. Hendra Wijaya )</p>
            <p className="text-[10px] text-gray-700">Kepala Operasional Logistik</p>
          </div>
        </div>
      </div>

      {/* 1. Modal Tambah Zona & Unit Hydrant */}
      <AddZoneHydrantModal
        isOpen={isAddZoneModalOpen}
        onClose={() => setIsAddZoneModalOpen(false)}
        existingZones={zones}
        existingUnits={units.map((u) => ({ id: u.id, kode: u.kode, zoneName: u.zoneName }))}
        lastUnitNumber={maxUnitNumber}
        onAddZone={handleAddZone}
        onAddHydrantUnits={handleAddHydrantUnits}
        onReassignUnitZone={handleReassignUnitZone}
      />

      {/* 2. Modal Inspeksi 6 Komponen Hydrant */}
      <HydrantInspectionModal
        unit={activeInspectionUnit}
        isOpen={Boolean(activeInspectionUnit)}
        onClose={() => setActiveInspectionUnit(null)}
        onSaveDraft={handleSaveDraft}
        onCompleteInspection={handleCompleteInspection}
      />

      {/* 3. Modal Tambah Catatan Hasil Temuan */}
      <AddFindingModal
        isOpen={isAddFindingModalOpen}
        onClose={() => setIsAddFindingModalOpen(false)}
        onAddFinding={handleAddFinding}
        existingUnits={units.map((u) => u.kode)}
      />
    </div>
  );
};
