import React, { useState, useEffect, lazy, Suspense } from 'react';
import { flushSync } from 'react-dom';
import { addMonths, subMonths, format } from 'date-fns';
import { MapPin, Loader2 } from 'lucide-react';
import { HseSidebar } from '@/features/navigation';
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

  // Angka lokasi aktif untuk panel Detail Lokasi (unit/kotak terdaftar).
  const unitHidranSite = (unitHidran.data ?? []).filter((u) => u.siteId === lokasi.siteId);
  const unitAparSite = (unitApar.data ?? []).filter((u) => u.siteId === lokasi.siteId);
  const kotakP3kSite = (kotakP3k.data ?? []).filter((b) => b.siteId === lokasi.siteId);

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
        siteName={lokasi.siteName}
        clientName={lokasi.clientName}
        namaPengguna={sesi.data.nama}
        onKeluar={() => keluar.mutate()}
        keluarBerjalan={keluar.isPending}
      />

      {/* 2. Main Area: Toggle between Calendar Dashboard and Category Specific Pages (e.g. Hydrant, APAR) */}
      {currentView === 'dashboard' ? (
        <>
          {/* Center: Main Inspection Area (Calendar + 4 PRD Squares) */}
          <main className="flex-1 flex flex-col h-screen overflow-y-auto px-6 py-4 bg-[var(--bg-main)]">
            {/* Top Breadcrumb & Site Meta */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border)]">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                  <span className="hover:text-[var(--primary)] cursor-pointer">
                    {lokasi.clientName}
                  </span>
                  <span>/</span>
                  <span className="text-[var(--primary)] font-medium">
                    {lokasi.siteName}
                  </span>
                </div>

                <h1 className="text-lg font-bold text-[var(--primary)] tracking-tight flex items-center gap-2">
                  <span>Dashboard Digitalisasi Inspeksi K3</span>
                </h1>

                <div className="flex items-center gap-1 text-[11px] text-[var(--muted)]">
                  <MapPin size={12} />
                  <span>{lokasi.address}</span>
                </div>
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

            {/* Detail Lokasi Aktif (pengganti 4 kartu KPI) */}
            <div className="w-full mt-3 p-4 border border-[var(--border)] rounded-[6px] bg-[var(--bg-sidebar)] shadow-xs">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-[6px] bg-[#2383e2]/15 text-[#2383e2] flex items-center justify-center flex-shrink-0">
                  <MapPin size={18} />
                </span>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-[var(--primary)] tracking-tight truncate">
                    {lokasi.siteName}
                  </h2>
                  <p className="text-xs text-[var(--muted)] truncate">
                    {lokasi.address} — {lokasi.clientName}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                <div className="px-2.5 py-2 rounded-[4px] bg-[var(--bg-main)] border border-[var(--border)]">
                  <div className="text-lg font-bold font-mono text-[var(--primary)] tabular-nums">
                    {lokasi.zonaNamaList.length}
                  </div>
                  <div className="text-[11px] text-[var(--muted)]">Zona Terpantau</div>
                </div>
                <div className="px-2.5 py-2 rounded-[4px] bg-[var(--bg-main)] border border-[var(--border)]">
                  <div className="text-lg font-bold font-mono text-[#eb5757] tabular-nums">
                    {unitHidranSite.length}
                  </div>
                  <div className="text-[11px] text-[var(--muted)]">Unit Hydrant</div>
                </div>
                <div className="px-2.5 py-2 rounded-[4px] bg-[var(--bg-main)] border border-[var(--border)]">
                  <div className="text-lg font-bold font-mono text-[#f2994a] tabular-nums">
                    {unitAparSite.length}
                  </div>
                  <div className="text-[11px] text-[var(--muted)]">Unit APAR</div>
                </div>
                <div className="px-2.5 py-2 rounded-[4px] bg-[var(--bg-main)] border border-[var(--border)]">
                  <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {kotakP3kSite.length}
                  </div>
                  <div className="text-[11px] text-[var(--muted)]">Kotak P3K</div>
                </div>
              </div>
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
          />
        </Suspense>
      ) : currentView === 'apar' ? (
        <Suspense fallback={<HalamanMemuat />}>
          <AparPage
            onBack={() => setCurrentView('dashboard')}
            suntingRefId={bukaSunting}
            onSuntingSelesai={() => setBukaSunting(null)}
          />
        </Suspense>
      ) : currentView === 'p3k' ? (
        <Suspense fallback={<HalamanMemuat />}>
          <P3kPage onBack={() => setCurrentView('dashboard')} />
        </Suspense>
      ) : (
        <Suspense fallback={<HalamanMemuat />}>
          <PatrolPage onBack={() => setCurrentView('dashboard')} />
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
