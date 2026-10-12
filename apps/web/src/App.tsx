import React, { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { addMonths, subMonths, format } from 'date-fns';
import { MapPin, Loader2 } from 'lucide-react';
import { HseSidebar } from '@/features/navigation';
import { LoginScreen, useSesi, useKeluar } from '@/features/auth';
import { PenyediaLokasi, useKonteksLokasi } from '@/features/konteksLokasi';
import { HseCalendar } from '@/features/calendar';
import { KpiGrid } from '@/features/kpi';
import { MonthlyReportsPanel, ReportDetailModal } from '@/features/reports';
import { HydrantPage } from '@/features/hydrant';
import { AparPage } from '@/features/apar';
import { P3kPage } from '@/features/p3k';
import { PatrolPage } from '@/features/patrol';import { useUmpan, petakanUmpanKeLaporan, useUnitHidran, useUnitApar, useKotakP3k } from '@/services/api/queries';
import { InspectionCategory, InspectionReport } from '@/types';
import { Agentation } from 'agentation';

type AppView = 'dashboard' | 'hydrant' | 'apar' | 'p3k' | 'patrol';

function AppIsi() {
  const sesi = useSesi();
  const keluar = useKeluar();
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<InspectionCategory | 'ALL'>('ALL');

  const [detailReport, setDetailReport] = useState<InspectionReport | null>(null);

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

  // Angka KPI dari data nyata bulan kalender yang ditampilkan.
  const statusText = (adaOverall: boolean, rows: Array<unknown>) => {
    if (rows.length === 0) return 'Belum Ada Data';
    if (!adaOverall) return 'Terpantau Berkala';
    return (rows as Array<{ overallStatus: string }>).every((r) => r.overallStatus === 'LAYAK')
      ? 'Semua Layak'
      : 'Perlu Tindak Lanjut';
  };
  const umpanHidran = umpan.data?.hidran ?? [];
  const umpanApar = umpan.data?.apar ?? [];
  const umpanP3k = umpan.data?.p3k ?? [];
  const umpanPatroli = umpan.data?.patroli ?? [];
  const kpiHidran = {
    nilai: `${umpanHidran.length}/${(unitHidran.data ?? []).length}`,
    badge: `${Math.max((unitHidran.data ?? []).length - umpanHidran.length, 0)} Berjalan`,
    subtext: 'Unit wajib diperiksa bulan ini',
    statusText: statusText(true, umpanHidran),
  };
  const kpiApar = {
    nilai: `${umpanApar.length}/${(unitApar.data ?? []).length}`,
    badge: `${(unitApar.data ?? []).length} Unit`,
    subtext: 'Pemeriksaan 7 komponen bulan ini',
    statusText: statusText(true, umpanApar),
  };
  const kpiP3k = {
    nilai: `${umpanP3k.length} Kotak`,
    badge: (kotakP3k.data ?? []).length > 0 ? `${(kotakP3k.data ?? []).length} Terdaftar` : 'Belum Ada',
    subtext: 'Pemeriksaan 21 item standar',
    statusText: statusText(false, umpanP3k),
  };
  const kpiPatroli = {
    nilai: String(umpanPatroli.length),
    badge: `${umpanPatroli.length} Putaran`,
    subtext: 'Dokumentasi temuan lapangan',
    statusText: statusText(false, umpanPatroli),
  };

  // Hitungan badge APAR: unit mendekati kedaluwarsa (≤90 hari, dari unit terdaftar).
  const aparExpiryCount = (unitApar.data ?? []).filter(
    (u) => Math.ceil((new Date(`${u.expiredDate}T00:00:00`).getTime() - Date.now()) / 86_400_000) <= 90
  ).length;

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
        aparOpenCount={aparExpiryCount}
        hydrantUnitCount={(unitHidran.data ?? []).length}
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

            {/* 4 Category KPI Cards Under Calendar */}
            <div className="w-full">
              <KpiGrid
                hidran={kpiHidran}
                apar={kpiApar}
                p3k={kpiP3k}
                patroli={kpiPatroli}
                onSelectCategory={setActiveCategoryFilter}
                onOpenCategoryPage={(category) => {
                  if (category === 'HYDRANT') {
                    setCurrentView('hydrant');
                  } else if (category === 'APAR') {
                    setCurrentView('apar');
                  } else if (category === 'P3K') {
                    setCurrentView('p3k');
                  } else if (category === 'SAFETY_PATROL') {
                    setCurrentView('patrol');
                  }
                }}
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
        <HydrantPage onBack={() => setCurrentView('dashboard')} />
      ) : currentView === 'apar' ? (
        <AparPage onBack={() => setCurrentView('dashboard')} />
      ) : currentView === 'p3k' ? (
        <P3kPage onBack={() => setCurrentView('dashboard')} />
      ) : (
        <PatrolPage onBack={() => setCurrentView('dashboard')} />
      )}

      {/* 4. Inspection Record Detail Modal */}
      <ReportDetailModal
        report={detailReport}
        onClose={() => setDetailReport(null)}
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
