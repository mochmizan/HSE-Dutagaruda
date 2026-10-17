import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  MapPin,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  Table as TableIcon,
  LayoutGrid,
} from 'lucide-react';
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
import { livePhotoUrl } from '@/services/api/liveClient';
import {
  COMPONENT_LABELS,
  ComponentChip,
  EligibilityBadge,
  unitHasIssue,
} from './AparBadges';
import {
  petakanUnitApar,
  petakanKartuApar,
  useUnitApar,
  useInspeksiApar,
  useSimpanInspeksiApar,
  useBuatUnitApar,
  useUbahUnitApar,
  useUnggahFoto,
  useHapusFoto,
  type FotoTampil,
} from '@/services/api/queries';
import { useKonteksLokasi } from '@/features/konteksLokasi';
import type { ApiInspeksiApar } from '@/services/api/klien';

// ─────────────────────────────────────────────────────────────
// DATA — konstanta tampilan khusus halaman APAR (UI-only)
// ─────────────────────────────────────────────────────────────

const APAR_ACCENT = '#f2994a';
const DEFAULT_PERIOD = '2026-09';

/** Tanda tangan dokumen bawaan (gaya kertas; dapat diketik di layar). */
const sekarangIso = () => new Date().toISOString();

const APAR_SIGNATURES = {
  dibuat: { nama: 'Alex Chen', jabatan: 'Staff HSE / Teknisi K3' },
  diketahui: { nama: 'Budi Santoso', jabatan: 'HSE Officer & Koordinator' },
  disetujui: { nama: 'Ir. Hendra Wijaya', jabatan: 'Kepala Operasional Logistik' },
} as const;

/** Tanggal inspeksi contoh pada periode bawaan (gaya kertas). */
const APAR_INSPECTION_DATES_SEPT_2026 = ['2026-09-16', '2026-09-18'];

/** Sisa hari menuju tanggal kedaluwarsa (negatif = sudah kedaluwarsa). */
const daysToExpiry = (iso: string) =>
  Math.ceil((new Date(`${iso}T00:00:00`).getTime() - Date.now()) / 86_400_000);

/** Daftar No. APAR gaya dokumen: “20” / “1, 14, dan 15” (koma + “dan” sebelum terakhir). */
const formatNoList = (kodes: string[]): string => {
  if (kodes.length === 0) return '–';
  if (kodes.length === 1) return kodes[0];
  if (kodes.length === 2) return `${kodes[0]} dan ${kodes[1]}`;
  return `${kodes.slice(0, -1).join(', ')}, dan ${kodes[kodes.length - 1]}`;
};

/** Tampilan gabungan: draft menang atas laporan terbit; nilai undefined dilewati. */
const getEffectiveDetails = (unit: AparUnitItem) => {
  const rep = unit.completedReport?.aparDetails as Record<string, string | undefined> | undefined;
  const draft = unit.draftDetails as Record<string, string | undefined> | undefined;
  if (!rep && !draft) return undefined;
  const merged: Record<string, string | undefined> = { ...rep };
  for (const [k, v] of Object.entries(draft ?? {})) {
    if (v !== undefined) merged[k] = v;
  }
  return merged;
};

export type { AparCardsState } from '../../lib/aparSync';

interface AparPageProps {
  onBack: () => void;
  /** Permintaan sunting dari dasbor: buka modal inspeksi rekam dengan id ini. */
  suntingRefId?: { kategori: string | null; refId: string } | null;
  onSuntingSelesai?: () => void;
}

