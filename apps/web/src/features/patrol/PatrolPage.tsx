import React, { useMemo, useState } from 'react';
import { ArrowLeft, Camera, Printer } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { AddPatrolFindingModal } from './AddPatrolFindingModal';
import {
  petakanTemuanPatroli,
  useLaporanPatroli,
  useUnggahFotoTemuanPatroli,
  useHapusTemuanPatroli,
} from '@/services/api/queries';
import { useKonteksLokasi } from '@/features/konteksLokasi';
import { PhotoCard, EmptyState, UnduhPdfButton } from '@/components/ui';
import { TombolPerluas } from '@/features/navigation';
import type { ApiLaporanPatroli } from '@/services/api/klien';

interface PatrolPageProps {
  onBack: () => void;
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
}

const hariIni = () => new Date();

function fmtTanggal(iso: string): string {
  if (!iso) return '–';
  try {
    return format(parseISO(iso), 'd MMMM yyyy', { locale: idLocale });
  } catch {
    return iso;
  }
}

/**
 * Patroli K3 — single photo feed.
 * Reuses the Hydrant Section B card grid. Newest first. UI-only.
 */
export const PatrolPage: React.FC<PatrolPageProps> = ({ onBack, isCollapsed, onToggleCollapsed }) => {
  const lokasi = useKonteksLokasi();
  const laporanQuery = useLaporanPatroli();
  const unggahFoto = useUnggahFotoTemuanPatroli();
  const hapusTemuan = useHapusTemuanPatroli();

  const [lokasiInput, setLokasiInput] = useState('ITJ JPM Dukuh Atas');
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Temuan dari API (laporan + findings), terbaru lebih dulu — lokasi aktif saja.
  const laporanSite = useMemo(
    () => (laporanQuery.data ?? []).filter((l) => l.siteId === lokasi.siteId),
    [laporanQuery.data, lokasi.siteId],
  );
  const findings = useMemo(
    () => petakanTemuanPatroli(laporanSite),
    [laporanSite],
  );

  // Laporan terbaru (rekam patroli tersimpan) — jangkar ekspor PDF.
  const laporanTerbaru: ApiLaporanPatroli | null = useMemo(() => {
    const daftar = laporanSite;
    return [...daftar].sort((a, b) => b.patrolDate.localeCompare(a.patrolDate))[0] ?? null;
  }, [laporanSite]);

  const sorted = useMemo(
    () => [...findings].sort((a, b) => b.tanggal.localeCompare(a.tanggal)),
    [findings]
  );

  const monthCount = useMemo(() => {
    const prefix = hariIni().toISOString().slice(0, 7);
    return findings.filter((f) => f.tanggal.startsWith(prefix)).length;
  }, [findings]);

  const handleAdd = (draft: { file: File; caption: string; tanggal: string }) => {
    if (!lokasi.siteId) return;
    unggahFoto.mutate(
      {
        siteId: lokasi.siteId,
        patrolDate: draft.tanggal,
        file: draft.file,
        description: draft.caption,
        locationNote: lokasiInput || undefined,
      },
      { onSuccess: () => setIsAddOpen(false) },
    );
  };

  const handleDelete = (id: string) => {
    hapusTemuan.mutate(id);
  };

  return (
    <main className="flex-1 flex flex-col h-screen overflow-y-auto px-6 py-4 bg-[var(--bg-main)]">
      {/* Top bar */}
      <div className="no-print flex items-center justify-between gap-2 pb-3 mb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2 min-w-0">
          {isCollapsed && <TombolPerluas onKlik={onToggleCollapsed} />}
          <button
            type="button"
            onClick={onBack}
            aria-label="Kembali"
            className="p-1.5 rounded-[4px] text-[var(--muted)] hover:bg-[var(--bg-hover)] pressable cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-lg font-bold text-[var(--primary)] tracking-tight truncate">
            Patroli K3
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#2f80ed] rounded-[4px] hover:brightness-95 pressable cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Camera size={13} strokeWidth={2.2} /> Tambah Foto
          </button>
          <UnduhPdfButton
            category="patrol-report"
            refId={laporanTerbaru?.id ?? null}
            namaBerkas={laporanTerbaru?.patrolDate.slice(0, 10)}
          />
          <button
            type="button"
            onClick={() => window.print()}
            title="Cetak lembar laporan ke printer atau simpan sebagai PDF"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-[var(--border)] text-[var(--secondary)] rounded-[4px] hover:bg-[var(--bg-hover)] pressable cursor-pointer"
          >
            <Printer size={13} /> Cetak
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="no-print grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Total Foto', value: String(findings.length) },
          { label: 'Foto Bulan Ini', value: String(monthCount) },
          { label: 'Lokasi Kerja', value: lokasiInput || '–' },
        ].map((s) => (
          <div
            key={s.label}
            className="px-3 py-2.5 rounded-[6px] border border-[var(--border)] bg-[var(--bg-sidebar)]/60 min-w-0"
          >
            <p className="text-xl font-bold tabular-nums text-[var(--primary)] truncate">{s.value}</p>
            <p className="text-[10px] text-[var(--muted)] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Paper header */}
      <div className="bg-white dark:bg-[var(--bg-main)] print:bg-white">
        <div className="text-center print:text-black">
          <h2 className="text-base font-bold text-[var(--primary)] print:text-black tracking-tight">
            LAPORAN KEGIATAN
          </h2>
          <p className="text-sm font-bold text-[var(--primary)] print:text-black tracking-tight">
            SAFETY PATROL
          </p>
          <p className="mt-1 text-xs font-semibold text-[var(--secondary)] print:text-black">
            <input
              value={lokasiInput}
              onChange={(e) => setLokasiInput(e.target.value)}
              aria-label="Lokasi Kerja"
              className="no-print w-52 text-center bg-transparent border-b border-[var(--border)] focus:outline-none focus:border-[#2f80ed] px-1"
            />
            <span className="hidden print:inline">{lokasiInput}</span>
          </p>
          <p className="text-[11px] text-[var(--muted)] print:text-black tabular-nums">
            {sorted.length > 0 ? fmtTanggal(sorted[0].tanggal) : '–'}
          </p>
        </div>
        <p className="no-print text-[11px] text-[var(--muted)] mt-1.5 mb-2">
          Satu umpan foto, terbaru di atas. Klik “Tambah Foto” untuk menambah dokumentasi.
        </p>

        {/* Photo grid (Hydrant Section B pattern) */}
        {sorted.length === 0 ? (
          <div className="no-print">
            <EmptyState
              icon={<Camera size={24} />}
              title="Belum ada foto patroli"
              hint="Klik tombol “Tambah Foto” untuk menambah dokumentasi lapangan."
            />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto w-full px-2 sm:px-4">
            <div
              className="grid grid-cols-1 sm:grid-cols-2 gap-y-10 sm:gap-y-12 print:max-w-none print:grid-cols-2 print:gap-x-24 print:gap-y-10"
              style={{ columnGap: 'clamp(3.5rem, 7vw, 6.5rem)' }}
            >
              {sorted.map((finding) => (
                <div key={finding.id} className="flex flex-col items-center">
                  <PhotoCard
                    imageUrl={finding.photoUrl}
                    caption={finding.caption}
                    onDelete={() => handleDelete(finding.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <AddPatrolFindingModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAddFinding={handleAdd}
        isMenyimpan={unggahFoto.isPending}
      />
    </main>
  );
};
