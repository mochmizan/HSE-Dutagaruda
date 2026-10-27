import React, { useMemo, useState } from 'react';
import { Camera } from 'lucide-react';
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
import { PhotoCard, EmptyState } from '@/components/ui';
import { KartuStatistik } from '@/features/pageChrome';
import { InspectionPageShell, KONFIG_PATROLI } from '@/features/inspeksi';
import type { ApiLaporanPatroli } from '@/services/api/klien';

interface PatrolPageProps {
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
}

const bulanLabel = (d: Date) => format(d, 'MMMM yyyy', { locale: idLocale });

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
export const PatrolPage: React.FC<PatrolPageProps> = ({ isCollapsed, onToggleCollapsed }) => {
  const lokasi = useKonteksLokasi();
  const laporanQuery = useLaporanPatroli();
  const unggahFoto = useUnggahFotoTemuanPatroli();
  const hapusTemuan = useHapusTemuanPatroli();

  const [lokasiInput, setLokasiInput] = useState('ITJ JPM Dukuh Atas');
  const [isAddOpen, setIsAddOpen] = useState(false);
  // Bulan acuan = bulan kalender nyata, sama seperti halaman Hydrant. Umpan
  // disaring ke bulan terpilih supaya poros kanan atas berperilaku identik.
  const [bulan, setBulan] = useState<Date>(() => {
    const kini = new Date();
    return new Date(kini.getFullYear(), kini.getMonth(), 1);
  });
  const resetBulan = () => {
    const kini = new Date();
    setBulan(new Date(kini.getFullYear(), kini.getMonth(), 1));
  };
  const periode = format(bulan, 'yyyy-MM');
  const isBulanIni = (() => {
    const kini = new Date();
    return bulan.getFullYear() === kini.getFullYear() && bulan.getMonth() === kini.getMonth();
  })();

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
    () =>
      findings
        .filter((f) => f.tanggal.startsWith(periode))
        .sort((a, b) => b.tanggal.localeCompare(a.tanggal)),
    [findings, periode]
  );

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
    <InspectionPageShell
      config={KONFIG_PATROLI}
      namaProyek={lokasi.namaProyek}
      siteName={lokasi.siteName}
      isCollapsed={isCollapsed}
      onToggleCollapsed={onToggleCollapsed}
      bulan={bulan}
      tampilkanReset={!isBulanIni}
      onResetBulan={resetBulan}
      onPilihBulan={setBulan}
      onTambah={() => setIsAddOpen(true)}
      ikonTambah={<Camera size={13} strokeWidth={2.2} />}
      jangkarEkspor={laporanTerbaru?.id ?? null}
      namaBerkas={laporanTerbaru?.patrolDate.slice(0, 10)}
      onCetak={() => window.print()}
      statistik={
        <div className="no-print grid grid-cols-2 gap-3 mb-4">
          <KartuStatistik
            nada="netral"
            judul="Total Foto Terdaftar"
            nilai={findings.length}
            satuan="Foto"
            rincian={`${bulanLabel(bulan)} dipilih`}
            ikon="📷"
            kaki="Dokumentasi seluruh periode"
          />
          <KartuStatistik
            nada="hijau"
            judul="Foto Bulan Ini"
            nilai={sorted.length}
            satuan="Foto"
            rincian={`dari ${findings.length} foto terdaftar`}
            ikon="✅"
            lencana="Terbaru"
            kaki="Umpan bulan terpilih"
            isi={
              <div className="mt-2">
                <div className="flex h-1.5 rounded-full overflow-hidden bg-emerald-500/15">
                  <div
                    className="bg-emerald-500"
                    style={{
                      width: `${findings.length ? Math.round((sorted.length / findings.length) * 100) : 0}%`,
                    }}
                  />
                </div>
                <div className="mt-1.5 text-[10px] text-[var(--muted)] tabular-nums">
                  {findings.length ? Math.round((sorted.length / findings.length) * 100) : 0}% foto
                  ada di bulan ini
                </div>
              </div>
            }
          />
        </div>
      }
      isi={
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
      }
      modals={
        <AddPatrolFindingModal
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          onAddFinding={handleAdd}
          isMenyimpan={unggahFoto.isPending}
        />
      }
    />
  );
};
