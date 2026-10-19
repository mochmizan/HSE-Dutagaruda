import React, { useEffect, useMemo, useState } from 'react';
import {
  Flame,
  Plus,
  Search,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Printer,
} from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { HydrantUnitItem, InspectionReport } from '../../types/hse';
import { HydrantInspectionModal } from './HydrantInspectionModal';
import { HydrantTable } from './HydrantTable';
import { HydrantCards } from './HydrantCards';
import { HydrantFindings } from './HydrantFindings';
import { AddZoneHydrantModal, HydrantCreationItem } from './AddZoneHydrantModal';
import { AddFindingModal } from './AddFindingModal';
import { HydrantFindingItem } from './types';
import { UnduhPdfButton, ViewToggle } from '@/components/ui';
import {
  petakanUnitHidran,
  useUnitHidran,
  useInspeksiHidran,
  useSimpanInspeksiHidran,
  useBatalkanTerbitHidran,
  useHapusInspeksiHidran,
  useHapusUnitHidran,
  useBuatUnitHidran,
  useUbahUnitHidran,
  useUnggahFoto,
  useHapusFoto,
  useFotoInspeksi,
} from '@/services/api/queries';
import { useKonteksLokasi } from '@/features/konteksLokasi';
import { TombolPerluas } from '@/features/navigation';
import type { ApiInspeksiHidran } from '@/services/api/klien';

/** Aksen halaman Hydrant, satu tempat. */
const AKSEN = '#2f80ed';

interface HydrantPageProps {
  onBack: () => void;
  /** Permintaan sunting dari dasbor: buka modal inspeksi rekam dengan id ini. */
  suntingRefId?: { kategori: string | null; refId: string } | null;
  onSuntingSelesai?: () => void;
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
}

