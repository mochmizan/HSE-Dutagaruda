import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { flushSync } from 'react-dom';
import { addMonths, subMonths, format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { HseSidebar, TombolPerluas } from '@/features/navigation';
import { LoginScreen, useSesi, useKeluar, usePulihkanProyek } from '@/features/auth';
import { PenyediaLokasi, useKonteksLokasi } from '@/features/konteksLokasi';
import { HseCalendar } from '@/features/calendar';
import { PetaProyek } from '@/features/peta';
import { MonthlyReportsPanel, ReportDetailModal } from '@/features/reports';
import { useUmpan, petakanUmpanKeLaporan, useUnitHidran, useUnitApar, useKotakP3k } from '@/services/api/queries';
import { InspectionCategory, InspectionReport } from '@/types';
import { Agentation } from 'agentation';

type AppView =
  | 'dashboard'
  | 'hydrant'
  | 'hydrant-cetak'
  | 'apar'
  | 'apar-cetak'
  | 'p3k'
  | 'p3k-cetak'
  | 'patrol'
  | 'patrol-cetak';

function ambilParamCetak(nama: string): string | null {
  try {
    const mentah = window.location.search.replace(/^\?/, '');
    for (const bagian of mentah.split('?')) {
      const nilai = new URLSearchParams(bagian).get(nama);
      if (nilai) return nilai;
    }
    return null;
  } catch {
    return null;
  }
}

function bacaCetakAwal(): AppView {
  try {
    const cetak = ambilParamCetak('cetak');
    if (cetak === 'hydrant') return 'hydrant-cetak';
    if (cetak === 'apar') return 'apar-cetak';
    if (cetak === 'p3k') return 'p3k-cetak';
    if (cetak === 'patrol' || cetak === 'patroli') return 'patrol-cetak';
    return 'dashboard';
  } catch {
    return 'dashboard';
  }
}

function bacaBulanCetak(): string | undefined {
  try {
    const b = ambilParamCetak('bulan');
    return /^\d{4}-\d{2}$/.test(b ?? '') ? (b as string) : undefined;
  } catch {
    return undefined;
  }
}

function bacaTahunCetak(): string | undefined {
  try {
    const t = ambilParamCetak('tahun');
    return /^\d{4}$/.test(t ?? '') ? (t as string) : undefined;
  } catch {
    return undefined;
  }
}

function bacaModeCetak(): string | undefined {
  try {
    return ambilParamCetak('mode') ?? undefined;
  } catch {
    return undefined;
  }
}

function bacaUnitCetak(): string | undefined {
  try {
    return ambilParamCetak('unit') ?? undefined;
  } catch {
    return undefined;
  }
}

function bacaAutoPrint(): boolean {
  try {
    return ambilParamCetak('autoprint') === '1';
  } catch {
    return false;
  }
}

const hariIni = () => new Date();

function HalamanMemuat() {
  return (
    <div className="flex-1 flex items-center justify-center gap-2 text-xs text-[var(--muted)]">
      <Loader2 size={14} className="animate-spin" />
      <span>Memuat halaman…</span>
    </div>
  );
}

const HydrantPage = lazy(() => import('@/features/hydrant').then((m) => ({ default: m.HydrantPage })));
const HydrantPrintPreview = lazy(() =>
  import('@/features/hydrant').then((m) => ({ default: m.HydrantPrintPreview }))
);
const AparPage = lazy(() => import('@/features/apar').then((m) => ({ default: m.AparPage })));
const AparPrintPreview = lazy(() =>
  import('@/features/apar').then((m) => ({ default: m.AparPrintPreview }))
);
const P3kPage = lazy(() => import('@/features/p3k').then((m) => ({ default: m.P3kPage })));
const P3kPrintPreview = lazy(() =>
  import('@/features/p3k').then((m) => ({ default: m.P3kPrintPreview }))
);
const PatrolPage = lazy(() => import('@/features/patrol').then((m) => ({ default: m.PatrolPage })));
const PatrolPrintPreview = lazy(() =>
  import('@/features/patrol').then((m) => ({ default: m.PatrolPrintPreview }))
);

function bersihkanQueryCetak() {
  try {
    const u = new URL(window.location.href);
    u.searchParams.delete('cetak');
    u.searchParams.delete('mode');
    u.searchParams.delete('unit');
    u.searchParams.delete('tahun');
    u.searchParams.delete('autoprint');
    window.history.replaceState(null, '', u.toString());
  } catch {
    /* abaikan */
  }
}

function AppIsi() {
  const sesi = useSesi();
  const keluar = useKeluar();
  const pulihkanProyek = usePulihkanProyek();
  const dipulihkan = useRef<string | null>(null);
  const pulihkanRef = useRef(pulihkanProyek.mutate);
  pulihkanRef.current = pulihkanProyek.mutate;
  const [currentView, setCurrentView] = useState<AppView>(bacaCetakAwal);
  const [bulanCetak] = useState<string | undefined>(bacaBulanCetak);
  const [tahunCetak] = useState<string | undefined>(bacaTahunCetak);
  const [modeCetak] = useState<string | undefined>(bacaModeCetak);
  const [unitCetak] = useState<string | undefined>(bacaUnitCetak);
  const [autoPrint] = useState<boolean>(bacaAutoPrint);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const toggleCollapsed = () => setIsCollapsed((v) => !v);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [currentDate, setCurrentDate] = useState<Date>(() => hariIni());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<InspectionCategory | 'ALL'>('ALL');
  const [calendarSiteFilter, setCalendarSiteFilter] = useState<string>('');

  const [detailReport, setDetailReport] = useState<InspectionReport | null>(null);
  const [bukaSunting, setBukaSunting] = useState<{ kategori: string | null; refId: string } | null>(
    null,
  );

  const lokasi = useKonteksLokasi();
  const monthKey = format(currentDate, 'yyyy-MM');
  const umpan = useUmpan(monthKey);
  const unitHidran = useUnitHidran();
  const unitApar = useUnitApar();
  const kotakP3k = useKotakP3k();

  const effectiveCalendarSite = calendarSiteFilter || lokasi.siteId || 'ALL';

  const reports = petakanUmpanKeLaporan(umpan.data, {
    zonaNama: lokasi.zonaIdKeNama,
    unitHidran: new Map((unitHidran.data ?? []).map((u) => [u.id, u])),
    unitApar: new Map((unitApar.data ?? []).map((u) => [u.id, u])),
    kotakP3k: new Map((kotakP3k.data ?? []).map((b) => [b.id, b])),
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const s = sesi.data;
    if (!s || s.perusahaanId || dipulihkan.current === s.id) return;
    dipulihkan.current = s.id;
    pulihkanRef.current();
  }, [sesi.data]);

  const toggleTheme = (e?: React.MouseEvent) => {
    const isAppearanceTransition =
      typeof document !== 'undefined' &&
      'startViewTransition' in document &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!isAppearanceTransition) {
      setIsDarkMode((prev) => !prev);
      return;
    }

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;

    if (e?.currentTarget) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top + rect.height / 2;
    } else if (e?.clientX && e?.clientY) {
      x = e.clientX;
      y = e.clientY;
    }

    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = (document as any).startViewTransition(() => {
      flushSync(() => {
        setIsDarkMode((prev) => !prev);
      });
    });

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];

      document.documentElement.animate(
        {
          clipPath,
        },
        {
          duration: 450,
          easing: 'cubic-bezier(0.2, 0, 0, 1)',
          pseudoElement: '::view-transition-new(root)',
        }
      );
    });
  };

  const handlePrevMonth = () => setCurrentDate((d) => subMonths(d, 1));
  const handleNextMonth = () => setCurrentDate((d) => addMonths(d, 1));
  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  if (sesi.isPending) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[var(--bg-main)] text-[var(--muted)] gap-2 text-xs">
        <Loader2 size={14} className="animate-spin" />
        <span>Memeriksa sesi…</span>
      </div>
    );
  }

  if (!sesi.data) {
    return <LoginScreen />;
  }

  const sidebarActiveView =
    currentView === 'hydrant-cetak'
      ? 'hydrant'
      : currentView === 'apar-cetak'
        ? 'apar'
        : currentView === 'p3k-cetak'
          ? 'p3k'
          : currentView === 'patrol-cetak'
            ? 'patrol'
            : currentView;

  return (
    <div className="flex h-screen w-screen bg-[var(--bg-main)] text-[var(--primary)] overflow-hidden font-sans select-none">
      {/* 1. Left: Notion-Kit Sidebar */}
      <HseSidebar
        activeCategoryFilter={activeCategoryFilter}
        onSelectCategoryFilter={setActiveCategoryFilter}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        currentView={sidebarActiveView}
        onNavigateView={setCurrentView}
        namaPengguna={sesi.data.nama}
        onKeluar={() => keluar.mutate()}
        keluarBerjalan={keluar.isPending}
        isCollapsed={isCollapsed}
        onToggleCollapsed={toggleCollapsed}
      />

      {/* 2. Main Area */}
      {currentView === 'dashboard' ? (
        <>
          <main className="flex-1 flex flex-col h-screen overflow-y-auto px-6 py-4 bg-[var(--bg-main)]">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--border)]">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  {isCollapsed && <TombolPerluas onKlik={toggleCollapsed} />}
                  <span className="text-[var(--primary)] font-medium">
                    {lokasi.namaProyek}
                  </span>
                  <span className="text-[var(--muted)]">•</span>
                  <span className="text-[#2383e2] font-semibold">
                    {lokasi.siteName === 'Pabrik Utama' ? 'Kantor Pusat' : lokasi.siteName}
                  </span>
                </div>

                <h1 className="text-lg font-bold text-[var(--primary)] tracking-tight flex items-center gap-2 pt-1">
                  <span>Dashboard Digitalisasi Inspeksi K3 — Kantor Pusat</span>
                </h1>
              </div>
            </div>

            <div className="w-full">
              <HseCalendar
                currentDate={currentDate}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                onPrevMonth={handlePrevMonth}
                onNextMonth={handleNextMonth}
                onToday={handleToday}
                reports={reports}
                activeCategoryFilter={activeCategoryFilter}
                sites={lokasi.daftarLokasi}
                selectedSiteId={effectiveCalendarSite}
                onSelectSiteId={(sid) => {
                  setCalendarSiteFilter(sid);
                  if (sid !== 'ALL') lokasi.pilihLokasi(sid);
                }}
              />
            </div>

            <div className="mt-4">
              <PetaProyek />
            </div>
          </main>

          <MonthlyReportsPanel
            reports={
              effectiveCalendarSite === 'ALL'
                ? reports
                : reports.filter((r) => !r.siteId || r.siteId === effectiveCalendarSite)
            }
            selectedDate={selectedDate}
            onClearDateFilter={() => setSelectedDate(null)}
            activeCategoryFilter={activeCategoryFilter}
            onSelectCategoryFilter={setActiveCategoryFilter}
            onOpenReportDetail={setDetailReport}
            sedangMemuat={umpan.isFetching}
          />
        </>
      ) : currentView === 'hydrant-cetak' ? (
        <Suspense fallback={<HalamanMemuat />}>
          <HydrantPrintPreview
            bulan={bulanCetak}
            modeAwal={
              modeCetak === 'laporan'
                ? 'laporan'
                : modeCetak === 'semua'
                  ? 'semua'
                  : 'checklist'
            }
            autoPrint={autoPrint}
            onKembali={() => {
              bersihkanQueryCetak();
              setCurrentView('hydrant');
            }}
          />
        </Suspense>
      ) : currentView === 'hydrant' ? (
        <Suspense fallback={<HalamanMemuat />}>
          <HydrantPage
            onBack={() => setCurrentView('dashboard')}
            suntingRefId={bukaSunting}
            onSuntingSelesai={() => setBukaSunting(null)}
            isCollapsed={isCollapsed}
            onToggleCollapsed={toggleCollapsed}
          />
        </Suspense>
      ) : currentView === 'apar' ? (
        <Suspense fallback={<HalamanMemuat />}>
          <AparPage
            onBack={() => setCurrentView('dashboard')}
            suntingRefId={bukaSunting}
            onSuntingSelesai={() => setBukaSunting(null)}
            isCollapsed={isCollapsed}
            onToggleCollapsed={toggleCollapsed}
          />
        </Suspense>
      ) : currentView === 'apar-cetak' ? (
        <Suspense fallback={<HalamanMemuat />}>
          <AparPrintPreview
            bulan={bulanCetak}
            modeAwal={modeCetak === 'kartu' ? 'kartu' : 'bulanan'}
            unitAwal={unitCetak}
            tahunAwal={tahunCetak}
            autoPrint={autoPrint}
            onKembali={() => {
              bersihkanQueryCetak();
              setCurrentView('apar');
            }}
          />
        </Suspense>
      ) : currentView === 'p3k-cetak' ? (
        <Suspense fallback={<HalamanMemuat />}>
          <P3kPrintPreview
            tahun={tahunCetak}
            autoPrint={autoPrint}
            onKembali={() => {
              bersihkanQueryCetak();
              setCurrentView('p3k');
            }}
          />
        </Suspense>
      ) : currentView === 'p3k' ? (
        <Suspense fallback={<HalamanMemuat />}>
          <P3kPage
            isCollapsed={isCollapsed}
            onToggleCollapsed={toggleCollapsed}
          />
        </Suspense>
      ) : currentView === 'patrol-cetak' ? (
        <Suspense fallback={<HalamanMemuat />}>
          <PatrolPrintPreview
            bulan={bulanCetak}
            autoPrint={autoPrint}
            onKembali={() => {
              bersihkanQueryCetak();
              setCurrentView('patrol');
            }}
          />
        </Suspense>
      ) : (
        <Suspense fallback={<HalamanMemuat />}>
          <PatrolPage
            isCollapsed={isCollapsed}
            onToggleCollapsed={toggleCollapsed}
          />
        </Suspense>
      )}

      {/* 4. Inspection Record Detail Modal */}
      <ReportDetailModal
        report={detailReport}
        onClose={() => setDetailReport(null)}
        onEdit={(rep) => {
          setDetailReport(null);
          setBukaSunting({ kategori: rep.category.toLowerCase(), refId: rep.id });
          if (rep.category === 'HYDRANT') setCurrentView('hydrant');
          else if (rep.category === 'APAR') setCurrentView('apar');
          else if (rep.category === 'P3K') setCurrentView('p3k');
          else if (rep.category === 'SAFETY_PATROL') setCurrentView('patrol');
        }}
      />

      {import.meta.env.DEV && <Agentation endpoint="http://localhost:4747" />}
    </div>
  );
}

export function App() {
  return (
    <PenyediaLokasi>
      <AppIsi />
    </PenyediaLokasi>
  );
}

export default App;