export const AparPage: React.FC<AparPageProps> = ({ onBack, suntingRefId, onSuntingSelesai }) => {
  const lokasi = useKonteksLokasi();
  const unitQuery = useUnitApar();
  const inspeksiQuery = useInspeksiApar();
  const simpanInspeksi = useSimpanInspeksiApar();
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
  const [cardYear, setCardYear] = useState<string>('2026');

  // Foto dokumentasi per inspeksi (id baris inspeksi → daftar foto sesi).
  const [fotoApar, setFotoApar] = useState<Record<string, FotoTampil[]>>({});
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
  const monthDate = new Date(year || 2026, (month || 9) - 1, 1);
  const monthLabel = format(monthDate, 'MMMM yyyy', { locale: idLocale });
  const isDefaultPeriod = period === DEFAULT_PERIOD;

  // Unit + hasil inspeksi bulan terpilih dari API; kartu tahunan turunan inspeksi tersimpan.
  const units = petakanUnitApar(
    unitQuery.data ?? [],
    inspeksiQuery.data ?? [],
    lokasi.zonaIdKeNama,
    period,
  );
  const cards: AparCardsState = petakanKartuApar(unitQuery.data ?? [], inspeksiQuery.data ?? []);

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
      setPeriod(insp.period.slice(0, 7));
      setActiveInspectionUnit(petakanUnitApar([unit], [insp], lokasi.zonaIdKeNama, insp.period.slice(0, 7))[0] ?? null);
      onSuntingSelesai?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- satu kali per permintaan sunting
  }, [suntingRefId, inspeksiQuery.data, unitQuery.data]);
  const completedUnits = useMemo(() => units.filter((u) => u.status === 'SELESAI'), [units]);
  const inProgressUnits = useMemo(() => units.filter((u) => u.status === 'SEDANG_BERJALAN'), [units]);
  const expiringUnits = useMemo(() => units.filter((u) => daysToExpiry(u.expiredDate) <= 90), [units]);

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

  const inspectionDatesLabel =
    period === DEFAULT_PERIOD
      ? APAR_INSPECTION_DATES_SEPT_2026.map((d) => formatIndonesianDate(parseISO(d))).join(' & ')
      : '–';

  // ─────────────────────────────────────────────────────────
  // EVENTS
  // ─────────────────────────────────────────────────────────
  const shiftMonth = (delta: number) => {
    const next = new Date(year || 2026, ((month || 9) - 1) + delta, 1);
    if (next.getFullYear() !== 2026) return;
    setPeriod(format(next, 'yyyy-MM'));
  };

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

  // ── Satu arah: modal inspeksi menyimpan ke API; tabel + kartu mengikuti hasil query ──

  const kirimInspeksi = (
    unit: AparUnitItem,
    draft: NonNullable<AparUnitItem['draftDetails']>,
    overall: OverallStatus | undefined,
    overridden: boolean,
  ) => {
    const existing = (inspeksiQuery.data ?? []).find(
      (i) => i.unitId === unit.id && i.period.startsWith(period),
    );
    simpanInspeksi.mutate({
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
      notes: draft.notes,
    });
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
    kirimInspeksi(unit, draft, overall, Boolean(draft.overallStatus));
  };

  // ── Selesaikan dari modal → simpan ke API + tampil rekam hasil ──
  const handleCompleteInspection = (
    unit: AparUnitItem,
    draft: NonNullable<AparUnitItem['draftDetails']>,
    overall: OverallStatus
  ) => {
    kirimInspeksi(unit, draft, overall, true);
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
    ? (inspeksiQuery.data ?? []).find(
        (i) => i.unitId === activeInspectionUnit.id && i.period.startsWith(period),
      ) ?? null
    : null;

  const handleUnggahFoto = (slot: 'Kartu' | 'Berat' | 'Pengecekan', file: File) => {
    if (!inspeksiAktif) return;
    const inspectionId = inspeksiAktif.id;
    const caption =
      slot === 'Kartu' ? 'Kartu APAR' : slot === 'Berat' ? 'Penimbangan CO2' : 'Pengecekan fisik';
    unggahFoto.mutate(
      { kind: 'apar', inspectionId, file, caption },
      {
        onSuccess: (foto) =>
          setFotoApar((prev) => ({
            ...prev,
            [inspectionId]: [
              ...(prev[inspectionId] ?? []),
              { id: foto.id, url: livePhotoUrl(foto.id), caption },
            ],
          })),
      },
    );
  };

  const handleHapusFoto = (fotoId: string) => {
    if (!inspeksiAktif) return;
    const inspectionId = inspeksiAktif.id;
    hapusFoto.mutate({ id: fotoId, inspectionId }, {
      onSuccess: () =>
        setFotoApar((prev) => ({
          ...prev,
          [inspectionId]: (prev[inspectionId] ?? []).filter((f) => f.id !== fotoId),
        })),
    });
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
    (inspeksiQuery.data ?? []).find((i) => i.period.startsWith(period))?.id ?? null;
  const jangkarKartu =
    selectedUnit
      ? ((inspeksiQuery.data ?? []).find(
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
      {/* a. Kepala & navigasi (layar saja) */}
      <div className="no-print flex flex-col space-y-2 pb-3 mb-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1 text-[var(--primary)] hover:text-[#f2994a] font-medium transition-colors cursor-pointer pressable"
            >
              <ArrowLeft size={13} />
              <span>Kembali ke Dashboard Kalender</span>
            </button>
            <span>/</span>
            <span className="hover:text-[var(--primary)] cursor-pointer">{lokasi.clientName}</span>
            <span>/</span>
            <span className="text-[var(--primary)] font-medium">Inspeksi APAR</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
            <MapPin size={12} />
            <span>{lokasi.siteName}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-[6px] flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${APAR_ACCENT}26`, color: APAR_ACCENT }}
            >
              <ShieldCheck size={18} strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-lg font-bold text-[var(--primary)] tracking-tight">
                  Laporan Inspeksi APAR
                </h1>
                <div className="flex items-center bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-[5px] p-0.5 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => shiftMonth(-1)}
                    title="Bulan Sebelumnya"
                    className="w-6 h-6 rounded-[3px] flex items-center justify-center text-[var(--secondary)] hover:text-[var(--primary)] hover:bg-[var(--bg-hover)] cursor-pointer pressable transition-colors"
                  >
                    <ChevronLeft size={13} />
                  </button>
                  <div className="relative flex items-center">
                    <select
                      value={period}
                      onChange={(e) => setPeriod(e.target.value)}
                      className="text-xs font-semibold bg-transparent cursor-pointer py-0.5 px-2 focus:outline-none capitalize pr-5 appearance-none tabular-nums"
                      style={{ color: APAR_ACCENT }}
                    >
                      {Array.from({ length: 12 }, (_, m) => {
                        const d = new Date(2026, m, 1);
                        const value = format(d, 'yyyy-MM');
                        return (
                          <option key={value} value={value} className="bg-[var(--bg-main)] text-[var(--primary)]">
                            {format(d, 'MMMM yyyy', { locale: idLocale })}
                          </option>
                        );
                      })}
                    </select>
                    <ChevronDown size={11} className="absolute right-1 pointer-events-none" style={{ color: APAR_ACCENT }} />
                  </div>
                  <button
                    type="button"
                    onClick={() => shiftMonth(1)}
                    title="Bulan Berikutnya"
                    className="w-6 h-6 rounded-[3px] flex items-center justify-center text-[var(--secondary)] hover:text-[var(--primary)] hover:bg-[var(--bg-hover)] cursor-pointer pressable transition-colors"
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>
                {!isDefaultPeriod && (
                  <button
                    type="button"
                    onClick={() => setPeriod(DEFAULT_PERIOD)}
                    className="text-[11px] font-medium px-2 py-0.5 rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--bg-hover)] cursor-pointer transition-colors shadow-2xs"
                  >
                    Bulan Ini
                  </button>
                )}
              </div>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                Monitoring progres pemeriksaan fisik 7 komponen APAR gedung per unit
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              title="Tambah zona & unit APAR"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-white text-xs font-semibold rounded-[4px] shadow-xs cursor-pointer pressable active:scale-[0.96] transition-transform duration-150 ease-[cubic-bezier(0.2,0,0,1)]"
              style={{ backgroundColor: APAR_ACCENT }}
            >
              <span>Tambah APAR</span>
            </button>
            <UnduhPdfButton category="apar-monthly" refId={jangkarBulanan} namaBerkas={period} />
            <PrintButton onClick={handlePrintReport} label="Cetak Laporan" />
          </div>
        </div>
      </div>

      {/* c. 4 kartu statistik (layar saja) */}
      <div className="no-print grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="p-3 bg-[var(--bg-main)] border border-[var(--border)] rounded-[6px] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">Total Terdaftar</span>
            <span className="text-xs">🧯</span>
          </div>
          <div className="my-1.5">
            <div className="text-2xl font-bold font-mono text-[var(--primary)] tabular-nums">{units.length} Unit</div>
            <div className="text-[10px] text-[var(--muted)] mt-0.5 tabular-nums">{zones.length} Zona Terpantau</div>
          </div>
          <div className="text-[10px] text-[var(--muted)] pt-1 border-t border-[var(--border)]">Wajib periksa 1x per bulan</div>
        </div>

        <div
          className="p-3 rounded-[6px] shadow-xs flex flex-col justify-between border"
          style={{ background: `linear-gradient(to bottom, ${APAR_ACCENT}17, ${APAR_ACCENT}05)`, borderColor: `${APAR_ACCENT}59` }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: APAR_ACCENT }}>Sedang Berjalan</span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded text-white" style={{ backgroundColor: APAR_ACCENT }}>Prioritas</span>
          </div>
          <div className="my-1.5">
            <div className="text-2xl font-bold font-mono tabular-nums" style={{ color: APAR_ACCENT }}>{inProgressUnits.length} Unit</div>
            <div className="text-[10px] mt-0.5" style={{ color: `${APAR_ACCENT}cc` }}>Menunggu / dalam proses verifikasi</div>
          </div>
          <div className="text-[10px] pt-1 border-t font-medium" style={{ color: APAR_ACCENT, borderColor: `${APAR_ACCENT}33` }}>
            Fokus inspeksi shift minggu ini
          </div>
        </div>

        <div className="p-3 bg-gradient-to-b from-emerald-500/[0.08] to-emerald-500/[0.02] dark:from-emerald-500/[0.14] dark:to-emerald-500/[0.04] border border-emerald-500/30 rounded-[6px] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Selesai Diperiksa</span>
            <span className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.2 rounded">Lengkap</span>
          </div>
          <div className="my-1.5">
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">{completedUnits.length} Unit</div>
            <div className="text-[10px] text-[var(--muted)] mt-0.5">Hasil kelayakan terverifikasi</div>
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 pt-1 border-t border-emerald-500/20 font-medium">
            Laporan telah diterbitkan
          </div>
        </div>

        <div className="p-3 bg-[var(--bg-main)] border border-amber-500/30 rounded-[6px] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Kadaluarsa ≤90 Hari</span>
            <span className="text-xs">⏳</span>
          </div>
          <div className="my-1.5">
            <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 tabular-nums">{expiringUnits.length} Unit</div>
            <div className="text-[10px] text-[var(--muted)] mt-0.5">Segera jadwalkan isi ulang / ganti</div>
          </div>
          <div className="text-[10px] text-amber-600 dark:text-amber-400 pt-1 border-t border-amber-500/20 font-medium">
            Pantau periode kedaluwarsa di bawah
          </div>
        </div>
      </div>

      {/* d. Toolbar filter (layar saja) */}
      <div className="no-print flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 pb-3 mb-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-1 bg-[var(--bg-sidebar)] p-0.5 rounded-[5px] border border-[var(--border)] text-xs flex-wrap">
          {(
            [
              { key: 'ALL', label: 'Semua Unit', count: units.length },
              { key: 'ON_PROGRESS', label: 'Sedang Berjalan', count: units.length - completedUnits.length },
              { key: 'COMPLETED', label: 'Selesai Diperiksa', count: completedUnits.length },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilterTab(tab.key)}
              className={`py-1.5 px-3 rounded-[4px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                filterTab === tab.key ? 'text-white font-semibold shadow-xs' : 'text-[var(--secondary)] hover:text-[var(--primary)]'
              }`}
              style={filterTab === tab.key ? { backgroundColor: tab.key === 'COMPLETED' ? '#059669' : APAR_ACCENT } : undefined}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full tabular-nums ${filterTab === tab.key ? 'bg-black/20 text-white' : 'bg-[var(--bg-hover)] text-[var(--muted)]'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <select
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] focus:outline-none"
          >
            <option value="ALL">Semua Zona ({zones.length})</option>
            {zones.map((z) => (
              <option key={z} value={z}>{z}</option>
            ))}
          </select>
          <div className="relative min-w-[170px] flex-1 sm:flex-initial">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input
              type="text"
              placeholder="Cari kode, zona, atau petugas…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7 pr-2.5 py-1.5 text-xs bg-[var(--bg-main)] border border-[var(--border)] rounded-[4px] text-[var(--primary)] placeholder-[var(--muted)] focus:outline-none"
            />
          </div>
          <div className="flex items-center bg-[var(--bg-sidebar)] p-0.5 rounded-[4px] border border-[var(--border)] text-xs">
            <button
              type="button"
              onClick={() => setViewMode('TABLE')}
              title="Tampilan Tabel (mudah dicetak / ekspor)"
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

      {/* e. Bagian A — hasil pemeriksaan */}
      <div className="space-y-3 pb-8">
        {/* Grup cetak LAPORAN: kop + kedaluwarsa/catatan (hal. 1) + tabel bulanan/tanda tangan (hal. 2) */}
        <div id="apar-report-print" className="space-y-3">
          <div className="apar-report-part space-y-3">
            {/* Kepala dokumen formal (hanya saat dicetak) */}
            <div className="hidden print:block pb-3 mb-4 border-b border-black">
              <div className="flex justify-between items-start pt-1">
                <div>
                  <h1 className="text-sm font-extrabold text-black">CHECKLIST BULANAN APAR — JPM Dukuh Atas</h1>
                  <p className="text-[10px] text-gray-700">
                    Sesuai Standar K3 &amp; Permenakertrans No. 04/MEN/1980
                  </p>
                </div>
                <div className="text-right text-[10px] text-gray-800 leading-tight">
                  <p><span className="font-semibold">Lokasi Fasilitas:</span> {lokasi.siteName}</p>
                  <p><span className="font-semibold">Periode Inspeksi:</span> {monthLabel}</p>
                  <p><span className="font-semibold">Tanggal Inspeksi:</span> {inspectionDatesLabel}</p>
                </div>
              </div>
            </div>
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
                style={{ color: APAR_ACCENT, backgroundColor: `${APAR_ACCENT}1a` }}
              >
                Tampilkan Semua Unit
              </button>
            )}
          </div>
        ) : viewMode === 'TABLE' ? (
          <div className="overflow-x-auto rounded-[6px] border border-[var(--border)] bg-[var(--bg-main)] shadow-2xs">
            <table className="apar-report-table w-full text-center border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-sidebar)]/80 text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wider">
                  <th className="py-2.5 px-3 w-12 text-center align-middle">No.</th>
                  <th className="py-2.5 px-3 min-w-[80px] text-center align-middle">Kode APAR</th>
                  <th className="py-2.5 px-3 min-w-[80px] text-center align-middle">Zona</th>
                  <th className="py-2.5 px-3 min-w-[110px] text-center align-middle">Jenis / Ukuran</th>
                  <th className="py-2.5 px-3 min-w-[120px] text-center align-middle">Periode Expired</th>
                  <th className="py-2.5 px-3 min-w-[264px] text-center align-middle">Verifikasi 7 Komponen</th>
                  <th className="py-2.5 px-3 min-w-[140px] text-center align-middle">Status Kelayakan</th>
                  <th className="py-2.5 px-3 min-w-[170px] text-center align-middle">Petugas &amp; Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-xs">
                {filteredUnits.map((unit, idx) => {
                  const details = getEffectiveDetails(unit) as Record<string, string | undefined> | undefined;
                  const isCompleted = unit.status === 'SELESAI';
                  const remaining = daysToExpiry(unit.expiredDate);
                  return (
                    <tr
                      key={unit.id}
                      onClick={() => handleOpenInspection(unit)}
                      title="Klik baris untuk melihat detail atau memperbarui hasil inspeksi"
                      className={`transition-colors cursor-pointer ${
                        remaining < 0
                          ? 'bg-gradient-to-r from-red-500/[0.12] via-red-500/[0.06] to-red-500/[0.02] dark:from-red-500/[0.18] dark:via-red-500/[0.09] dark:to-red-500/[0.04] hover:from-red-500/[0.18] hover:to-red-500/[0.08]'
                          : isCompleted
                          ? 'bg-gradient-to-r from-emerald-500/[0.12] via-emerald-500/[0.06] to-emerald-500/[0.02] dark:from-emerald-500/[0.18] dark:via-emerald-500/[0.09] dark:to-emerald-500/[0.04] hover:from-emerald-500/[0.18] hover:to-emerald-500/[0.08]'
                          : 'hover:bg-[var(--bg-hover)]/60'
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center align-middle font-mono text-[var(--muted)] tabular-nums">{idx + 1}</td>
                      <td className="py-2.5 px-3 text-center align-middle font-semibold text-[var(--primary)] font-mono tabular-nums">{unit.kode}</td>
                      <td className="py-2.5 px-3 text-center align-middle font-semibold text-[var(--primary)]">{unit.zoneName}</td>
                      <td className="py-2.5 px-3 text-center align-middle text-[var(--secondary)]">
                        {unit.jenis} • {unit.ukuran}
                      </td>
                      <td className={`py-2.5 px-3 text-center align-middle tabular-nums ${remaining <= 90 ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-[var(--secondary)]'}`}>
                        {formatIndonesianDate(parseISO(unit.expiredDate))}
                      </td>
                      <td className="py-2.5 px-3 text-left align-middle">
                        <div className="apar-chip-wrap flex items-center justify-start gap-1 flex-wrap">
                          {COMPONENT_LABELS.map((c) => (
                            <ComponentChip key={c.key} label={c.label} status={details?.[c.key]} />
                          ))}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center align-middle"><EligibilityBadge unit={unit} /></td>
                      <td className="py-2.5 px-3 text-center align-middle text-[11px] text-[var(--secondary)]">
                        <div className="leading-tight flex flex-col items-center justify-center">
                          <p className="font-medium text-[var(--primary)] truncate max-w-[160px]">{unit.inspectorName || '–'}</p>
                          <p className="text-[10px] text-[var(--muted)] font-mono mt-0.5 tabular-nums">
                            {unit.lastInspectionDate
                              ? format(parseISO(unit.lastInspectionDate), 'dd MMM yyyy', { locale: idLocale })
                              : unit.scheduledDate || 'Bulan Ini'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="apar-card-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredUnits.map((unit) => {
              const details = getEffectiveDetails(unit) as Record<string, string | undefined> | undefined;
              const isCompleted = unit.status === 'SELESAI';
              const isOnProgress = unit.status === 'SEDANG_BERJALAN';
              return (
                <div
                  key={unit.id}
                  className={`p-3.5 rounded-[6px] border bg-[var(--bg-main)] hover:shadow-xs transition-all flex flex-col justify-between ${
                    isOnProgress ? 'border-amber-500/40' : isCompleted ? 'border-emerald-500/30' : 'border-[var(--border)]'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-[var(--primary)] tracking-tight font-mono tabular-nums">
                          APAR {unit.kode}
                        </h3>
                        <span className="text-[10px] text-[var(--secondary)]">
                          {unit.zoneName} • {unit.jenis} {unit.ukuran}
                        </span>
                      </div>
                      <EligibilityBadge unit={unit} />
                    </div>
                    <div className="mt-3 pt-2 border-t border-[var(--border)]">
                      <div className="flex flex-wrap gap-1">
                        {COMPONENT_LABELS.map((c) => (
                          <ComponentChip key={c.key} label={c.label} status={details?.[c.key]} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-[var(--border)] flex items-center justify-between text-xs">
                    <span className="text-[10px] text-[var(--muted)] font-mono tabular-nums">
                      Exp. {format(parseISO(unit.expiredDate), 'dd MMM yyyy', { locale: idLocale })}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSelectUnit(unit.kode)}
                      className="no-print px-3 py-1 text-xs font-semibold rounded-[4px] text-white shadow-xs cursor-pointer pressable"
                      style={{ backgroundColor: APAR_ACCENT }}
                    >
                      Buka Kartu
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        </div>

        {/* b. Rekap kedaluwarsa APAR — gaya dokumen kertas (dihitung dari unit; halaman 2 saat cetak) */}
        <div id="kadaluwarsa" className="scroll-mt-4 pt-4 bg-white dark:bg-[var(--bg-main)] print:bg-white print:break-before-page print:break-inside-avoid">
          <h2 className="text-sm font-bold text-left text-[var(--primary)] tracking-tight print:text-black print:text-sm print:text-left">
            Kadaluwarsa APAR
          </h2>
          <p className="no-print text-xs text-[var(--muted)] mt-0.5 mb-2">
            Dihitung otomatis dari tanggal kedaluwarsa seluruh unit terdaftar
          </p>
          <div className="overflow-x-auto border border-[var(--border)] print:border-black bg-[var(--bg-main)] dark:bg-[var(--bg-main)] print:bg-white shadow-2xs print:shadow-none rounded-[6px] print:rounded-none">
            <table className="w-full text-center border-collapse text-xs print:text-[10px]">
              <thead>
                <tr className="border-b border-[var(--border)] print:border-black bg-[var(--bg-sidebar)]/80 print:bg-white text-[10px] font-bold text-[var(--muted)] print:text-black uppercase print:normal-case tracking-wider print:tracking-normal">
                  <th className="py-2.5 px-3 print:py-1.5 print:px-2 w-12 text-center align-middle border-r border-[var(--border)] print:border-black">No</th>
                  <th className="py-2.5 px-3 print:py-1.5 print:px-2 text-center align-middle border-r border-[var(--border)] print:border-black">Periode Kadaluwarsa</th>
                  <th className="py-2.5 px-3 print:py-1.5 print:px-2 text-center align-middle border-r border-[var(--border)] print:border-black">Total APAR</th>
                  <th className="py-2.5 px-3 print:py-1.5 print:px-2 text-center align-middle">No APAR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] print:divide-black tabular-nums">
                {expiryGroups.map((g, idx) => (
                  <tr key={g.date} className="hover:bg-[var(--bg-hover)]/60 print:hover:bg-white">
                    <td className="py-2.5 px-3 print:py-1.5 print:px-2 text-center align-middle font-mono text-[var(--muted)] print:text-black border-r border-[var(--border)] print:border-black">{idx + 1}</td>
                    <td className="py-2.5 px-3 print:py-1.5 print:px-2 text-center align-middle font-medium text-[var(--primary)] print:text-black border-r border-[var(--border)] print:border-black">
                      {formatIndonesianDate(parseISO(g.date))}
                    </td>
                    <td className="py-2.5 px-3 print:py-1.5 print:px-2 text-center align-middle font-bold font-mono text-[var(--primary)] print:text-black border-r border-[var(--border)] print:border-black">
                      {g.kodes.length}
                    </td>
                    <td className="py-2.5 px-3 print:py-1.5 print:px-2 text-center align-middle font-mono text-[var(--secondary)] print:text-black">
                      {formatNoList(g.kodes)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Catatan — judul saja seperti dokumen kertas (diisi tulis tangan) */}
          <div className="mt-3 print:mt-2 print:break-inside-avoid">
            <p className="text-xs print:text-[10px] font-bold text-[var(--primary)] print:text-black text-left">
              Catatan :
            </p>
            <div className="hidden print:block mt-1 min-h-[56px] border border-black px-2 py-1.5" aria-hidden="true" />
          </div>
          </div>
        </div>

        {/* c. Blok tanda tangan — gaya dokumen kertas (satu blok layar + cetak; halaman 2 saat cetak) */}
        <div className="apar-report-part pt-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left print:grid-cols-3 print:gap-6 print:break-inside-avoid bg-white dark:bg-[var(--bg-main)] print:bg-white px-1">
          {(
            [
              { caption: 'Dibuat Oleh :', idx: 0 },
              { caption: 'Diketahui Oleh :', idx: 1 },
              { caption: 'Disetujui Oleh :', idx: 2 },
            ]
          ).map((s) => (
            <div key={s.caption} className="text-xs print:text-[10px]">
              <p className="font-semibold text-left text-[var(--secondary)] print:text-black">{s.caption}</p>
              <div className="h-20 print:h-20" />
              {/* Layar: input ketik (nama bergaris bawah tebal + jabatan polos) */}
              <input
                type="text"
                value={sigNames[s.idx]}
                onChange={(e) =>
                  setSigNames((prev) => prev.map((v, i) => (i === s.idx ? e.target.value : v)))
                }
                aria-label={`Nama ${s.caption}`}
                className="no-print w-full bg-transparent text-left font-bold text-[var(--primary)] border-b border-black/70 hover:border-black focus:border-black focus:outline-none read-only:opacity-80 px-0 py-0.5"
              />
              <input
                type="text"
                value={sigRoles[s.idx]}
                onChange={(e) =>
                  setSigRoles((prev) => prev.map((v, i) => (i === s.idx ? e.target.value : v)))
                }
                aria-label={`Jabatan ${s.caption}`}
                className="no-print mt-0.5 w-full bg-transparent text-left text-[11px] text-[var(--muted)] border-b border-transparent hover:border-[var(--border)] focus:border-[var(--border)] focus:outline-none read-only:opacity-80 px-0 py-0.5"
              />
              {/* Cetak: teks polos bergaris bawah (input disembunyikan global saat cetak) */}
              <p className="hidden print:block text-left font-bold text-black border-b border-black leading-relaxed">
                {sigNames[s.idx] || '\u00A0'}
              </p>
              <p className="hidden print:block text-left text-[9px] text-gray-800 mt-0.5">
                {sigRoles[s.idx] || '\u00A0'}
              </p>
            </div>
          ))}
        </div>

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
        foto={inspeksiAktif ? (fotoApar[inspeksiAktif.id] ?? []) : []}
        mengunggah={unggahFoto.isPending}
        onUnggahFoto={handleUnggahFoto}
        onHapusFoto={handleHapusFoto}
        onClose={() => setActiveInspectionUnit(null)}
        onSaveDraft={handleSaveInspectionDraft}
        onCompleteInspection={handleCompleteInspection}
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
