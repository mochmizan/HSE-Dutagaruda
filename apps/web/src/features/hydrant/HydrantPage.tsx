import React, { useEffect, useMemo, useState } from 'react';
import { Eye, Flame, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { HydrantUnitItem, InspectionReport } from '../../types/hse';
import { HydrantInspectionModal } from './HydrantInspectionModal';
import { HydrantTable } from './HydrantTable';
import { HydrantCards } from './HydrantCards';
import { HydrantFindings } from './HydrantFindings';
import { HydrantPrintKertas, HydrantPrintSignatures } from './HydrantPrintChrome';
import { HydrantStats } from './HydrantStats';
import { FilterBar } from '@/features/pageChrome';
import { UnduhPdfButton } from '@/components/ui';
import { EmptyUnits, InspectionPageShell, KONFIG_HYDRANT } from '@/features/inspeksi';
import { AddZoneHydrantModal, HydrantCreationItem } from './AddZoneHydrantModal';
import { AddFindingModal } from './AddFindingModal';
import { HydrantFindingItem } from './types';
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
  useUrutkanUnit,
  useUnggahFoto,
  useHapusFoto,
  useFotoInspeksi,
} from '@/services/api/queries';
import { useKonteksLokasi } from '@/features/konteksLokasi';
import { susunUrutanBaru } from '@/lib/urutanUnit';
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

  const unggahFoto = useUnggahFoto();
  const hapusFoto = useHapusFoto();
  const [selectedMonth, setSelectedMonth] = useState<Date>(() => {
    const kini = new Date();
    return new Date(kini.getFullYear(), kini.getMonth(), 1);
  });
  const handleResetToCurrentMonth = () => {
    const kini = new Date();
    setSelectedMonth(new Date(kini.getFullYear(), kini.getMonth(), 1));
  };
  const period = format(selectedMonth, 'yyyy-MM');
  const isCurrentMonth = (() => {
    const kini = new Date();
    return selectedMonth.getFullYear() === kini.getFullYear() && selectedMonth.getMonth() === kini.getMonth();
  })();

  const inspeksiAktif: ApiInspeksiHidran | null = activeInspectionUnit
    ? inspeksiSite.find(
        (i) => i.unitId === activeInspectionUnit.id && i.period.startsWith(period),
      ) ?? null
    : null;

  const fotoAktif = useFotoInspeksi(inspeksiAktif?.id ?? null, 'hydrant');
  const buktiAktif = (fotoAktif.data ?? []).filter((f) => !f.temuan);

  const handleHapusBulan = () => {
    if (!inspeksiAktif) return;
    hapusInspeksi.mutate(inspeksiAktif.id);
    setActiveInspectionUnit(null);
  };

  const handleHapusUnit = () => {
    if (!activeInspectionUnit) return;
    hapusUnit.mutate(activeInspectionUnit.id);
    setActiveInspectionUnit(null);
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suntingRefId, inspeksiQuery.data, unitQuery.data]);

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

  const totalUnits = units.length;
  const onProgressUnits = units.filter(
    (u) => u.status === 'SEDANG_BERJALAN' || u.status === 'BELUM_DIPERIKSA'
  );
  const completedUnits = units.filter((u) => u.status === 'SELESAI');

  const maxUnitNumber = units.reduce((max, u) => {
    const num = parseInt(u.kode.replace(/\D/g, ''), 10) || 0;
    return Math.max(max, num);
  }, 0);

  const filteredUnits = units.filter((unit) => {
    if (filterTab === 'ON_PROGRESS' && unit.status === 'SELESAI') return false;
    if (filterTab === 'COMPLETED' && unit.status !== 'SELESAI') return false;
    if (zoneFilter !== 'ALL' && unit.zoneName !== zoneFilter) return false;
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

  const urutkan = useUrutkanUnit('hydrant');
  const handlePindah = (unitId: string, arah: -1 | 1) => {
    const ids = susunUrutanBaru(
      units.map((u) => u.id),
      filteredUnits.map((u) => u.id),
      unitId,
      arah,
    );
    if (ids) urutkan.mutate({ siteId: lokasi.siteId, ids });
  };

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

  const handleBatalkanTerbit = async (inspectionId: string): Promise<void> => {
    await batalkanTerbit.mutateAsync(inspectionId);
  };

  const handleAddZone = (_zoneName: string) => {};

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

  const bukaHalamanCetakHydrant = (
    mode: 'checklist' | 'laporan' | 'semua',
    autoPrint = false,
  ) => {
    const params = new URLSearchParams({ cetak: 'hydrant', bulan: period, mode });
    if (autoPrint) params.set('autoprint', '1');
    window.open(
      `${window.location.origin}${window.location.pathname}?${params.toString()}`,
      '_blank',
      'noopener',
    );
  };

  const handlePrint = () => {
    bukaHalamanCetakHydrant('checklist', true);
  };

  const jangkarEkspor =
    inspeksiSite.find((i) => i.period.startsWith(period))?.id ?? null;

  return (
    <InspectionPageShell
      config={KONFIG_HYDRANT}
      namaProyek={lokasi.namaProyek}
      siteName={lokasi.siteName}
      isCollapsed={isCollapsed}
      onToggleCollapsed={onToggleCollapsed}
      bulan={selectedMonth}
      tampilkanReset={!isCurrentMonth}
      onResetBulan={handleResetToCurrentMonth}
      onPilihBulan={setSelectedMonth}
      onTambah={() => setIsAddZoneModalOpen(true)}
      jangkarEkspor={jangkarEkspor}
      namaBerkas={period}
      onCetak={handlePrint}
      kepalaCetak={
        <div className="hyd-print-area">
          <HydrantPrintKertas
            siteName={lokasi.siteName}
            period={period}
            units={units}
            inspeksi={inspeksiSite}
            findings={findings}
          />
        </div>
      }
      statistik={
        <HydrantStats
          totalUnits={totalUnits}
          jumlahZona={zones.length}
          completed={completedUnits.length}
        />
      }
      saring={
        <FilterBar
          filterTab={filterTab}
          onFilterTab={setFilterTab}
          total={totalUnits}
          onProgress={onProgressUnits.length}
          completed={completedUnits.length}
          zona={zones}
          zoneFilter={zoneFilter}
          onZoneFilter={setZoneFilter}
          searchQuery={searchQuery}
          onSearchQuery={setSearchQuery}
          viewMode={viewMode}
          onViewMode={setViewMode}
        />
      }
      isi={
        <div className="space-y-3 pb-8 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xs font-bold text-[var(--primary)] print:text-black uppercase tracking-wider">
                A. Hasil Pemeriksaan Fisik Unit Hydrant
              </h2>
            </div>
            {/* Dua pasang tombol Cetak prosedural Hydrant: 1) Checklist Bulanan (Portrait), 2) Laporan Pemeriksaan (Landscape) */}
            <div className="no-print ml-auto flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => bukaHalamanCetakHydrant('checklist', false)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] hover:bg-[var(--bg-hover)] text-[var(--primary)] cursor-pointer pressable tabular-nums"
              >
                <Eye size={13} />
                <span>Pratinjau Cetak</span>
              </button>
              <button
                type="button"
                onClick={() => bukaHalamanCetakHydrant('checklist', true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] hover:bg-[var(--bg-hover)] text-[var(--primary)] cursor-pointer pressable tabular-nums"
              >
                <Printer size={13} />
                <span>Cetak Checklist Bulanan</span>
              </button>
              <UnduhPdfButton
                category="hydrant-laporan"
                refId={jangkarEkspor}
                label="Cetak Laporan (Landscape)"
                namaBerkas={period}
              />
            </div>
          </div>
          {filteredUnits.length === 0 ? (
            <EmptyUnits
              ikon={<Flame size={32} />}
              aksen={KONFIG_HYDRANT.aksen}
              judul="Tidak ada unit hydrant yang cocok"
              filterTab={filterTab}
              onTampilkanSemua={() => setFilterTab('ALL')}
              onTambah={() => setIsAddZoneModalOpen(true)}
            />
          ) : viewMode === 'TABLE' ? (
            <HydrantTable units={filteredUnits} onBuka={setActiveInspectionUnit} onPindah={handlePindah} />
          ) : (
            <HydrantCards units={filteredUnits} onBuka={setActiveInspectionUnit} aksen={AKSEN} />
          )}
        </div>
      }
      tambahan={
        <HydrantFindings
          findings={findings}
          onTambah={() => setIsAddFindingModalOpen(true)}
          onHapus={handleDeleteFinding}
          aksen={AKSEN}
        />
      }
      tandaTangan={<HydrantPrintSignatures />}
      modals={
        <>
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

          <AddFindingModal
            isOpen={isAddFindingModalOpen}
            onClose={() => setIsAddFindingModalOpen(false)}
            onAddFinding={handleAddFinding}
            existingUnits={units.map((u) => u.kode)}
          />
        </>
      }
    />
  );
};
