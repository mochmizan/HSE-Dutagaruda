import React, { useEffect, useMemo, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
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
  const [activeInspectionUnit, setActiveInspectionUnit] = useState<AparUnitItem | null>(null);
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

  const inspeksiAktif: ApiInspeksiApar | null = activeInspectionUnit
    ? inspeksiSite.find(
        (i) => i.unitId === activeInspectionUnit.id && i.period.startsWith(period),
      ) ?? null
    : null;

  // Bukti inspeksi unit yang sedang dibuka, dibaca dari API — bukan state sesi,
  // jadi tutup/buka ulang atau muat ulang tidak menghilangkan foto. Rekam ini
  // juga bisa memuat foto temuan (bila unit ini jangkar Section B): saring.
  const fotoAktif = useFotoInspeksi(inspeksiAktif?.id ?? null, 'apar');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- satu kali per permintaan sunting
  }, [suntingRefId, inspeksiQuery.data, unitQuery.data]);

  // Unit + hasil inspeksi bulan terpilih dari API, dipetakan ke model UI.
  // Memoized: identitas objek unit stabil antar-render — efek init modal
  // tidak boleh menyala setiap refetch (mematikan mode terbit / menimpa
  // ketikan yang sedang berjalan).
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

  // B. Catatan hasil temuan = HANYA foto bertanda `temuan` pada rekam jangkar
  // bulan terpilih. Foto bukti inspeksi (unggahan dari modal) bukan temuan.
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

  // Terbit menyimpan inspeksi ke API (modal selalu mengisi 7 komponen).
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

  // `Edit` pada rekam terbit = batalkan terbit rekam itu saja (satu medan,
  // `approval_status` → DRAFT). Rekam yang sama turun jadi DRAF, jadi barisnya
  // keluar dari "Selesai Diperiksa" dan tombolnya kembali ke `Terbitkan`.
  const handleBatalkanTerbit = async (inspectionId: string): Promise<void> => {
    await batalkanTerbit.mutateAsync(inspectionId);
  };

  const handleAddZone = (_zoneName: string) => {
    // Zona dibuat bersama unit pada handleAddAparUnits (butuh siteId).
  };

  // Bukti inspeksi (`temuan: false`) — dipisahkan dari catatan hasil temuan
  // supaya unggahan baris ini tidak muncul di Section B.
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
    // Belum ada rekam: buat baris inspeksi sebagai jangkar foto — unggah foto
    // tidak menunggu tombol Terbitkan.
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

  // Tambah temuan = unggah foto nyata bertanda `temuan` ke rekam jangkar bulan
  // terpilih, sehingga hanya foto ini yang tampil di Section B.
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

  const handlePrint = () => {
    window.print();
  };

  // Jangkar ekspor PDF: rekam inspeksi pertama bulan terpilih (lalu berisi).
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
          <div className="flex items-center justify-between gap-2">
            <div className="hidden print:block mb-2">
              <h2 className="text-xs font-bold text-black uppercase tracking-wider">
                A. Hasil Pemeriksaan Fisik Unit APAR
              </h2>
            </div>
            {/* Affordance kedua: pratinjau kertas demo-faithful (?cetak=apar).
              Di luar PageHeader supaya urutan Unduh PDF → Cetak kepala tidak berubah. */}
            <div className="no-print ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.open(`?cetak=apar&bulan=${period}`, '_blank', 'noopener')}
                className="px-3 py-1.5 text-xs font-semibold rounded-[4px] border border-[var(--border)] hover:bg-[var(--bg-hover)] text-[var(--primary)] cursor-pointer pressable tabular-nums"
              >
                Pratinjau Cetak
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
          <AparYearCard units={units} inspeksi={inspeksiSite} onCetak={handlePrint} />
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
