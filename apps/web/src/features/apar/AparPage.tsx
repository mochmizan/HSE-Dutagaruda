import React, { useEffect, useMemo, useState } from 'react';
import { Eye, Printer, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { AparUnitItem, InspectionReport } from '../../types/hse';
import { AparInspectionModal } from './AparInspectionModal';
import { AparTable } from './AparTable';
import { AparCards } from './AparCards';
import { AparFindings } from './AparFindings';
import { AparExpiryRecap } from './AparExpiryRecap';
import { AparYearCard } from './AparYearCard';
import { AparPrintHeader, AparPrintSignatures } from './AparPrintChrome';
import { AparStats } from './AparStats';
import { FilterBar } from '@/features/pageChrome';
import { EmptyUnits, InspectionPageShell, KONFIG_APAR } from '@/features/inspeksi';
import { AddZoneAparModal, AparCreationItem } from './AddZoneAparModal';
import { AddFindingAparModal } from './AddFindingAparModal';
import { AparFindingItem } from './types';
import {
  petakanUnitApar,
  useUnitApar,
  useInspeksiApar,
  useSimpanInspeksiApar,
  useBatalkanTerbitApar,
  useHapusInspeksiApar,
  useHapusUnitApar,
  useBuatUnitApar,
  useUbahUnitApar,
  useUrutkanUnit,
  useUnggahFoto,
  useHapusFoto,
  useFotoInspeksi,
} from '@/services/api/queries';
import { useKonteksLokasi } from '@/features/konteksLokasi';
import { susunUrutanBaru } from '@/lib/urutanUnit';
import type { ApiInspeksiApar } from '@/services/api/klien';

/** Aksen halaman APAR, satu tempat. */
const AKSEN = '#f2994a';

interface AparPageProps {
  onBack: () => void;
  /** Permintaan sunting dari dasbor: buka modal inspeksi rekam dengan id ini. */
  suntingRefId?: { kategori: string | null; refId: string } | null;
  onSuntingSelesai?: () => void;
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
}

export const AparPage: React.FC<AparPageProps> = ({
  suntingRefId,
  onSuntingSelesai,
  isCollapsed,
  onToggleCollapsed,
}) => {
  const lokasi = useKonteksLokasi();
  const unitQuery = useUnitApar();
  const inspeksiQuery = useInspeksiApar();
  const simpanInspeksi = useSimpanInspeksiApar();
  const batalkanTerbit = useBatalkanTerbitApar();
  const hapusInspeksi = useHapusInspeksiApar();
  const hapusUnit = useHapusUnitApar();
  const buatUnit = useBuatUnitApar();
  const ubahUnit = useUbahUnitApar();

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
  const [activeInspectionUnit, setActiveInspectionUnit] = useState<AparUnitItem | null>(null);
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
  const monthLabel = format(selectedMonth, 'MMMM yyyy', { locale: idLocale });
  const isCurrentMonth = (() => {
    const kini = new Date();
    return selectedMonth.getFullYear() === kini.getFullYear() && selectedMonth.getMonth() === kini.getMonth();
  })();
  const period = format(selectedMonth, 'yyyy-MM');

  const inspeksiAktif: ApiInspeksiApar | null = activeInspectionUnit
    ? inspeksiSite.find(
        (i) => i.unitId === activeInspectionUnit.id && i.period.startsWith(period),
      ) ?? null
    : null;

  const fotoAktif = useFotoInspeksi(inspeksiAktif?.id ?? null, 'apar');
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
    if (!suntingRefId || suntingRefId.kategori !== 'apar') return;
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
        jenis: unit.jenis === 'CO2' ? 'CO2' : 'POWDER',
        ukuran: unit.ukuran ?? '',
        tahunPembuatan: unit.tahun ?? 0,
        expiredDate: unit.expiredDate,
        componentsCheckedCount: 7,
        componentsTotal: 7,
        scheduledDate: 'Bulan Ini',
      });
      onSuntingSelesai?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suntingRefId, inspeksiQuery.data, unitQuery.data]);

  const units = useMemo(
    () =>
      petakanUnitApar(
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
  const fotoTemuan = useFotoInspeksi(jangkarTemuan, 'apar');
  const findings: AparFindingItem[] = useMemo(
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

  const urutkan = useUrutkanUnit('apar');
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
    const d = newReport.aparDetails;
    const existing = inspeksiSite.find(
      (i) => i.unitId === unit.id && i.period.startsWith(period),
    );
    await simpanInspeksi.mutateAsync({
      id: existing?.id,
      unitId: unit.id,
      month: period,
      safetyPin: d?.safetyPin ?? 'BAIK',
      corong: d?.corong ?? 'BAIK',
      segel: d?.segel ?? 'BAIK',
      tekanan: d?.tekanan ?? 'BAIK',
      tabung: d?.tabung ?? 'BAIK',
      selang: d?.selang ?? 'BAIK',
      katupTuas: d?.katupTuas ?? 'BAIK',
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

  const handleUnggahFoto = (file: File, caption: string, nilai?: AparUnitItem['draftDetails']) => {
    if (!activeInspectionUnit) return;
    const unggah = (inspectionId: string) =>
      unggahFoto.mutate({
        kind: 'apar',
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
        safetyPin: nilai?.safetyPin ?? 'BAIK',
        corong: nilai?.corong ?? 'BAIK',
        segel: nilai?.segel ?? 'BAIK',
        tekanan: nilai?.tekanan ?? 'BAIK',
        tabung: nilai?.tabung ?? 'BAIK',
        selang: nilai?.selang ?? 'BAIK',
        katupTuas: nilai?.katupTuas ?? 'BAIK',
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

  const handleAddAparUnits = (newItems: AparCreationItem[]) => {
    if (!lokasi.siteId) return;
    newItems.forEach((item) => {
      buatUnit.mutate({
        siteId: lokasi.siteId,
        zoneName: item.zoneName,
        unit: {
          kode: item.kode,
          tahun: item.tahunPembuatan,
          jenis: item.jenis,
          ukuran: item.ukuran,
          expiredDate: item.expiredDate,
        },
      });
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
        kind: 'apar',
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

  /** Buka halaman prosedur cetak APAR (baik mode bulanan maupun kartu tahunan, dengan/tanpa autoprint). */
  const bukaHalamanCetakApar = (
    mode: 'bulanan' | 'kartu',
    autoPrint = false,
    unitId?: string,
    tahun?: string,
  ) => {
    const params = new URLSearchParams({ cetak: 'apar', bulan: period, mode });
    if (unitId) params.set('unit', unitId);
    if (tahun) params.set('tahun', tahun);
    if (autoPrint) params.set('autoprint', '1');
    window.open(
      `${window.location.origin}${window.location.pathname}?${params.toString()}`,
      '_blank',
      'noopener',
    );
  };

  // Tombol Cetak di kepala halaman mencetak halaman prosedur Checklist Bulanan APAR
  const handlePrint = () => {
    bukaHalamanCetakApar('bulanan', true);
  };

  const jangkarEkspor =
    inspeksiSite.find((i) => i.period.startsWith(period))?.id ?? null;

  return (
    <InspectionPageShell
      config={KONFIG_APAR}
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
      kepalaCetak={<AparPrintHeader siteName={lokasi.siteName} monthLabel={monthLabel} />}
      statistik={
        <AparStats
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
                A. Hasil Pemeriksaan Fisik Unit APAR
              </h2>
            </div>
            {/* Dua pasang tombol Cetak prosedural APAR: 1) Checklist Bulanan, 2) Kartu Tahunan Unit */}
            <div className="no-print ml-auto flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => bukaHalamanCetakApar('bulanan', false)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] hover:bg-[var(--bg-hover)] text-[var(--primary)] cursor-pointer pressable tabular-nums"
              >
                <Eye size={13} />
                <span>Pratinjau Bulanan</span>
              </button>
              <button
                type="button"
                onClick={() => bukaHalamanCetakApar('bulanan', true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] hover:bg-[var(--bg-hover)] text-[var(--primary)] cursor-pointer pressable tabular-nums"
              >
                <Printer size={13} />
                <span>Cetak Checklist Bulanan</span>
              </button>
              <button
                type="button"
                onClick={() => bukaHalamanCetakApar('kartu', true, units[0]?.id, period.slice(0, 4))}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[4px] bg-[#f2994a] hover:bg-[#e0893b] text-white shadow-2xs cursor-pointer pressable tabular-nums"
              >
                <Printer size={13} />
                <span>Cetak Kartu Tahunan</span>
              </button>
            </div>
          </div>
          {filteredUnits.length === 0 ? (
            <EmptyUnits
              ikon={<ShieldCheck size={32} />}
              aksen={KONFIG_APAR.aksen}
              judul="Tidak ada unit APAR yang cocok"
              filterTab={filterTab}
              onTampilkanSemua={() => setFilterTab('ALL')}
              onTambah={() => setIsAddZoneModalOpen(true)}
            />
          ) : viewMode === 'TABLE' ? (
            <AparTable units={filteredUnits} onBuka={setActiveInspectionUnit} onPindah={handlePindah} />
          ) : (
            <AparCards units={filteredUnits} onBuka={setActiveInspectionUnit} aksen="#2f80ed" />
          )}
        </div>
      }
      tambahan={
        <>
          <AparFindings
            findings={findings}
            onTambah={() => setIsAddFindingModalOpen(true)}
            onHapus={handleDeleteFinding}
            aksen={AKSEN}
          />
          <AparExpiryRecap units={units} />
          <AparYearCard
            units={units}
            inspeksi={inspeksiSite}
            onCetak={(uId, thn) => bukaHalamanCetakApar('kartu', true, uId, thn)}
            onPratinjau={(uId, thn) => bukaHalamanCetakApar('kartu', false, uId, thn)}
          />
        </>
      }
      tandaTangan={<AparPrintSignatures />}
      modals={
        <>
          <AddZoneAparModal
            isOpen={isAddZoneModalOpen}
            onClose={() => setIsAddZoneModalOpen(false)}
            existingZones={zones}
            existingUnits={units.map((u) => ({ id: u.id, kode: u.kode, zoneName: u.zoneName }))}
            lastUnitNumber={maxUnitNumber}
            onAddZone={handleAddZone}
            onAddAparUnits={handleAddAparUnits}
            onReassignUnitZone={handleReassignUnitZone}
          />

          <AparInspectionModal
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

          <AddFindingAparModal
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