export const HydrantPage: React.FC<HydrantPageProps> = ({
  suntingRefId,
  onSuntingSelesai,
  isCollapsed,
  onToggleCollapsed,
}) => {
  const lokasi = useKonteksLokasi();
  const unitQuery = useUnitHidran();
  const inspeksiQuery = useInspeksiHidran();
  const simpanInspeksi = useSimpanInspeksiHidran();
  const batalkanTerbit = useBatalkanTerbitHidran();
  const hapusInspeksi = useHapusInspeksiHidran();
  const hapusUnit = useHapusUnitHidran();
  const buatUnit = useBuatUnitHidran();
  const ubahUnit = useUbahUnitHidran();

  // Lokasi aktif memilih barisnya: unit + inspeksi lokasi lain tidak tampil.
  const unitSite = useMemo(
    () => (unitQuery.data ?? []).filter((u) => u.siteId === lokasi.siteId),
    [unitQuery.data, lokasi.siteId],
  );
  const inspeksiSite = useMemo(() => {
    const idUnit = new Set(unitSite.map((u) => u.id));
    return (inspeksiQuery.data ?? []).filter((i) => idUnit.has(i.unitId));
  }, [inspeksiQuery.data, unitSite]);

  const [filterTab, setFilterTab] = useState<'ON_PROGRESS' | 'ALL' | 'COMPLETED'>('ALL');
  const [zoneFilter, setZoneFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'TABLE' | 'CARDS'>('TABLE');

  // Modals state
  const [activeInspectionUnit, setActiveInspectionUnit] = useState<HydrantUnitItem | null>(null);
  const [isAddZoneModalOpen, setIsAddZoneModalOpen] = useState(false);
  const [isAddFindingModalOpen, setIsAddFindingModalOpen] = useState(false);

  // Foto bukti dibaca dari API (lihat `fotoBukti` di bawah), bukan disimpan per
  // sesi: tutup/buka ulang modal atau muat ulang halaman harus tetap menampilkan
  // foto yang sama.
  const unggahFoto = useUnggahFoto();
  const hapusFoto = useHapusFoto();
  // Month navigation state (di atas: inspeksiAktif memakai period).
  // Bawaan = bulan kalender nyata agar data bulan berjalan langsung tampil.
  const [selectedMonth, setSelectedMonth] = useState<Date>(() => {
    const kini = new Date();
    return new Date(kini.getFullYear(), kini.getMonth(), 1);
  });
  const handlePrevMonth = () => setSelectedMonth((prev) => subMonths(prev, 1));
  const handleNextMonth = () => setSelectedMonth((prev) => addMonths(prev, 1));
  const handleResetToCurrentMonth = () => {
    const kini = new Date();
    setSelectedMonth(new Date(kini.getFullYear(), kini.getMonth(), 1));
  };
  const monthLabel = format(selectedMonth, 'MMMM yyyy', { locale: idLocale });
  const isCurrentMonth = (() => {
    const kini = new Date();
    return selectedMonth.getFullYear() === kini.getFullYear() && selectedMonth.getMonth() === kini.getMonth();
  })();
  const period = format(selectedMonth, 'yyyy-MM');

  const inspeksiAktif: ApiInspeksiHidran | null = activeInspectionUnit
    ? inspeksiSite.find(
        (i) => i.unitId === activeInspectionUnit.id && i.period.startsWith(period),
      ) ?? null
    : null;

  // Bukti inspeksi unit yang sedang dibuka, dibaca dari API — bukan state sesi,
  // jadi tutup/buka ulang atau muat ulang tidak menghilangkan foto. Rekam ini
  // juga bisa memuat foto temuan (bila unit ini jangkar Section B): saring.
  const fotoAktif = useFotoInspeksi(inspeksiAktif?.id ?? null, 'hydrant');
  const buktiAktif = (fotoAktif.data ?? []).filter((f) => !f.temuan);

  // Hapus rekam inspeksi bulan ini: hook membersihkan foto anak dulu (cegah 409),
  // laman sekadar menutup modal.
  const handleHapusBulan = () => {
    if (!inspeksiAktif) return;
    hapusInspeksi.mutate(inspeksiAktif.id);
    setActiveInspectionUnit(null);
  };

  // Hapus unit sebaris seluruh datanya (dipakai popup bulan tanpa rekam:
  // belum dimulai = tidak ada rekam bulan untuk dihapus).
  const handleHapusUnit = () => {
    if (!activeInspectionUnit) return;
    hapusUnit.mutate(activeInspectionUnit.id);
    setActiveInspectionUnit(null);
  };

  // Sunting dari dasbor: bila rekamnya bulan terpilih, buka modal inspeksinya.
  useEffect(() => {
    if (!suntingRefId || suntingRefId.kategori !== 'hydrant') return;
    const insp = (inspeksiQuery.data ?? []).find((i) => i.id === suntingRefId.refId);
    if (!insp) return;
    const unit = (unitQuery.data ?? []).find((u) => u.id === insp.unitId);
    if (unit) {
      if (unit.siteId !== lokasi.siteId) lokasi.pilihLokasi(unit.siteId);
      setSelectedMonth(new Date(Number(insp.period.slice(0, 4)), Number(insp.period.slice(5, 7)) - 1, 1));
      setActiveInspectionUnit({
        id: unit.id,
        kode: unit.kode,
        siteId: unit.siteId,
        zoneId: unit.zoneId,
        zoneName: lokasi.zonaIdKeNama(unit.zoneId),
        status: 'SELESAI',
        period,
        inspectorName: 'Pengawas K3',
        componentsCheckedCount: 6,
        componentsTotal: 6,
        scheduledDate: 'Bulan Ini',
      });
      onSuntingSelesai?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- satu kali per permintaan sunting
  }, [suntingRefId, inspeksiQuery.data, unitQuery.data]);

  // Unit + hasil inspeksi bulan terpilih dari API, dipetakan ke model UI.
  // Memoized: identitas objek unit stabil antar-render — efek init modal
  // tidak boleh menyala setiap refetch (mematikan mode terbit / menimpa
  // ketikan yang sedang berjalan).
  const units = useMemo(
    () =>
      petakanUnitHidran(
        unitSite,
        inspeksiSite,
        lokasi.zonaIdKeNama,
        period,
      ),
    [unitSite, inspeksiSite, lokasi.zonaIdKeNama, period],
  );
  const zones = lokasi.zonaNamaList;

  // B. Catatan hasil temuan = HANYA foto bertanda `temuan` pada rekam jangkar
  // bulan terpilih. Foto bukti inspeksi (unggahan dari modal) bukan temuan.
  const jangkarTemuan =
    inspeksiSite.find((i) => i.period.startsWith(period))?.id ?? null;
  const fotoTemuan = useFotoInspeksi(jangkarTemuan, 'hydrant');
  const findings: HydrantFindingItem[] = useMemo(
    () =>
      (fotoTemuan.data ?? [])
        .filter((f) => f.temuan)
        .map((f) => ({
          id: f.id,
          imageUrl: f.url,
          description: f.caption || 'Temuan dokumentasi',
        })),
    [fotoTemuan.data],
  );

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

  // Terbit menyimpan inspeksi ke API (modal selalu mengisi 6 komponen).
  // Promise-nya dikembalikan: modal menunggu tulisan, dan potret terbit hanya
  // muncul setelah rekamnya ada.
  const handleCompleteInspection = async (newReport: InspectionReport) => {
    const unit = units.find((u) => u.kode === newReport.assetCode);
    if (!unit) {
      window.alert(
        `Unit ${newReport.assetCode} tidak ditemukan di lokasi ini. Muat ulang halaman lalu coba lagi.`,
      );
      throw new Error(`Unit ${newReport.assetCode} tidak ditemukan.`);
    }
    const d = newReport.hydrantDetails;
    const existing = inspeksiSite.find(
      (i) => i.unitId === unit.id && i.period.startsWith(period),
    );
    await simpanInspeksi.mutateAsync({
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
      approvalStatus: 'DIAJUKAN',
      notes: newReport.summaryNotes,
    });
  };

  // `Edit` pada rekam terbit = batalkan terbit rekam itu saja (satu medan,
  // `approval_status` → DRAFT). Rekam yang sama turun jadi DRAF, jadi barisnya
  // keluar dari "Selesai Diperiksa" dan tombolnya kembali ke `Terbitkan`.
  const handleBatalkanTerbit = async (inspectionId: string): Promise<void> => {
    await batalkanTerbit.mutateAsync(inspectionId);
  };

  const handleAddZone = (_zoneName: string) => {
    // Zona dibuat bersama unit pada handleAddHydrantUnits (butuh siteId).
  };

  // Bukti inspeksi (`temuan: false`) — dipisahkan dari catatan hasil temuan
  // supaya unggahan baris ini tidak muncul di Section B.
  const handleUnggahFoto = (file: File, caption: string, nilai?: HydrantUnitItem['draftDetails']) => {
    if (!activeInspectionUnit) return;
    const unggah = (inspectionId: string) =>
      unggahFoto.mutate({
        kind: 'hydrant',
        inspectionId,
        file,
        caption,
        temuan: false,
      });
    if (inspeksiAktif) {
      unggah(inspeksiAktif.id);
      return;
    }
    // Belum ada rekam: buat baris inspeksi sebagai jangkar foto — unggah foto
    // tidak menunggu tombol Terbitkan.
    simpanInspeksi.mutate(
      {
        unitId: activeInspectionUnit.id,
        month: period,
        boxHydrant: nilai?.boxHydrant ?? 'LAYAK',
        fireHose: nilai?.fireHose ?? 'LAYAK',
        hoseCoupling: nilai?.hoseCoupling ?? 'LAYAK',
        hoseRack: nilai?.hoseRack ?? 'LAYAK',
        nozzle: nilai?.nozzle ?? 'LAYAK',
        valvePillar: nilai?.valvePillar ?? 'LAYAK',
        overallStatus: nilai?.overallStatus,
        overallOverridden: Boolean(nilai?.overallStatus),
        notes: nilai?.notes,
      },
      { onSuccess: (baru) => unggah(baru.id) },
    );
  };

  const handleHapusFoto = (fotoId: string) => {
    if (!inspeksiAktif) return;
    hapusFoto.mutate({ id: fotoId, inspectionId: inspeksiAktif.id });
  };

  const handleAddHydrantUnits = (newItems: HydrantCreationItem[]) => {
    if (!lokasi.siteId) return;
    newItems.forEach((item) => {
      buatUnit.mutate({ siteId: lokasi.siteId, zoneName: item.zoneName, kode: item.kode });
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

  // Tambah temuan = unggah foto nyata bertanda `temuan` ke rekam jangkar bulan
  // terpilih, sehingga hanya foto ini yang tampil di Section B.
  const handleAddFinding = (item: { file: File; description: string; unitCode?: string }) => {
    if (!jangkarTemuan) {
      window.alert('Belum ada inspeksi bulan ini — simpan inspeksi satu unit dahulu.');
      return;
    }
    unggahFoto.mutate(
      {
        kind: 'hydrant',
        inspectionId: jangkarTemuan,
        file: item.file,
        caption: item.description,
        temuan: true,
      },
      {
        onError: () => {},
      },
    );
  };

  const handleDeleteFinding = (id: string) => {
    if (!jangkarTemuan) return;
    hapusFoto.mutate({ id, inspectionId: jangkarTemuan });
  };

  const handlePrint = () => {
    window.print();
  };

  // Jangkar ekspor PDF: rekam inspeksi pertama bulan terpilih (lalu berisi).
  const jangkarEkspor =
    inspeksiSite.find((i) => i.period.startsWith(period))?.id ?? null;

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
            {isCollapsed && <TombolPerluas onKlik={onToggleCollapsed} />}
            <span className="text-[var(--primary)] font-medium">{lokasi.namaProyek}</span>
            <span>/</span>
            <span className="hover:text-[var(--primary)] cursor-pointer">{lokasi.siteName}</span>
            <span>/</span>
            <span className="text-[var(--primary)] font-medium">Inspeksi Hydrant</span>
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
              </div>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                Monitoring progres pemeriksaan fisik 6 komponen hydrant gedung per unit
              </p>
            </div>
          </div>

          {/* Top Quick Actions: Month Switcher, Add Zone/Hydrants & Print */}
          <div className="flex items-center gap-2">
            {!isCurrentMonth && (
              <button
                type="button"
                onClick={handleResetToCurrentMonth}
                className="text-[11px] font-medium px-2 py-0.5 rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--bg-hover)] cursor-pointer transition-colors shadow-2xs"
              >
                Bulan Ini
              </button>
            )}

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
                  className="text-xs font-semibold text-[#2f80ed] bg-transparent cursor-pointer py-0.5 px-2 focus:outline-none capitalize pr-5 appearance-none"
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
                <ChevronDown size={11} className="absolute right-1 text-[#2f80ed] pointer-events-none" />
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

            <button
              type="button"
              onClick={() => setIsAddZoneModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2f80ed] hover:bg-[#2b77d4] text-white text-xs font-semibold rounded-[4px] shadow-xs cursor-pointer pressable disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>Tambah Zona & Unit</span>
            </button>

            <UnduhPdfButton
              category="hydrant-monthly"
              refId={jangkarEkspor}
              namaBerkas={period}
            />

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

      {/* 2 Summary Stats Cards (Screen view) */}
      <div className="no-print grid grid-cols-2 gap-3 mb-4">
        {/* Card 1: Total Units */}
        <div className="p-3 bg-[var(--bg-main)] border border-[var(--border)] rounded-[6px] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
              Total Hydrant Terdaftar
            </span>
            <span className="text-xs">🏢</span>
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

        {/* Card 2: Completed */}
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

      </div>

      {/* Filter Tabs & View Controls Toolbar */}

      {/* Filter Tabs & View Controls Toolbar */}
      <div className="no-print flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 pb-3 mb-3 border-b border-[var(--border)]">
        {/* Segmented Filter Tabs */}
        <div className="flex items-center gap-1 bg-[var(--bg-sidebar)] p-0.5 rounded-[5px] border border-[var(--border)] text-xs flex-wrap">
          <button
            type="button"
            onClick={() => setFilterTab('ALL')}
            className={`py-1.5 px-3 rounded-[4px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              filterTab === 'ALL'
                ? 'bg-white dark:bg-[var(--bg-hover)] text-[var(--primary)] font-semibold shadow-xs'
                : 'text-[var(--secondary)] hover:text-[var(--primary)]'
            }`}
          >
            <span>Semua Unit</span>
            <span
              className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-[var(--bg-hover)] text-[var(--muted)]"
            >
              {totalUnits}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('ON_PROGRESS')}
            className={`py-1.5 px-3 rounded-[4px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              filterTab === 'ON_PROGRESS'
                ? 'bg-white dark:bg-[var(--bg-hover)] text-[var(--primary)] font-semibold shadow-xs'
                : 'text-[var(--secondary)] hover:text-[var(--primary)]'
            }`}
          >
            <span>Sedang Berjalan (On Progress)</span>
            <span
              className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400"
            >
              {onProgressUnits.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('COMPLETED')}
            className={`py-1.5 px-3 rounded-[4px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              filterTab === 'COMPLETED'
                ? 'bg-white dark:bg-[var(--bg-hover)] text-[var(--primary)] font-semibold shadow-xs'
                : 'text-[var(--secondary)] hover:text-[var(--primary)]'
            }`}
          >
            <span>Selesai Diperiksa</span>
            <span
              className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
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

          {/* Layout Mode Toggle: Table vs Cards (komponen shared di ui/Switchers) */}
          <ViewToggle value={viewMode} onChange={setViewMode} />
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
                  className="px-3 py-1.5 text-xs font-semibold text-[#2f80ed] bg-[#2f80ed]/10 hover:bg-[#2f80ed]/20 rounded-[4px] cursor-pointer"
                >
                  Tampilkan Semua Unit
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsAddZoneModalOpen(true)}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-[#2f80ed] hover:bg-[#2b77d4] rounded-[4px] cursor-pointer"
              >
                + Tambah Unit Baru
              </button>
            </div>
          </div>
        ) : viewMode === 'TABLE' ? (
          <HydrantTable units={filteredUnits} onBuka={setActiveInspectionUnit} />
        ) : (
          <HydrantCards units={filteredUnits} onBuka={setActiveInspectionUnit} aksen={AKSEN} />
        )}
      </div>

      <HydrantFindings
        findings={findings}
        onTambah={() => setIsAddFindingModalOpen(true)}
        onHapus={handleDeleteFinding}
        aksen={AKSEN}
      />

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
        inspeksi={inspeksiAktif}
        foto={inspeksiAktif ? buktiAktif : []}
        mengunggah={unggahFoto.isPending}
        onUnggahFoto={handleUnggahFoto}
        onHapusFoto={handleHapusFoto}
        onClose={() => setActiveInspectionUnit(null)}
        onCompleteInspection={handleCompleteInspection}
        onBatalkanTerbit={handleBatalkanTerbit}
        onHapusBulan={handleHapusBulan}
        menghapusBulan={hapusInspeksi.isPending}
        onHapusUnit={handleHapusUnit}
        menghapusUnit={hapusUnit.isPending}
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
