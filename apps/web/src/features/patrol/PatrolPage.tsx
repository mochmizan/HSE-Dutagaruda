import React, { useMemo, useState } from 'react';
import { Camera, Search } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { ConfirmModal } from '@/components/ui';
import { InspectionPageShell, KONFIG_PATROLI } from '@/features/inspeksi';
import { useKonteksLokasi } from '@/features/konteksLokasi';
import {
  petakanTemuanPatroli,
  useHapusTemuanPatroli,
  useLaporanPatroli,
  useUnggahFotoTemuanPatroli,
} from '@/services/api/queries';
import { AddPatrolFindingModal } from './AddPatrolFindingModal';
import { PatrolFeed } from './PatrolFeed';
import { PatrolPrintHeader, PatrolPrintSignatures } from './PatrolPrintChrome';
import { PatrolStats } from './PatrolStats';
import type { DrafFotoPatroli } from './types';
import type { ApiLaporanPatroli } from '@/services/api/klien';

interface PatrolPageProps {
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
}

/**
 * Patroli K3 — orkestrasi umpan foto per bulan. Semua hook + state hidup di
 * sini (pola `HydrantPage`); anak-anak (`PatrolStats`, `PatrolFeed`, modal)
 * presentasional.
 *
 * Poros = pengalih bulan bawaan shell (posisi Hydrant: `Bulan Ini` →
 * `MonthSwitcher`); umpan disaring ke bulan terpilih, terbaru dulu. API
 * patroli tidak membawa status terbit, jadi `Terbitkan` = simpan tanpa
 * cerminan status kedua. Hapus lewat `ConfirmModal`, bukan hover langsung.
 */
