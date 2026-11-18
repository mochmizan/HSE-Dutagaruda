import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Eye, Printer } from 'lucide-react';
import {
  getStandardP3kItemsForType,
  matchP3kCatalogItem,
} from '../../lib/p3kItems';
import { AddZoneP3kModal, type P3kBoxCreationPayload } from './AddZoneP3kModal';
import { P3kCards } from './P3kCards';
import { P3kInspectionModal } from './P3kInspectionModal';
import { P3kPrintHeader, P3kPrintSignatures } from './P3kPrintChrome';
import { P3kStatistik } from './P3kStatistik';
import { P3kUnitTable, type P3kUnitRow } from './P3kUnitTable';
import { formatP3kBoxName, parseP3kBoxName } from './p3kBoxMeta';
import { petakanGridP3k } from './petaApi';
import {
  useKotakP3k,
  useBuatKotakP3k,
  useInspeksiP3k,
  useSimpanInspeksiP3k,
  useUbahButirP3k,
  useUbahInspeksiP3k,
  useHapusInspeksiP3k,
  useHapusKotakP3k,
} from '@/services/api/queries';
import { ambilButirP3k, type ApiInspeksiP3k } from '@/services/api/klien';
import { useKonteksLokasi } from '@/features/konteksLokasi';
import { InspectionPageShell, KONFIG_P3K } from '@/features/inspeksi';
import { FilterBar, type FilterTab } from '@/features/pageChrome';
import { MonthSwitcher, type ViewMode } from '@/components/ui';
import {
  MONTH_NAMES,
  emptyMonth,
  markFor,
  type P3kMonthData,
} from './types';

interface P3kPageProps {
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
}

const bulanBerjalan = () => format(new Date(), 'yyyy-MM');

