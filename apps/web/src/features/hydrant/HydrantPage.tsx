import React, { useEffect, useMemo, useState } from 'react';
import { Flame } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { HydrantUnitItem, InspectionReport } from '../../types/hse';
import { HydrantInspectionModal } from './HydrantInspectionModal';
import { HydrantTable } from './HydrantTable';
import { HydrantCards } from './HydrantCards';
import { HydrantFindings } from './HydrantFindings';
import { HydrantPrintHeader, HydrantPrintSignatures } from './HydrantPrintChrome';
import { HydrantStats } from './HydrantStats';
import { PageHeader, FilterBar } from '@/features/pageChrome';
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

  // Pindah baris: urutan disimpan per lokasi, jadi daftar yang dikirim adalah
  // SEMUA unit lokasi — bukan hanya baris yang lolos saringan. `susunUrutanBaru`
  // menyisipkan baris ke posisi tetangganya di daftar penuh.
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
      <HydrantPrintHeader siteName={lokasi.siteName} monthLabel={monthLabel} />

      <PageHeader
        namaProyek={lokasi.namaProyek}
        siteName={lokasi.siteName}
        remahKategori="Inspeksi Hydrant"
        ikon={<Flame size={18} strokeWidth={2.2} />}
        aksen="#eb5757"
        judul="Laporan Inspeksi Hydrant"
        deskripsi="Monitoring progres pemeriksaan fisik 6 komponen hydrant gedung per unit"
        isCollapsed={isCollapsed}
        onToggleCollapsed={onToggleCollapsed}
        bulan={selectedMonth}
        tampilkanReset={!isCurrentMonth}
        onResetBulan={handleResetToCurrentMonth}
        onPilihBulan={setSelectedMonth}
        labelTambah="Tambah Zona & Unit"
        onTambah={() => setIsAddZoneModalOpen(true)}
        kategoriEkspor="hydrant-monthly"
        jangkarEkspor={jangkarEkspor}
        namaBerkas={period}
        onCetak={handlePrint}
      />

      <HydrantStats
        totalUnits={totalUnits}
        jumlahZona={zones.length}
        completed={completedUnits.length}
      />

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
          <HydrantTable units={filteredUnits} onBuka={setActiveInspectionUnit} onPindah={handlePindah} />
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

      <HydrantPrintSignatures />

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
