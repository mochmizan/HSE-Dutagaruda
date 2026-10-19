import React, { useState, useEffect, lazy, Suspense } from 'react';
import { flushSync } from 'react-dom';
import { addMonths, subMonths, format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { HseSidebar, TombolPerluas } from '@/features/navigation';
import { LoginScreen, useSesi, useKeluar } from '@/features/auth';
import { PenyediaLokasi, useKonteksLokasi } from '@/features/konteksLokasi';
import { HseCalendar } from '@/features/calendar';
import { MonthlyReportsPanel, ReportDetailModal } from '@/features/reports';
import { useUmpan, petakanUmpanKeLaporan, useUnitHidran, useUnitApar, useKotakP3k } from '@/services/api/queries';
import { InspectionCategory, InspectionReport } from '@/types';
import { Agentation } from 'agentation';

type AppView = 'dashboard' | 'hydrant' | 'apar' | 'p3k' | 'patrol';

const hariIni = () => new Date();

function HalamanMemuat() {
  return (
    <div className="flex-1 flex items-center justify-center gap-2 text-xs text-[var(--muted)]">
      <Loader2 size={14} className="animate-spin" />
      <span>Memuat halaman…</span>
    </div>
  );
}

// Halaman fitur dipecah per chunk agar bundel utama tetap di bawah batas.
const HydrantPage = lazy(() => import('@/features/hydrant').then((m) => ({ default: m.HydrantPage })));
const AparPage = lazy(() => import('@/features/apar').then((m) => ({ default: m.AparPage })));
const P3kPage = lazy(() => import('@/features/p3k').then((m) => ({ default: m.P3kPage })));
const PatrolPage = lazy(() => import('@/features/patrol').then((m) => ({ default: m.PatrolPage })));

function AppIsi() {
  const sesi = useSesi();
  const keluar = useKeluar();
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const toggleCollapsed = () => setIsCollapsed((v) => !v);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [currentDate, setCurrentDate] = useState<Date>(() => hariIni());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<InspectionCategory | 'ALL'>('ALL');

  const [detailReport, setDetailReport] = useState<InspectionReport | null>(null);
  /** Permintaan sunting dari dasbor: kategori + id rekam inspeksi yang akan dibuka. */
  const [bukaSunting, setBukaSunting] = useState<{ kategori: string | null; refId: string } | null>(
    null,
  );

  const lokasi = useKonteksLokasi();  const monthKey = format(currentDate, 'yyyy-MM');
  const umpan = useUmpan(monthKey);
  const unitHidran = useUnitHidran();
  const unitApar = useUnitApar();
  const kotakP3k = useKotakP3k();

  const reports = petakanUmpanKeLaporan(umpan.data, {
    zonaNama: lokasi.zonaIdKeNama,
    unitHidran: new Map((unitHidran.data ?? []).map((u) => [u.id, u])),
    unitApar: new Map((unitApar.data ?? []).map((u) => [u.id, u])),
    kotakP3k: new Map((kotakP3k.data ?? []).map((b) => [b.id, b])),
  });

  // Sync dark class on document element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

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

  return (
    <div className="flex h-screen w-screen bg-[var(--bg-main)] text-[var(--primary)] overflow-hidden font-sans select-none">
      {/* 1. Left: Notion-Kit Sidebar */}
      <HseSidebar
        activeCategoryFilter={activeCategoryFilter}
        onSelectCategoryFilter={setActiveCategoryFilter}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        currentView={currentView}
        onNavigateView={setCurrentView}
        namaPengguna={sesi.data.nama}
        onKeluar={() => keluar.mutate()}
        keluarBerjalan={keluar.isPending}
        isCollapsed={isCollapsed}
        onToggleCollapsed={toggleCollapsed}
      />

      {/* 2. Main Area: Toggle between Calendar Dashboard and Category Specific Pages (e.g. Hydrant, APAR) */}
      {currentView === 'dashboard' ? (
        <>
          {/* Center: Main Inspection Area (Calendar + 4 PRD Squares) */}
          <main className="flex-1 flex flex-col h-screen overflow-y-auto px-6 py-4 bg-[var(--bg-main)]">
            {/* Top Breadcrumb & Site Meta */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--border)]">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  {isCollapsed && <TombolPerluas onKlik={toggleCollapsed} />}
                  <span className="text-[var(--primary)] font-medium">
                    {lokasi.namaProyek}
                  </span>
                </div>

                <h1 className="text-lg font-bold text-[var(--primary)] tracking-tight flex items-center gap-2 pt-1">
                  <span>Dashboard Digitalisasi Inspeksi K3</span>
                </h1>
              </div>
            </div>

            {/* Calendar View ("not all the way" - compact month grid) */}
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
              />
            </div>
          </main>

          {/* Right: Monthly Report List Panel */}
          <MonthlyReportsPanel
            reports={reports}
            selectedDate={selectedDate}
            onClearDateFilter={() => setSelectedDate(null)}
            activeCategoryFilter={activeCategoryFilter}
            onSelectCategoryFilter={setActiveCategoryFilter}
            onOpenReportDetail={setDetailReport}
            sedangMemuat={umpan.isFetching}
          />
        </>
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
      ) : currentView === 'p3k' ? (
        <Suspense fallback={<HalamanMemuat />}>
          <P3kPage
          onBack={() => setCurrentView('dashboard')}
          isCollapsed={isCollapsed}
          onToggleCollapsed={toggleCollapsed}
        />
        </Suspense>
      ) : (
        <Suspense fallback={<HalamanMemuat />}>
          <PatrolPage
          onBack={() => setCurrentView('dashboard')}
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
          // Sunting dari dasbor: pindah ke halaman kategori lalu buka modal inspeksi rekam nyata.
          setDetailReport(null);
          setBukaSunting({ kategori: rep.category.toLowerCase(), refId: rep.id });
          if (rep.category === 'HYDRANT') setCurrentView('hydrant');
          else if (rep.category === 'APAR') setCurrentView('apar');
          else if (rep.category === 'P3K') setCurrentView('p3k');
          else if (rep.category === 'SAFETY_PATROL') setCurrentView('patrol');
        }}
      />

      {/* 6. Agentation Visual Feedback Toolbar */}
      {(import.meta.env?.DEV || (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development')) && (
        <Agentation endpoint="http://localhost:4747" />
      )}
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