export const P3kPage: React.FC<P3kPageProps> = ({ isCollapsed, onToggleCollapsed }) => {
  const lokasi = useKonteksLokasi();
  const kotakQuery = useKotakP3k();
  const inspeksiQuery = useInspeksiP3k();
  const buatInspeksi = useSimpanInspeksiP3k();
  const ubahInspeksi = useUbahInspeksiP3k();
  const ubahButir = useUbahButirP3k();
  const hapusInspeksi = useHapusInspeksiP3k();
  const hapusKotak = useHapusKotakP3k();
  const buatKotak = useBuatKotakP3k();

  const [period, setPeriod] = useState<string>(bulanBerjalan);
  const [filterTab, setFilterTab] = useState<FilterTab>('ALL');
  const [zoneFilter, setZoneFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('TABLE');

  const [isAddBoxOpen, setIsAddBoxOpen] = useState(false);
  const [activeBoxId, setActiveBoxId] = useState<string | null>(null);

  const year = period.slice(0, 4);
  const monthKey = period.slice(5, 7);
  const monthIdx = Math.max(0, Number(monthKey) - 1);

  const daftarKotakSite = useMemo(
    () => (kotakQuery.data ?? []).filter((b) => b.siteId === lokasi.siteId),
    [kotakQuery.data, lokasi.siteId],
  );

  
  const [hydratedItemsById, setHydratedItemsById] = useState<
    Record<string, NonNullable<ApiInspeksiP3k['items']>>
  >({});

  const missingItemInspIds = useMemo(() => {
    const boxIds = new Set(daftarKotakSite.map((b) => b.id));
    return (inspeksiQuery.data ?? [])
      .filter(
        (i) =>
          boxIds.has(i.boxId) &&
          i.period.startsWith(period) &&
          (!i.items || i.items.length === 0) &&
          !hydratedItemsById[i.id],
      )
      .map((i) => i.id);
  }, [daftarKotakSite, inspeksiQuery.data, period, hydratedItemsById]);

  useEffect(() => {
    if (missingItemInspIds.length === 0) return;
    let cancelled = false;
    void Promise.all(
      missingItemInspIds.map(async (id) => {
        try {
          const detail = await ambilButirP3k(id);
          return [id, detail.items ?? []] as const;
        } catch {
          return [id, []] as const;
        }
      }),
    ).then((entries) => {
      if (!cancelled) {
        setHydratedItemsById((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [missingItemInspIds]);

  const inspeksiWithItems = useMemo(
    () =>
      (inspeksiQuery.data ?? []).map((i) =>
        i.items && i.items.length > 0 ? i : { ...i, items: hydratedItemsById[i.id] ?? [] },
      ),
    [inspeksiQuery.data, hydratedItemsById],
  );

  const gridByBox = useMemo(
    () => petakanGridP3k(daftarKotakSite, inspeksiWithItems, year),
    [daftarKotakSite, inspeksiWithItems, year],
  );

  const units: P3kUnitRow[] = useMemo(() => {
    return daftarKotakSite.map((box, idx) => {
      const meta = parseP3kBoxName(box.name, idx);
      const cell = gridByBox[box.id]?.[monthKey];
      const insp = (inspeksiQuery.data ?? []).find(
        (i) => i.boxId === box.id && i.period.startsWith(period),
      );
      const catalog = getStandardP3kItemsForType(meta.boxType);

      let standarCount = 0;
      let tidakStandarCount = 0;
      let kdCount = 0;
      if (cell) {
        for (const std of catalog) {
          const mark = markFor(std.id, std.standardQty, cell);
          if (mark === 'standar') standarCount += 1;
          else if (mark === 'kurang') tidakStandarCount += 1;
          else if (mark === 'kd') kdCount += 1;
        }
      }

      const isCompleted = Boolean(insp);
      return {
        id: box.id,
        kode: meta.kode,
        zoneName: meta.zoneName,
        boxType: meta.boxType,
        status: isCompleted ? 'SELESAI' : 'BELUM_DIPERIKSA',
        standarCount,
        tidakStandarCount,
        kdCount,
        inspectorName:
          cell?.paraf?.trim() || 'Takamay Jason Hermantika Irsyad (Junior HSE Analyst)',
        inspectionDate: cell?.tanggal || '',
        notes:
          insp?.notes ||
          (isCompleted
            ? tidakStandarCount > 0 || kdCount > 0
              ? `${tidakStandarCount} item tidak standar${kdCount > 0 ? `, ${kdCount} kadaluarsa` : ''}`
              : 'Seluruh 21 item sesuai standar'
            : ''),
      };
    });
  }, [daftarKotakSite, gridByBox, monthKey, inspeksiQuery.data, period]);

  const zonaTersedia = useMemo(
    () => Array.from(new Set(units.map((u) => u.zoneName))).sort(),
    [units],
  );

  const filteredUnits = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return units.filter((u) => {
      if (filterTab === 'COMPLETED' && u.status !== 'SELESAI') return false;
      if (zoneFilter !== 'ALL' && u.zoneName !== zoneFilter) return false;
      if (q) {
        const hay = `${u.kode} ${u.zoneName} Tipe ${u.boxType} ${u.notes}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [units, filterTab, zoneFilter, searchQuery]);

  const totalUnits = units.length;
  const completedCount = units.filter((u) => u.status === 'SELESAI').length;

  const activeBox = useMemo(
    () => units.find((u) => u.id === activeBoxId) ?? null,
    [units, activeBoxId],
  );

  const jangkarEkspor = useMemo(() => {
    const firstInsp = (inspeksiQuery.data ?? []).find((i) =>
      daftarKotakSite.some((b) => b.id === i.boxId && i.period.startsWith(`${year}-`)),
    );
    return firstInsp?.id ?? null;
  }, [inspeksiQuery.data, daftarKotakSite, year]);

  const bukaHalamanCetakP3k = (autoPrint = false, targetUnit?: P3kUnitRow | null) => {
    const u = targetUnit ?? units[0] ?? null;
    const params = new URLSearchParams({
      cetak: 'p3k',
      tahun: year,
      tipe: u?.boxType ?? 'A',
    });
    if (u?.id) params.set('unit', u.id);
    if (autoPrint) params.set('autoprint', '1');
    window.open(
      `${window.location.origin}${window.location.pathname}?${params.toString()}`,
      '_blank',
      'noopener',
    );
  };

  const handleAddP3kBox = async (data: P3kBoxCreationPayload) => {
    if (!lokasi.siteId) return;
    await buatKotak.mutateAsync({
      siteId: lokasi.siteId,
      name: formatP3kBoxName(data.kode, data.zoneName, data.boxType),
    });
  };

  const activeData: P3kMonthData = useMemo(() => {
    if (!activeBoxId) return emptyMonth();
    return gridByBox[activeBoxId]?.[monthKey] ?? emptyMonth();
  }, [activeBoxId, gridByBox, monthKey]);

  const activeCatalog = useMemo(
    () => getStandardP3kItemsForType(activeBox?.boxType ?? 'A'),
    [activeBox?.boxType],
  );

  const rekamAktif = useMemo(
    () =>
      activeBoxId
        ? (inspeksiQuery.data ?? []).find(
            (i) => i.boxId === activeBoxId && i.period.startsWith(period),
          ) ?? null
        : null,
    [activeBoxId, inspeksiQuery.data, period],
  );

  const menyimpan = buatInspeksi.isPending || ubahInspeksi.isPending || ubahButir.isPending;

  const handleSave = async (data: P3kMonthData) => {
    if (!activeBoxId) return;
    const kepala = {
      inspectionDate: data.tanggal.trim() ? data.tanggal.trim() : undefined,
      paraf: data.paraf.trim() ? data.paraf.trim() : 'Takamay Jason H. I.',
    };
    const simpanButir = async (inspectionId: string) => {
      const detail = await ambilButirP3k(inspectionId);
      const target = detail.items ?? [];
      await Promise.all(
        activeCatalog.map((std) => {
          const butir = target.find((it) => {
            const m = matchP3kCatalogItem(it.itemName);
            return m ? m.id === std.id : it.itemName === std.name;
          });
          if (!butir) return Promise.resolve();
          const nilai = data.items[std.id];
          const actual = typeof nilai?.actual === 'number' ? nilai.actual : std.standardQty;
          return ubahButir.mutateAsync({
            inspectionId,
            itemId: butir.id,
            body: {
              actualQty: actual,
              status: nilai?.expired
                ? 'KADALUARSA'
                : actual >= std.standardQty
                ? 'STANDAR'
                : 'DIBAWAH_STANDAR',
            },
          });
        }),
      );
    };
    if (rekamAktif) {
      if (kepala.inspectionDate !== undefined || kepala.paraf !== undefined) {
        await ubahInspeksi.mutateAsync({ id: rekamAktif.id, body: kepala });
      }
      await simpanButir(rekamAktif.id);
    } else {
      const baru = await buatInspeksi.mutateAsync({ boxId: activeBoxId, month: period, ...kepala });
      await simpanButir(baru.id);
    }
  };

  const handleClear = () => {
    if (rekamAktif) {
      hapusInspeksi.mutate(rekamAktif.id);
    }
    setActiveBoxId(null);
  };

  const handleHapusUnit = () => {
    if (activeBoxId) {
      hapusKotak.mutate(activeBoxId);
    }
    setActiveBoxId(null);
  };

  return (
    <InspectionPageShell
      config={KONFIG_P3K}
      namaProyek={lokasi.namaProyek}
      siteName={lokasi.siteName}
      isCollapsed={isCollapsed}
      onToggleCollapsed={onToggleCollapsed}
      poros={
        <>
          {period !== bulanBerjalan() && (
            <button
              type="button"
              onClick={() => setPeriod(bulanBerjalan())}
              className="text-[11px] font-medium px-2 py-0.5 rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--bg-hover)] cursor-pointer transition-colors shadow-2xs"
            >
              Bulan Ini
            </button>
          )}
          <MonthSwitcher
            value={new Date(Number(year), Number(monthKey) - 1, 1)}
            onChange={(d) => setPeriod(format(d, 'yyyy-MM'))}
            accent={KONFIG_P3K.aksen}
          />
        </>
      }
      jangkarEkspor={jangkarEkspor}
      namaBerkas={period}
      onCetak={() => bukaHalamanCetakP3k(true)}
      labelTambah="Tambah Zona & Kotak P3K"
      onTambah={() => setIsAddBoxOpen(true)}
      kepalaCetak={
        <P3kPrintHeader
          siteName={lokasi.siteName}
          year={year}
          unitKerja="HSE"
          lokasiKerja={lokasi.siteName}
        />
      }
      statistik={
        <P3kStatistik
          totalKotak={totalUnits}
          jumlahZona={zonaTersedia.length}
          selesai={completedCount}
        />
      }
      saring={
        <FilterBar
          filterTab={filterTab}
          onFilterTab={setFilterTab}
          total={totalUnits}
          completed={completedCount}
          zona={zonaTersedia}
          zoneFilter={zoneFilter}
          onZoneFilter={setZoneFilter}
          searchQuery={searchQuery}
          onSearchQuery={setSearchQuery}
          viewMode={viewMode}
          onViewMode={setViewMode}
        />
      }
      isi={
        <div className="space-y-4 pb-8 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-[var(--primary)] tracking-tight print:text-black">
                A. Hasil Pemeriksaan Kotak P3K ({MONTH_NAMES[monthIdx]} {year})
              </h2>
              <p className="no-print text-[11px] text-[var(--muted)]">
                Klik baris/kartu Kotak P3K untuk memeriksa 21 item standar sesuai Tipe Kotak (A, B, atau C)
              </p>
            </div>

            <div className="no-print flex items-center gap-2">
              <button
                type="button"
                onClick={() => bukaHalamanCetakP3k(false)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] hover:bg-[var(--bg-hover)] text-[var(--primary)] cursor-pointer pressable tabular-nums"
              >
                <Eye size={13} />
                <span>Pratinjau Cetak</span>
              </button>
              <button
                type="button"
                onClick={() => bukaHalamanCetakP3k(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[4px] bg-[#27ae60] hover:bg-[#219653] text-white shadow-2xs cursor-pointer pressable tabular-nums"
              >
                <Printer size={13} />
                <span>Cetak Kartu Tahunan P3K</span>
              </button>
            </div>
          </div>

          {filteredUnits.length === 0 ? (
            <div className="no-print py-10 text-center border border-dashed border-[var(--border)] rounded-[8px] bg-[var(--bg-sidebar)]/50">
              <p className="font-semibold text-sm text-[var(--primary)]">
                Belum ada Kotak P3K yang cocok
              </p>
              <p className="text-xs text-[var(--muted)] mt-1">
                Tambahkan Zona &amp; Kotak P3K baru atau ubah kata kunci pencarian.
              </p>
              <button
                type="button"
                onClick={() => setIsAddBoxOpen(true)}
                className="mt-3 px-3 py-1.5 text-xs font-semibold text-white bg-[#2f80ed] hover:bg-[#2b77d4] rounded-[4px] cursor-pointer pressable"
              >
                + Tambah Zona &amp; Kotak P3K
              </button>
            </div>
          ) : viewMode === 'TABLE' ? (
            <P3kUnitTable units={filteredUnits} onBuka={(u) => setActiveBoxId(u.id)} />
          ) : (
            <P3kCards
              units={filteredUnits}
              onBuka={(u) => setActiveBoxId(u.id)}
              aksen={KONFIG_P3K.aksen}
            />
          )}
        </div>
      }
      tandaTangan={<P3kPrintSignatures />}
      modals={
        <>
          <AddZoneP3kModal
            isOpen={isAddBoxOpen}
            onClose={() => setIsAddBoxOpen(false)}
            existingZones={zonaTersedia}
            existingBoxes={units.map((u) => ({
              id: u.id,
              kode: u.kode,
              zoneName: u.zoneName,
              boxType: u.boxType,
            }))}
            onAddP3kBox={handleAddP3kBox}
          />
          <P3kInspectionModal
            isOpen={activeBoxId !== null}
            monthLabel={
              activeBox
                ? `${activeBox.kode} (${activeBox.zoneName}) · ${MONTH_NAMES[monthIdx]} ${year}`
                : `${MONTH_NAMES[monthIdx]} ${year}`
            }
            initial={activeData}
            itemsCatalog={activeCatalog}
            boxType={activeBox?.boxType ?? 'A'}
            rekam={rekamAktif}
            menyimpan={menyimpan}
            menghapusBulan={hapusInspeksi.isPending}
            unitKode={activeBox ? `${activeBox.kode} (${activeBox.zoneName} · Tipe ${activeBox.boxType})` : ''}
            menghapusUnit={hapusKotak.isPending}
            onHapusUnit={handleHapusUnit}
            onClose={() => setActiveBoxId(null)}
            onSave={handleSave}
            onClear={handleClear}
          />
        </>
      }
    />
  );
};
