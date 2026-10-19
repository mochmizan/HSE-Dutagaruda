import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import type { AparUnitItem, AparYearGrid, InspectionReport } from '../../types/hse';
import type { OverallStatus } from '../../types/domain';
import { AddZoneAparModal, type AparCreationItem } from './AddZoneAparModal';
import { AparInspectionModal } from './AparInspectionModal';
import { ReportDetailModal } from '../reports/ReportDetailModal';
import {
  emptyYearGrid,
  resolveReportCell,
  countChecked,
  type AparCardsState,
} from '../../lib/aparSync';
import { computeAparOverallStatus } from '../../lib/statusCalculator';
import { formatIndonesianDate } from '../../lib/dates';
import { AparYearCard } from './AparYearCard';
import { PrintButton, UnduhPdfButton } from '@/components/ui';
import { PageHeader, FilterBar, KartuStatistik } from '@/features/pageChrome';
import { AparPrintHeader, AparExpiry, AparSignatures } from './AparPrintChrome';
import {
  unitHasIssue,
} from './AparBadges';
import { AparTable } from './AparTable';
import { AparCards } from './AparCards';
import {
  petakanUnitApar,
  petakanKartuApar,
  useUnitApar,
  useInspeksiApar,
  useSimpanInspeksiApar,
  useBatalkanTerbitApar,
  useHapusInspeksiApar,
  useHapusUnitApar,
  useBuatUnitApar,
  useUbahUnitApar,
  useUnggahFoto,
  useHapusFoto,
  useFotoInspeksi,
} from '@/services/api/queries';
import { useKonteksLokasi } from '@/features/konteksLokasi';
import type { ApiInspeksiApar } from '@/services/api/klien';

// ─────────────────────────────────────────────────────────────
// DATA — konstanta tampilan khusus halaman APAR (UI-only)
// ─────────────────────────────────────────────────────────────

const APAR_ACCENT = '#f2994a';

/**
 * Periode awal = bulan kalender nyata.
 *
 * Sebelumnya dipatok `2026-09`, jadi aplikasi selalu membuka September 2026
 * walau hari ini Oktober. Dihitung saat modul dimuat; `resetPeriode()` memakai
 * nilai yang sama supaya tombol `Bulan Ini` kembali ke bulan berjalan.
 */
const bulanBerjalan = (): string => format(new Date(), 'yyyy-MM');
const DEFAULT_PERIOD = bulanBerjalan();

/** Tanda tangan dokumen bawaan (gaya kertas; dapat diketik di layar). */
const sekarangIso = () => new Date().toISOString();

const APAR_SIGNATURES = {
  dibuat: { nama: 'Alex Chen', jabatan: 'Staff HSE / Teknisi K3' },
  diketahui: { nama: 'Budi Santoso', jabatan: 'HSE Officer & Koordinator' },
  disetujui: { nama: 'Ir. Hendra Wijaya', jabatan: 'Kepala Operasional Logistik' },
} as const;

/**
 * Tanggal inspeksi contoh pada gaya kertas — HANYA untuk periode September 2026
 * (data contoh PRD). Periode lain memakai tanggal rekam nyata dari API.
 */
const APAR_INSPECTION_DATES_SEPT_2026 = ['2026-09-16', '2026-09-18'];

/** Sisa hari menuju tanggal kedaluwarsa (negatif = sudah kedaluwarsa). */
const daysToExpiry = (iso: string) =>
  Math.ceil((new Date(`${iso}T00:00:00`).getTime() - Date.now()) / 86_400_000);

export type { AparCardsState } from '../../lib/aparSync';
interface AparPageProps {
  onBack: () => void;
  /** Permintaan sunting dari dasbor: buka modal inspeksi rekam dengan id ini. */
  suntingRefId?: { kategori: string | null; refId: string } | null;
  onSuntingSelesai?: () => void;
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
}