export const PatrolPage: React.FC<PatrolPageProps> = ({ isCollapsed, onToggleCollapsed }) => {
  const lokasi = useKonteksLokasi();
  const qc = useQueryClient();
  const laporanQuery = useLaporanPatroli();
  const unggahFoto = useUnggahFotoTemuanPatroli();
  const hapusTemuan = useHapusTemuanPatroli();

  // Poros bulan = bulan kalender nyata, sama seperti Hydrant.
  const [bulan, setBulan] = useState<Date>(() => {
    const kini = new Date();
    return new Date(kini.getFullYear(), kini.getMonth(), 1);
  });
  const handleResetBulan = () => {
    const kini = new Date();
    setBulan(new Date(kini.getFullYear(), kini.getMonth(), 1));
  };
  const periode = format(bulan, 'yyyy-MM');
  const labelBulan = format(bulan, 'MMMM yyyy', { locale: idLocale });
  const isBulanIni = (() => {
    const kini = new Date();
    return bulan.getFullYear() === kini.getFullYear() && bulan.getMonth() === kini.getMonth();
  })();

  // Saring caption + lokasi kerja (catatan unggahan + kop cetak).
  const [cari, setCari] = useState('');
  const [lokasiInput, setLokasiInput] = useState('');
  const lokasiKerja = lokasiInput.trim() || lokasi.siteName;

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [konfirmasiHapusId, setKonfirmasiHapusId] = useState<string | null>(null);

  // Temuan dari API (laporan + findings) — lokasi aktif saja.
  const laporanSite = useMemo(
    () => (laporanQuery.data ?? []).filter((l) => l.siteId === lokasi.siteId),
    [laporanQuery.data, lokasi.siteId],
  );
  const findings = useMemo(() => petakanTemuanPatroli(laporanSite), [laporanSite]);

  // Umpan bulan terpilih, terbaru dulu.
  const umpanBulan = useMemo(
    () =>
      findings
        .filter((f) => f.tanggal.startsWith(periode))
        .sort((a, b) => b.tanggal.localeCompare(a.tanggal)),
    [findings, periode],
  );

  // Saring caption tetap di dalam bulan terpilih.
  const tampil = useMemo(() => {
    const q = cari.trim().toLowerCase();
    if (!q) return umpanBulan;
    return umpanBulan.filter((f) => f.caption.toLowerCase().includes(q));
  }, [umpanBulan, cari]);

  // Laporan terbaru (rekam patroli tersimpan) — jangkar ekspor PDF.
  const laporanTerbaru: ApiLaporanPatroli | null = useMemo(() => {
    const daftar = [...laporanSite].sort((a, b) => b.patrolDate.localeCompare(a.patrolDate));
    return daftar[0] ?? null;
  }, [laporanSite]);

  const handleAdd = (draf: DrafFotoPatroli) => {
    if (!lokasi.siteId) {
      window.alert('Lokasi belum dipilih. Pilih lokasi dahulu.');
      return;
    }
    unggahFoto.mutate(
      {
        siteId: lokasi.siteId,
        patrolDate: draf.tanggal,
        file: draf.file,
        description: draf.caption,
        locationNote: lokasiKerja || undefined,
      },
      { onSuccess: () => setIsAddOpen(false) },
    );
  };

  const handleKonfirmasiHapus = () => {
    if (!konfirmasiHapusId) return;
    const id = konfirmasiHapusId;
    setKonfirmasiHapusId(null);
    // Hook sudah invalidasi `laporan-patroli` saat settle; umpan kalender
    // ikut disegarkan di sini (kontrak mutasi: laporan + ['umpan']).
    hapusTemuan.mutate(id, {
      onSettled: () => {
        void qc.invalidateQueries({ queryKey: ['umpan'] });
      },
    });
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
      onResetBulan={handleResetBulan}
      onPilihBulan={setBulan}
      onTambah={() => setIsAddOpen(true)}
      ikonTambah={<Camera size={13} strokeWidth={2.2} />}
      jangkarEkspor={laporanTerbaru?.id ?? null}
      namaBerkas={laporanTerbaru?.patrolDate.slice(0, 10) ?? periode}
      onCetak={() => window.print()}
      kepalaCetak={
        <PatrolPrintHeader
          lokasi={lokasiKerja}
          labelBulan={labelBulan}
          tanggalTerbaru={umpanBulan[0]?.tanggal ?? ''}
        />
      }
      statistik={<PatrolStats total={findings.length} bulanIni={umpanBulan.length} labelBulan={labelBulan} />}
      saring={
        <div className="no-print flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pb-3 mb-3 border-b border-[var(--border)]">
          <p className="text-xs text-[var(--muted)]">
            Menampilkan{' '}
            <span className="font-bold text-[var(--primary)] tabular-nums">{tampil.length}</span>{' '}
            dari <span className="tabular-nums">{umpanBulan.length}</span> foto — {labelBulan}
          </p>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="relative min-w-[170px] flex-1 sm:flex-initial">
              <Search
                size={12}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"
              />
              <input
                type="text"
                placeholder="Cari keterangan foto…"
                value={cari}
                onChange={(e) => setCari(e.target.value)}
                aria-label="Cari keterangan foto"
                className="w-full pl-7 pr-2.5 py-1.5 text-xs bg-[var(--bg-main)] border border-[var(--border)] rounded-[4px] text-[var(--primary)] placeholder-[var(--muted)] focus:outline-none focus:border-[#2f80ed]"
              />
            </div>
            <input
              type="text"
              value={lokasiInput}
              onChange={(e) => setLokasiInput(e.target.value)}
              placeholder={lokasi.siteName}
              aria-label="Lokasi Kerja"
              title="Lokasi kerja untuk unggahan dan kop cetak"
              className="min-w-[150px] flex-1 sm:flex-initial text-xs px-2.5 py-1.5 rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] placeholder-[var(--muted)] focus:outline-none focus:border-[#2f80ed]"
            />
          </div>
        </div>
      }
      isi={
        <div className="space-y-3 pb-8 flex-1">
          <PatrolFeed findings={tampil} totalBulan={umpanBulan.length} onHapus={setKonfirmasiHapusId} />
        </div>
      }
      tandaTangan={<PatrolPrintSignatures />}
      modals={
        <>
          <AddPatrolFindingModal
            isOpen={isAddOpen}
            onClose={() => setIsAddOpen(false)}
            onAddFinding={handleAdd}
            isMenyimpan={unggahFoto.isPending}
          />
          <ConfirmModal
            isOpen={konfirmasiHapusId !== null}
            title="Hapus Foto Patroli"
            message="Foto patroli ini beserta keterangannya akan dihapus permanen. Lanjutkan?"
            confirmLabel="Ya, hapus"
            accent="#eb5757"
            onClose={() => setKonfirmasiHapusId(null)}
            onConfirm={handleKonfirmasiHapus}
          />
        </>
      }
    />
  );
};