export const AparPage: React.FC<AparPageProps> = ({ suntingRefId, onSuntingSelesai, isCollapsed, onToggleCollapsed }) => {
  const lokasi = useKonteksLokasi();
  const unitQuery = useUnitApar();
  const inspeksiQuery = useInspeksiApar();
  const simpanInspeksi = useSimpanInspeksiApar();
  const batalkanTerbit = useBatalkanTerbitApar();
  const hapusInspeksi = useHapusInspeksiApar();
  const hapusUnit = useHapusUnitApar();
  const buatUnit = useBuatUnitApar();
  const ubahUnit = useUbahUnitApar();

  // ─────────────────────────────────────────────────────────
  // STATE (units + kartu tahunan dari API — satu sumber data)
  // ─────────────────────────────────────────────────────────
  const [period, setPeriod] = useState<string>(DEFAULT_PERIOD);
  const [filterTab, setFilterTab] = useState<'ALL' | 'ON_PROGRESS' | 'COMPLETED'>('ALL');
  const [zoneFilter, setZoneFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'TABLE' | 'CARDS'>('TABLE');
  // Selalu ada satu kartu terbuka — default APAR 01, tidak pernah menunggu klik.
  const [selectedKode, setSelectedKode] = useState<string>('01');
  // Tahun kartu diangkat ke halaman agar sinkronisasi tahu konteks tahun.
  const [cardYear, setCardYear] = useState<string>(() => String(new Date().getFullYear()));

  // Foto dokumentasi per inspeksi (id baris inspeksi → daftar foto sesi).
  // Foto dokumentasi dibaca dari API (lihat `fotoAktif`), bukan disimpan per
  // sesi: tutup/buka ulang modal atau muat ulang halaman tetap menampilkan foto.
  const unggahFoto = useUnggahFoto();
  const hapusFoto = useHapusFoto();

  // Tanda tangan dokumen (UI-only, dapat diketik; default dari APAR_SIGNATURES)
  const [sigNames, setSigNames] = useState<string[]>([
    APAR_SIGNATURES.dibuat.nama,
    APAR_SIGNATURES.diketahui.nama,
    APAR_SIGNATURES.disetujui.nama,
  ]);
  const [sigRoles, setSigRoles] = useState<string[]>([
    APAR_SIGNATURES.dibuat.jabatan,
    APAR_SIGNATURES.diketahui.jabatan,
    APAR_SIGNATURES.disetujui.jabatan,
  ]);

  // Modal tambah zona & unit APAR (UI-only)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const cardAnchorRef = useRef<HTMLDivElement>(null);

  // Modal inspeksi per baris (klik baris tabel → modal → simpan → tabel + kartu ikut baru)
  const [activeInspectionUnit, setActiveInspectionUnit] = useState<AparUnitItem | null>(null);

  // Tampilan rekam hasil inspeksi setelah “Selesaikan & Terbitkan” (gaya Hydrant)
  const [detailReport, setDetailReport] = useState<InspectionReport | null>(null);

  const [year, month] = period.split('-').map(Number);
  const monthDate = new Date(year || new Date().getFullYear(), (month || new Date().getMonth() + 1) - 1, 1);
  const monthLabel = format(monthDate, 'MMMM yyyy', { locale: idLocale });
  const isDefaultPeriod = period === bulanBerjalan();

  // Unit + hasil inspeksi bulan terpilih dari API; kartu tahunan turunan inspeksi tersimpan.
  // Lokasi aktif memilih barisnya: unit + inspeksi lokasi lain tidak tampil.
  const unitSite = useMemo(
    () => (unitQuery.data ?? []).filter((u) => u.siteId === lokasi.siteId),
    [unitQuery.data, lokasi.siteId],
  );
  const inspeksiSite = useMemo(() => {
    const idUnit = new Set(unitSite.map((u) => u.id));
    return (inspeksiQuery.data ?? []).filter((i) => idUnit.has(i.unitId));
  }, [inspeksiQuery.data, unitSite]);
  const units = useMemo(
    () => petakanUnitApar(unitSite, inspeksiSite, lokasi.zonaIdKeNama, period),
    [unitSite, inspeksiSite, lokasi.zonaIdKeNama, period],
  );
  // Kartu tahunan menghitung 12 bulan untuk setiap unit. Tanpa memo, ini
  // berjalan pada setiap ketikan di kotak pencarian dan setiap render ulang.
  const cards: AparCardsState = useMemo(
    () => petakanKartuApar(unitSite, inspeksiSite),
    [unitSite, inspeksiSite],
  );

  // Bersihkan kelas cetak setiap dialog cetak ditutup
  useEffect(() => {
    const cleanup = () => document.body.classList.remove('printing-report', 'printing-card');
    window.addEventListener('afterprint', cleanup);
    return () => window.removeEventListener('afterprint', cleanup);
  }, []);

  // ── Turunan: zona, hitungan, filter ──
  const zones = useMemo(() => [...new Set(units.map((u) => u.zoneName))].sort(), [units]);

  // Sunting dari dasbor: buka modal inspeksi rekam dengan id diminta (bulan ikut rekam).
  useEffect(() => {
    if (!suntingRefId || suntingRefId.kategori !== 'apar') return;
    const insp = (inspeksiQuery.data ?? []).find((i) => i.id === suntingRefId.refId);
    if (!insp) return;
    const unit = (unitQuery.data ?? []).find((u) => u.id === insp.unitId);
    if (unit) {
      if (unit.siteId !== lokasi.siteId) lokasi.pilihLokasi(unit.siteId);
      setPeriod(insp.period.slice(0, 7));
      setActiveInspectionUnit(petakanUnitApar([unit], [insp], lokasi.zonaIdKeNama, insp.period.slice(0, 7))[0] ?? null);
      onSuntingSelesai?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- satu kali per permintaan sunting
  }, [suntingRefId, inspeksiQuery.data, unitQuery.data]);
  const completedUnits = useMemo(() => units.filter((u) => u.status === 'SELESAI'), [units]);
  const inProgressUnits = useMemo(() => units.filter((u) => u.status === 'SEDANG_BERJALAN'), [units]);

  // Bilah progres di kartu ringkas. Dihitung sekali dari jumlah unit; tanpa
  // pembagi nol (halaman tanpa unit) bilahnya kosong, bukan `NaN`.
  const persenSelesai = units.length
    ? Math.round((completedUnits.length / units.length) * 100)
    : 0;
  const persenBerjalan = units.length
    ? Math.round((inProgressUnits.length / units.length) * 100)
    : 0;

  const filteredUnits = useMemo(
    () =>
      units.filter((unit) => {
        if (filterTab === 'ON_PROGRESS' && unit.status === 'SELESAI') return false;
        if (filterTab === 'COMPLETED' && unit.status !== 'SELESAI') return false;
        if (zoneFilter !== 'ALL' && unit.zoneName !== zoneFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchKode =
            unit.kode.toLowerCase().includes(q) || `apar ${unit.kode}`.includes(q);
          const matchZone = unit.zoneName.toLowerCase().includes(q);
          const matchInspector = unit.inspectorName?.toLowerCase().includes(q) || false;
          if (!matchKode && !matchZone && !matchInspector) return false;
        }
        return true;
      }),
    [units, filterTab, zoneFilter, searchQuery]
  );

  // ── Turunan: rekap kedaluwarsa dikelompokkan per tanggal ──
  const expiryGroups = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const u of units) {
      const list = map.get(u.expiredDate) ?? [];
      list.push(u.kode);
      map.set(u.expiredDate, list);
    }
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, kodes]) => ({ date, kodes: kodes.sort() }));
  }, [units]);

  const selectedUnit = (selectedKode ? units.find((u) => u.kode === selectedKode) : undefined) ?? units[0] ?? null;
  const activeKode = selectedUnit?.kode ?? '01';
  const [reportYear, reportMonth] = period.split('-');
  // Grid aktif: isian kartu menang; bila baris bulan laporan masih kosong, ikuti
  // draft unit agar tabel bulanan dan kartu tahunan menampilkan data yang sama.
  const storedGrid: AparYearGrid = cards[activeKode]?.[cardYear] ?? emptyYearGrid();
  const activeGrid: AparYearGrid =
    selectedUnit && cardYear === reportYear
      ? { ...storedGrid, [reportMonth]: resolveReportCell(storedGrid[reportMonth], selectedUnit) }
      : storedGrid;

  // Tanggal inspeksi di kop: pakai tanggal rekam nyata bulan terpilih
  // (`createdAt` adalah tanggal inspeksi tersimpan). Data contoh September 2026
  // hanya dipakai bila memang tidak ada rekam, karena kop kertas lama mencetak
  // tanggal contoh itu.
  const inspectionDatesLabel = (() => {
    const tanggal = [
      ...new Set(
        inspeksiSite
          .filter((i) => i.period.startsWith(period))
          .map((i) => (i.createdAt ?? '').slice(0, 10))
          .filter(Boolean),
      ),
    ].sort();
    if (tanggal.length > 0) {
      return tanggal.map((d) => formatIndonesianDate(parseISO(d))).join(' & ');
    }
    if (period === '2026-09') {
      return APAR_INSPECTION_DATES_SEPT_2026.map((d) => formatIndonesianDate(parseISO(d))).join(' & ');
    }
    return '–';
  })();

  // ─────────────────────────────────────────────────────────
  // EVENTS
  // ─────────────────────────────────────────────────────────

  const scrollToCard = () => {
    requestAnimationFrame(() =>
      cardAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    );
  };

  const handleSelectUnit = (kode: string) => {
    setSelectedKode(kode);
    scrollToCard();
  };

  // Klik baris tabel → pilih kartu; modal inspeksi mengatur kunci suntingan sendiri.
  const handleOpenInspection = (unit: AparUnitItem) => {
    setSelectedKode(unit.kode);
    setActiveInspectionUnit(unit);
  };

  // Cip yang sama tidak menutup kartu — kartu selalu tampil satu.
  const handleToggleCard = (kode: string) => {
    setSelectedKode(kode);
    scrollToCard();
  };

  // ── Satu arah: modal inspeksi menulis unit + sel kartu bulan laporan ──
  // (Kartu hanya-tampil; sunting selalu lewat modal klik-baris.)

  const countDraftComponents = (draft: NonNullable<AparUnitItem['draftDetails']>): number =>
    countChecked({
      safetyPin: draft.safetyPin,
      corong: draft.corong,
      segel: draft.segel,
      tekanan: draft.tekanan,
      tabung: draft.tabung,
      selang: draft.selang,
      katupTuas: draft.katupTuas,
    });

  // Satu arah: modal inspeksi menyimpan ke API; tabel + kartu mengikuti hasil query.
  // `approvalStatus` eksplisit — `Simpan Draft` menulis DRAFT, `Terbitkan`
  // menulis DIAJUKAN — dan promise-nya dikembalikan agar pemanggil bisa menunggu
  // tulisan sebelum menutup popup.
  const kirimInspeksi = async (
    unit: AparUnitItem,
    draft: NonNullable<AparUnitItem['draftDetails']>,
    overall: OverallStatus | undefined,
    overridden: boolean,
    approvalStatus: 'DRAFT' | 'DIAJUKAN',
    onTersimpan?: () => void,
  ) => {
    const existing = inspeksiSite.find(
      (i) => i.unitId === unit.id && i.period.startsWith(period),
    );
    await simpanInspeksi.mutateAsync({
      id: existing?.id,
      unitId: unit.id,
      month: period,
      safetyPin: draft.safetyPin ?? 'NA',
      corong: draft.corong ?? 'NA',
      segel: draft.segel ?? 'NA',
      tekanan: draft.tekanan ?? 'NA',
      tabung: draft.tabung ?? 'NA',
      selang: draft.selang ?? 'NA',
      katupTuas: draft.katupTuas ?? 'NA',
      overallStatus: overall,
      overallOverridden: overridden,
      approvalStatus,
      notes: draft.notes,
    });
    onTersimpan?.();
  };

  const handleSaveInspectionDraft = (unitId: string, draft: NonNullable<AparUnitItem['draftDetails']>) => {
    const unit = units.find((u) => u.id === unitId);
    if (!unit) return;
    const checked = countDraftComponents(draft);
    const overall =
      draft.overallStatus ??
      (checked > 0
        ? computeAparOverallStatus({
            safetyPin: draft.safetyPin ?? 'NA',
            corong: draft.corong ?? 'NA',
            segel: draft.segel ?? 'NA',
            tekanan: draft.tekanan ?? 'NA',
            tabung: draft.tabung ?? 'NA',
            selang: draft.selang ?? 'NA',
            katupTuas: draft.katupTuas ?? 'NA',
          })
        : undefined);
    // Draft tetap `DRAFT`, jadi baris tidak pindah ke "Selesai Diperiksa" dan
    // popup buka-ulang tetap bisa disunting. Tutup saat tulisan berhasil.
    void kirimInspeksi(unit, draft, overall, Boolean(draft.overallStatus), 'DRAFT', () =>
      setActiveInspectionUnit(null),
    ).catch(() => {
      // onError mutasi sudah melaporkan pesannya; modal tetap terbuka.
    });
  };

  // ── Selesaikan dari modal → simpan ke API + tampil rekam hasil ──
  const handleCompleteInspection = async (
    unit: AparUnitItem,
    draft: NonNullable<AparUnitItem['draftDetails']>,
    overall: OverallStatus
  ): Promise<void> => {
    // Terbit ditunggu: rekam harus `DIAJUKAN` sebelum modal ditutup dan laporan
    // ditampilkan. Tulisan gagal = promise menolak, modal tetap terbuka.
    await kirimInspeksi(unit, draft, overall, true, 'DIAJUKAN');
    setSelectedKode(unit.kode);
    const berikut: InspectionReport = {
      id: `rep-apar-${unit.id}`,
      category: 'APAR',
      date: sekarangIso(),
      period,
      siteId: unit.siteId,
      siteName: lokasi.siteName,
      zoneName: unit.zoneName,
      assetCode: unit.kode,
      inspectorName: draft.namaPemeriksa || unit.inspectorName || 'Pengawas K3',
      overallStatus: overall,
      summaryNotes: draft.notes || 'Pemeriksaan 7 komponen selesai dan diverifikasi.',
      aparDetails: {
        jenis: unit.jenis,
        ukuran: unit.ukuran,
        expiredDate: unit.expiredDate,
        ...(unit.beratCo2Kg !== undefined ? { beratCo2Kg: unit.beratCo2Kg } : {}),
        safetyPin: draft.safetyPin ?? 'NA',
        corong: draft.corong ?? 'NA',
        segel: draft.segel ?? 'NA',
        tekanan: draft.tekanan ?? 'NA',
        tabung: draft.tabung ?? 'NA',
        selang: draft.selang ?? 'NA',
        katupTuas: draft.katupTuas ?? 'NA',
      },
    };
    setDetailReport(berikut);
    scrollToCard();
  };

  // ── Foto dokumentasi: unggahan nyata per slot (Kartu, Berat, Pengecekan) ──

  const inspeksiAktif: ApiInspeksiApar | null = activeInspectionUnit
    ? inspeksiSite.find(
        (i) => i.unitId === activeInspectionUnit.id && i.period.startsWith(period),
      ) ?? null
    : null;

  // Foto dokumentasi unit yang sedang dibuka, dibaca dari API (bukan state sesi).
  const fotoAktif = useFotoInspeksi(inspeksiAktif?.id ?? null, 'apar');

  // Batalkan terbit (tombol `Edit`): satu medan `approval_status` → DRAFT,
  // ditunggu pemanggil supaya potret mengikuti rekam.
  const handleBatalkanTerbit = async (inspectionId: string): Promise<void> => {
    await batalkanTerbit.mutateAsync(inspectionId);
  };

  // Hapus rekam inspeksi bulan ini: hook membersihkan foto dokumentasi dulu
  // (cegah 409), laman sekadar menutup modal.
  const handleHapusBulan = () => {
    if (!inspeksiAktif) return;
    hapusInspeksi.mutate(inspeksiAktif.id);
    setActiveInspectionUnit(null);
  };

  // Hapus unit sebaris seluruh datanya (dipakai popup bulan tanpa rekam).
  const handleHapusUnit = () => {
    if (!activeInspectionUnit) return;
    hapusUnit.mutate(activeInspectionUnit.id);
    setActiveInspectionUnit(null);
  };

  const handleUnggahFoto = (slot: 'Kartu' | 'Berat' | 'Pengecekan', file: File) => {
    if (!inspeksiAktif) return;
    const inspectionId = inspeksiAktif.id;
    const caption =
      slot === 'Kartu' ? 'Kartu APAR' : slot === 'Berat' ? 'Penimbangan CO2' : 'Pengecekan fisik';
    // `temuan: false` = bukti inspeksi, bukan catatan hasil temuan.
    unggahFoto.mutate({ kind: 'apar', inspectionId, file, caption, temuan: false });
  };

  const handleHapusFoto = (fotoId: string) => {
    if (!inspeksiAktif) return;
    hapusFoto.mutate({ id: fotoId, inspectionId: inspeksiAktif.id });
  };

  const handlePrintReport = () => {
    document.body.classList.add('printing-report');
    window.print();
  };

  const handlePrintCard = () => {
    if (!selectedUnit) return;
    document.body.classList.add('printing-card');
    window.print();
  };

  // Jangkar ekspor PDF: laporan bulanan (rekam pertama bulan ini) + kartu tahunan
  // (rekam unit terpilih pada tahun kartu; jangkar menentukan unit+tahun ekspor).
  const jangkarBulanan =
    inspeksiSite.find((i) => i.period.startsWith(period))?.id ?? null;
  const jangkarKartu =
    selectedUnit
      ? (inspeksiSite.find(
          (i) => i.unitId === selectedUnit.id && i.period.startsWith(cardYear),
        )?.id ?? null)
      : null;

  // ── Modal tambah zona & unit APAR (menyimpan ke API) ──
  const handleAddZone = (_zoneName: string) => {
    // Zona dibuat bersama unit pada handleAddAparUnits (butuh siteId).
  };

  const handleAddAparUnits = (items: AparCreationItem[]) => {
    if (!lokasi.siteId) return;
    items.forEach((item) => {
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
  };

  const handleReassignUnitZone = (unitId: string, newZone: string) => {
    ubahUnit.mutate({
      id: unitId,
      body: { zoneId: lokasi.zonaNamaKeId(newZone) || newZone },
    });
  };

  // ─────────────────────────────────────────────────────────
  // RENDER — halaman
  // ─────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-[var(--bg-main)] text-[var(--primary)] px-6 py-4 select-none font-sans">
      <PageHeader
        namaProyek={lokasi.namaProyek}
        siteName={lokasi.siteName}
        remahKategori="Inspeksi APAR"
        ikon={<ShieldCheck size={18} strokeWidth={2.2} />}
        aksen={APAR_ACCENT}
        judul="Laporan Inspeksi APAR"
        deskripsi="Monitoring progres pemeriksaan fisik 7 komponen APAR gedung per unit"
        isCollapsed={isCollapsed}
        onToggleCollapsed={onToggleCollapsed}
        bulan={monthDate}
        tampilkanReset={!isDefaultPeriod}
        onResetBulan={() => setPeriod(bulanBerjalan())}
        onPilihBulan={(d) => setPeriod(format(d, 'yyyy-MM'))}
        labelTambah="Tambah Zona & Unit"
        onTambah={() => setIsAddModalOpen(true)}
        kategoriEkspor="apar-monthly"
        jangkarEkspor={jangkarBulanan}
        namaBerkas={period}
        onCetak={handlePrintReport}
      />

      <div className="no-print grid grid-cols-2 gap-3 mb-4">
        <KartuStatistik
          nada="netral"
          judul="Total APAR Terdaftar"
          nilai={units.length}
          rincian={`${zones.length} Zona Terpantau`}
          ikon="🧯"
          kaki="Wajib periksa 1x per bulan"
          isi={
            <div className="mt-2 space-y-1.5">
              <div className="flex h-1.5 rounded-full overflow-hidden bg-[var(--bg-hover)]">
                <div
                  className="bg-emerald-500"
                  style={{ width: `${persenSelesai}%` }}
                  title={`${completedUnits.length} unit selesai`}
                />
                <div
                  className="bg-amber-500"
                  style={{ width: `${persenBerjalan}%` }}
                  title={`${inProgressUnits.length} unit berjalan`}
                />
              </div>
              <div className="flex items-center gap-3 text-[10px] text-[var(--muted)] tabular-nums">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {completedUnits.length} selesai
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  {inProgressUnits.length} berjalan
                </span>
              </div>
            </div>
          }
        />
        <KartuStatistik
          nada="hijau"
          judul="Selesai Diperiksa"
          nilai={completedUnits.length}
          rincian={`dari ${units.length} unit terdaftar`}
          lencana="Lengkap"
          kaki="Laporan telah diterbitkan"
          isi={
            <div className="mt-2">
              <div className="flex h-1.5 rounded-full overflow-hidden bg-emerald-500/15">
                <div className="bg-emerald-500" style={{ width: `${persenSelesai}%` }} />
              </div>
              <div className="mt-1.5 text-[10px] text-[var(--muted)] tabular-nums">
                {persenSelesai}% unit sudah punya laporan terbit
              </div>
            </div>
          }
        />
      </div>

      <FilterBar
        filterTab={filterTab}
        onFilterTab={setFilterTab}
        total={units.length}
        onProgress={inProgressUnits.length}
        completed={completedUnits.length}
        zona={zones}
        zoneFilter={zoneFilter}
        onZoneFilter={setZoneFilter}
        searchQuery={searchQuery}
        onSearchQuery={setSearchQuery}
        viewMode={viewMode}
        onViewMode={setViewMode}
        placeholderCari="Cari kode, zona, atau petugas…"
      />

      {/* e. Bagian A — hasil pemeriksaan */}
      <div className="space-y-3 pb-8">
        {/* Grup cetak LAPORAN: kop + kedaluwarsa/catatan (hal. 1) + tabel bulanan/tanda tangan (hal. 2) */}
        <div id="apar-report-print" className="space-y-3">
          <div className="apar-report-part space-y-3">
            <AparPrintHeader
              siteName={lokasi.siteName}
              monthLabel={monthLabel}
              inspectionDatesLabel={inspectionDatesLabel}
            />
        <div className="apar-report-part space-y-3">
            <div className="mb-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] print:text-black">
                A. Hasil Pemeriksaan Fisik Unit APAR
              </p>
              <h2 className="text-sm font-bold text-[var(--primary)] tracking-tight print:text-black">
                Checklist Bulanan APAR
              </h2>
              <p className="no-print text-xs text-[var(--muted)] mt-0.5">
                Klik baris untuk melihat detail atau memperbarui hasil inspeksi
              </p>
            </div>

        {filteredUnits.length === 0 ? (
          <div className="py-16 text-center text-xs text-[var(--muted)] border border-dashed border-[var(--border)] rounded-[8px] bg-[var(--bg-sidebar)]/50">
            <ShieldCheck size={32} className="mx-auto mb-2 opacity-40" style={{ color: APAR_ACCENT }} />
            <p className="font-semibold text-sm text-[var(--primary)]">Tidak ada unit APAR yang cocok</p>
            <p className="text-xs text-[var(--muted)] mt-1">Coba sesuaikan tab filter atau kata kunci pencarian Anda.</p>
            {filterTab !== 'ALL' && (
              <button
                type="button"
                onClick={() => setFilterTab('ALL')}
                className="no-print mt-3 px-3 py-1.5 text-xs font-semibold rounded-[4px] cursor-pointer"
                style={{ color: '#2f80ed', backgroundColor: 'rgba(47, 128, 237, 0.10)' }}
              >
                Tampilkan Semua Unit
              </button>
            )}
          </div>
        ) : viewMode === 'TABLE' ? (
          <AparTable units={filteredUnits} onBuka={handleOpenInspection} />
        ) : (
          <AparCards units={filteredUnits} onPilihKartu={handleSelectUnit} aksen={APAR_ACCENT} />
        )}

        </div>

        <AparExpiry groups={expiryGroups} />
        </div>

        <AparSignatures
          names={sigNames}
          roles={sigRoles}
          onName={(i, v) => setSigNames((prev) => prev.map((x, k) => (k === i ? v : x)))}
          onRole={(i, v) => setSigRoles((prev) => prev.map((x, k) => (k === i ? v : x)))}
        />

        {/* d. Pemilih APAR (layar saja) */}
        <div className="no-print pt-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
              Pilih APAR — klik untuk membuka kartu tahunan
            </p>
            <UnduhPdfButton
              category="apar-card"
              refId={jangkarKartu}
              label="Unduh PDF Kartu"
              namaBerkas={`${activeKode}-${cardYear}`}
            />
            <PrintButton
              onClick={handlePrintCard}
              label="Cetak Kartu"
              disabled={!selectedUnit}
            />
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {units.map((unit) => {
              const remaining = daysToExpiry(unit.expiredDate);
              const issue = unitHasIssue(unit);
              const allGood = unit.status === 'SELESAI' && !issue;
              const isSelected = activeKode === unit.kode;
              return (
                <button
                  key={unit.id}
                  type="button"
                  onClick={() => handleToggleCard(unit.kode)}
                  title={
                    `APAR ${unit.kode} — ${unit.zoneName} — ` +
                    (issue ? 'ada komponen tidak baik' : allGood ? 'semua komponen baik' : 'belum diperiksa') +
                    (remaining < 0 ? ' — sudah kedaluwarsa' : remaining <= 90 ? ` — kedaluwarsa ${remaining} hari lagi` : '')
                  }
                  className="relative w-10 h-10 rounded-full border font-mono text-xs font-bold tabular-nums cursor-pointer pressable transition-all bg-[var(--bg-main)] text-[var(--primary)]"
                  style={{
                    borderColor: isSelected ? APAR_ACCENT : remaining < 0 ? '#ef4444' : remaining <= 90 ? '#f59e0b' : 'var(--border)',
                    borderWidth: isSelected ? 2 : 1,
                    boxShadow: isSelected ? `0 0 0 2px ${APAR_ACCENT}55` : undefined,
                  }}
                >
                  {unit.kode}
                  <span
                    className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] leading-4 text-center font-bold ${
                      issue
                        ? 'bg-amber-500 text-white'
                        : allGood
                        ? 'bg-emerald-500 text-white'
                        : 'bg-[var(--bg-hover)] text-[var(--muted)] border border-[var(--border)]'
                    }`}
                  >
                    {issue ? '!' : allGood ? '✓' : '○'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* e. Kartu tahunan — grup cetak KARTU (judul + kartu) */}
        <div id="apar-card-print">
          <div className="hidden print:block pb-2 mb-3 border-b border-black">
            <h2 className="text-xs font-bold text-black uppercase tracking-wider">
              B. Kartu Kontrol Tahunan APAR{selectedUnit ? ` — APAR ${selectedUnit.kode}` : ''}
            </h2>
          </div>
          <div ref={cardAnchorRef} className="scroll-mt-4 pt-2">
          {selectedUnit && (
            <AparYearCard
              unit={selectedUnit}
              period={period}
              year={cardYear}
              onYearChange={setCardYear}
              grid={activeGrid}
            />
          )}
          </div>
        </div>

        </div>
      </div>

      {/* Modal inspeksi per baris (klik baris tabel) */}
      <AparInspectionModal
        unit={activeInspectionUnit}
        isOpen={activeInspectionUnit !== null}
        inspeksi={inspeksiAktif}
        foto={inspeksiAktif ? (fotoAktif.data ?? []) : []}
        mengunggah={unggahFoto.isPending}
        onUnggahFoto={handleUnggahFoto}
        onHapusFoto={handleHapusFoto}
        onClose={() => setActiveInspectionUnit(null)}
        onSaveDraft={handleSaveInspectionDraft}
        onCompleteInspection={handleCompleteInspection}
        onBatalkanTerbit={handleBatalkanTerbit}
        onHapusBulan={handleHapusBulan}
        menghapusBulan={hapusInspeksi.isPending}
        onHapusUnit={handleHapusUnit}
        menghapusUnit={hapusUnit.isPending}
        menyimpanDraf={simpanInspeksi.isPending}
      />

      {/* Rekam hasil inspeksi — tampil otomatis setelah “Selesaikan & Terbitkan” */}
      <ReportDetailModal
        report={detailReport}
        onClose={() => setDetailReport(null)}
      />

      {/* Modal tambah zona & unit APAR */}
      <AddZoneAparModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        existingZones={zones}
        existingUnits={units.map((u) => ({ id: u.id, kode: u.kode, zoneName: u.zoneName }))}
        onAddZone={handleAddZone}
        onAddAparUnits={handleAddAparUnits}
        onReassignUnitZone={handleReassignUnitZone}
      />
    </div>
  );
};
