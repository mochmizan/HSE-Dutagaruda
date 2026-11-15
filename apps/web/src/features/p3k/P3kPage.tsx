import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { STANDARD_P3K_ITEMS } from '../../lib/p3kItems';
import { P3kInspectionModal } from './P3kInspectionModal';
import { P3kKepala } from './P3kKepala';
import { P3kPrintHeader, P3kPrintSignatures } from './P3kPrintChrome';
import { P3kStatistik } from './P3kStatistik';
import { P3kTabel } from './P3kTabel';
import { petakanGridP3k } from './petaApi';
import {
  useKotakP3k,
  useBuatKotakP3k,
  useInspeksiP3k,
  useSimpanInspeksiP3k,
  useUbahButirP3k,
  useUbahInspeksiP3k,
  useHapusInspeksiP3k,
} from '@/services/api/queries';
import { ambilButirP3k } from '@/services/api/klien';
import { useKonteksLokasi } from '@/features/konteksLokasi';
import { InspectionPageShell, KONFIG_P3K } from '@/features/inspeksi';
import { YearSwitcher } from '@/components/ui';
import {
  MONTH_KEYS,
  MONTH_NAMES,
  emptyMonth,
  isMonthFilled,
  markFor,
  type P3kMonthData,
  type P3kYearGrid,
} from './types';

interface P3kPageProps {
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
}

/** Saring baris grid: semua item, yang kurang, atau yang kadaluarsa. */
type TabP3k = 'SEMUA' | 'KURANG' | 'KADALUARSA';

/** Status terburuk satu baris item selama setahun: KD > kurang > baik. */
function statusBaris(itemId: number, standardQty: number, grid: P3kYearGrid): 'kd' | 'kurang' | 'baik' {
  let adaKurang = false;
  for (const m of MONTH_KEYS) {
    const mark = markFor(itemId, standardQty, grid[m]);
    if (mark === 'kd') return 'kd';
    if (mark === 'kurang') adaKurang = true;
  }
  return adaKurang ? 'kurang' : 'baik';
}

const KELAS_TAB_P3K = (aktif: boolean) =>
  `py-1.5 px-3 rounded-[4px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 pressable ${
    aktif
      ? 'bg-white dark:bg-[var(--bg-hover)] text-[var(--primary)] font-semibold shadow-xs'
      : 'text-[var(--secondary)] hover:text-[var(--primary)]'
  }`;

/**
 * Inspeksi Kotak P3K — yearly grid only.
 * Box is keyed by site name (one box per site). Empty start; month click opens the input form.
 *
 * Orkestrasi di sini (semua hook + hitung + simpan); anak-anak presentasional.
 */
export const P3kPage: React.FC<P3kPageProps> = ({ isCollapsed, onToggleCollapsed }) => {
  const lokasi = useKonteksLokasi();
  const kotakQuery = useKotakP3k();
  const inspeksiQuery = useInspeksiP3k();
  const buatInspeksi = useSimpanInspeksiP3k();
  const ubahInspeksi = useUbahInspeksiP3k();
  const ubahButir = useUbahButirP3k();
  const hapusInspeksi = useHapusInspeksiP3k();
  const buatKotak = useBuatKotakP3k();

  // Tahun berjalan, bukan tahun yang dipatok: grid tahunan harus membuka tahun
  // ini tanpa perlu diklik dua kali setiap Januari.
  const [year, setYear] = useState(() => String(new Date().getFullYear()));
  const [unitKerja, setUnitKerja] = useState('HSE');
  const [lokasiKerja, setLokasiKerja] = useState('ITJ JPM Dukuh Atas');
  const [activeMonth, setActiveMonth] = useState<string | null>(null);
  const [tabP3k, setTabP3k] = useState<TabP3k>('SEMUA');
  const [cariItem, setCariItem] = useState('');

  // Kotak lokasi aktif (satu kotak per lokasi, sesuai kontrak halaman).
  const kotak = (kotakQuery.data ?? []).find((b) => b.siteId === lokasi.siteId) ?? null;

  // Provisioning otomatis: DB live mulai tanpa box dan seed tidak membuat
  // satupun, sehingga simpan selalu gagal tanpa ini. Sekali per site,
  // daftarkan box bernama site aktif. Guard ref supaya StrictMode
  // (setup → cleanup → setup) tidak double-create; 409/duplikat (API tidak
  // unique-guard nama) ditelan — daftar kotak dimuat ulang via invalidasi
  // hook dan simpan tetap dijaga oleh handleSave.
  const kotakDiusahakan = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!kotakQuery.isSuccess) return;
    if (kotak) return;
    const sid = lokasi.siteId;
    if (!sid) return;
    if (kotakDiusahakan.current.has(sid)) return;
    kotakDiusahakan.current.add(sid);
    void buatKotak.mutateAsync({ siteId: sid, name: lokasi.siteName }).catch(() => {
      /* duplikat/409 atau gagal jaringan: abaikan, ulangi via muat ulang */
    });
  }, [kotakQuery.isSuccess, kotak, lokasi.siteId, lokasi.siteName, buatKotak]);

  // Bulan berjalan (MM): target tombol aksi + CTA status kosong.
  const bulanBerjalan = String(new Date().getMonth() + 1).padStart(2, '0');
  // Grid tahunan dari API — kosong di awal, terisi saat inspeksi dibuat per bulan.
  const grid: P3kYearGrid = useMemo(
    () => (kotak ? petakanGridP3k([kotak], inspeksiQuery.data ?? [], year)[kotak.id] ?? {} : {}),
    [kotak, inspeksiQuery.data, year],
  );

  // Jangkar ekspor PDF tahunan: rekam inspeksi kotak aktif pada tahun terpilih.
  const jangkarEkspor = kotak
    ? ((inspeksiQuery.data ?? []).find(
        (i) => i.boxId === kotak.id && i.period.startsWith(`${year}-`),
      )?.id ?? null)
    : null;

  const stats = useMemo(() => {
    let filled = 0;
    let kurang = 0;
    let kd = 0;
    for (const m of MONTH_KEYS) {
      const cell = grid[m];
      if (!isMonthFilled(cell)) continue;
      filled += 1;
      for (const item of STANDARD_P3K_ITEMS) {
        const mark = markFor(item.id, item.standardQty, cell);
        if (mark === 'kurang') kurang += 1;
        else if (mark === 'kd') kd += 1;
      }
    }
    return { filled, kurang, kd };
  }, [grid]);

  // Saring baris grid: status terburuk setahun + cari nama item.
  const barisTampil = useMemo(() => {
    const q = cariItem.trim().toLowerCase();
    return STANDARD_P3K_ITEMS.filter((item) => {
      if (q && !item.name.toLowerCase().includes(q)) return false;
      if (tabP3k === 'SEMUA') return true;
      const st = statusBaris(item.id, item.standardQty, grid);
      return tabP3k === 'KADALUARSA' ? st === 'kd' : st === 'kurang';
    });
  }, [cariItem, tabP3k, grid]);

  const hitungTab = useMemo(() => {
    let kurang = 0;
    let kd = 0;
    for (const item of STANDARD_P3K_ITEMS) {
      const st = statusBaris(item.id, item.standardQty, grid);
      if (st === 'kd') kd += 1;
      else if (st === 'kurang') kurang += 1;
    }
    return { kurang, kd };
  }, [grid]);

  const handlePrint = () => {
    const style = document.createElement('style');
    style.id = 'p3k-print-page';
    style.textContent = '@page { size: A4 landscape; margin: 10mm 12mm; }';
    document.head.appendChild(style);
    const done = () => {
      style.remove();
      window.removeEventListener('afterprint', done);
    };
    window.addEventListener('afterprint', done);
    window.print();
  };

  const bulanAktif = activeMonth ? `${year}-${activeMonth}` : '';
  const rekamAktif = useMemo(
    () =>
      activeMonth && kotak
        ? ((inspeksiQuery.data ?? []).find(
            (i) => i.boxId === kotak.id && i.period.startsWith(bulanAktif),
          ) ?? null)
        : null,
    [activeMonth, kotak, inspeksiQuery.data, bulanAktif],
  );
  const activeData: P3kMonthData = useMemo(
    () => (activeMonth ? (grid[activeMonth] ?? emptyMonth()) : emptyMonth()),
    [grid, activeMonth],
  );
  const activeIdx = activeMonth ? MONTH_KEYS.indexOf(activeMonth) : -1;

  const menyimpan = buatInspeksi.isPending || ubahInspeksi.isPending || ubahButir.isPending;

  // Simpan upsert bulan: kepala lewat PATCH bila rekam sudah ada (tanpa 409),
  // lalu setiap butir disimpan; rekam baru dibuat dulu sebagai jangkar butir.
  const handleSave = async (data: P3kMonthData) => {
    if (!activeMonth) return;
    if (!kotak) {
      window.alert('Kotak P3K lokasi ini belum terdaftar. Muat ulang halaman lalu coba lagi.');
      throw new Error('Kotak P3K lokasi ini belum terdaftar.');
    }
    const bulan = `${year}-${activeMonth}`;
    const kepala = {
      inspectionDate: data.tanggal.trim() ? data.tanggal.trim() : undefined,
      paraf: data.paraf.trim() ? data.paraf.trim() : undefined,
    };
    const simpanButir = async (inspectionId: string) => {
      const detail = await ambilButirP3k(inspectionId);
      const target = detail.items ?? [];
      await Promise.all(
        STANDARD_P3K_ITEMS.map((std) => {
          const butir = target.find((it) => it.itemName === std.name);
          if (!butir) return Promise.resolve();
          const nilai = data.items[std.id];
          const actual = typeof nilai?.actual === 'number' ? nilai.actual : 0;
          return ubahButir.mutateAsync({
            inspectionId,
            itemId: butir.id,
            body: {
              actualQty: actual,
              status: nilai?.expired ? 'KADALUARSA' : actual >= std.standardQty ? 'STANDAR' : 'DIBAWAH_STANDAR',
            },
          });
        }),
      );
    };
    const ada = (inspeksiQuery.data ?? []).find(
      (i) => i.boxId === kotak.id && i.period.startsWith(bulan),
    );
    if (ada) {
      if (kepala.inspectionDate !== undefined || kepala.paraf !== undefined) {
        await ubahInspeksi.mutateAsync({ id: ada.id, body: kepala });
      }
      await simpanButir(ada.id);
    } else {
      const baru = await buatInspeksi.mutateAsync({ boxId: kotak.id, month: bulan, ...kepala });
      await simpanButir(baru.id);
    }
  };

  const handleClear = () => {
    if (activeMonth && kotak) {
      const ada = (inspeksiQuery.data ?? []).find(
        (i) => i.boxId === kotak.id && i.period.startsWith(`${year}-${activeMonth}`),
      );
      if (ada) hapusInspeksi.mutate(ada.id);
    }
    setActiveMonth(null);
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
          {year !== String(new Date().getFullYear()) && (
            <button
              type="button"
              onClick={() => setYear(String(new Date().getFullYear()))}
              className="text-[11px] font-medium px-2 py-0.5 rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--bg-hover)] cursor-pointer transition-colors shadow-2xs"
            >
              Tahun Ini
            </button>
          )}
          <YearSwitcher
            year={year}
            onChange={(y) => setYear(String(Number(y)))}
            accent={KONFIG_P3K.aksen}
          />
        </>
      }
      jangkarEkspor={jangkarEkspor}
      namaBerkas={year}
      onCetak={handlePrint}
      labelTambah="Isi Inspeksi Bulan Berjalan"
      onTambah={() => setActiveMonth(bulanBerjalan)}
      kepalaCetak={
        <P3kPrintHeader
          siteName={lokasi.siteName}
          year={year}
          unitKerja={unitKerja}
          lokasiKerja={lokasiKerja}
        />
      }
      statistik={
        <P3kStatistik filled={stats.filled} kurang={stats.kurang} kd={stats.kd} />
      }
      saring={
        <div className="no-print flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 pb-3 mb-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-1 bg-[var(--bg-sidebar)] p-0.5 rounded-[5px] border border-[var(--border)] text-xs flex-wrap">
            <button type="button" onClick={() => setTabP3k('SEMUA')} className={KELAS_TAB_P3K(tabP3k === 'SEMUA')}>
              <span>Semua Item</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full tabular-nums bg-[var(--bg-hover)] text-[var(--muted)]">
                {STANDARD_P3K_ITEMS.length}
              </span>
            </button>
            <button type="button" onClick={() => setTabP3k('KURANG')} className={KELAS_TAB_P3K(tabP3k === 'KURANG')}>
              <span>Kurang</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full tabular-nums bg-amber-500/15 text-amber-600 dark:text-amber-400">
                {hitungTab.kurang}
              </span>
            </button>
            <button type="button" onClick={() => setTabP3k('KADALUARSA')} className={KELAS_TAB_P3K(tabP3k === 'KADALUARSA')}>
              <span>Kadaluarsa</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full tabular-nums bg-red-500/15 text-red-600 dark:text-red-400">
                {hitungTab.kd}
              </span>
            </button>
          </div>

          <div className="relative min-w-[170px] lg:w-64">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input
              type="text"
              placeholder="Cari item P3K…"
              value={cariItem}
              onChange={(e) => setCariItem(e.target.value)}
              className="w-full pl-7 pr-2.5 py-1.5 text-xs bg-[var(--bg-main)] border border-[var(--border)] rounded-[4px] text-[var(--primary)] placeholder-[var(--muted)] focus:outline-none focus:border-[#27ae60]"
            />
          </div>
        </div>
      }
      isi={
        <div className="space-y-3 pb-8 flex-1">
          <div className="hidden print:block mb-2">
            <h2 className="text-xs font-bold text-black uppercase tracking-wider">
              A. Hasil Pemeriksaan Kotak P3K
            </h2>
          </div>
          {/* Kop layar interaktif; kop cetak lewat slot kepalaCetak */}
          <div className="print:hidden bg-white dark:bg-[var(--bg-main)]">
            <P3kKepala
              year={year}
              unitKerja={unitKerja}
              onUbahUnitKerja={setUnitKerja}
              lokasiKerja={lokasiKerja}
              onUbahLokasiKerja={setLokasiKerja}
            />
          </div>

          {/* Grid tahunan */}
          {barisTampil.length === 0 ? (
            <p className="print:hidden text-xs text-[var(--muted)] px-1 py-6 text-center">
              Tidak ada item yang cocok dengan saringan. Ubah tab atau kata kunci.
            </p>
          ) : (
            <P3kTabel grid={grid} year={year} items={barisTampil} onPilihBulan={setActiveMonth} />
          )}

          <p className="no-print mt-1.5 text-[11px] text-[var(--muted)]">
            Klik singkatan bulan pada kepala tabel untuk mengisi bulan lain.
          </p>

          {/* Status kosong: grid masih penuh –, arahkan ke form bulan berjalan. */}
          {stats.filled === 0 && (
            <div className="no-print py-8 text-center border border-dashed border-[var(--border)] rounded-[8px] bg-[var(--bg-sidebar)]/50">
              <p className="font-semibold text-sm text-[var(--primary)] tabular-nums">
                Belum ada inspeksi tahun {year}
              </p>
              <p className="text-xs text-[var(--muted)] mt-1">
                Isi inspeksi bulan berjalan untuk mulai mencatat kelengkapan kotak P3K.
              </p>
              <button
                type="button"
                onClick={() => setActiveMonth(bulanBerjalan)}
                className="mt-3 px-3 py-1.5 text-xs font-semibold text-white bg-[#2f80ed] hover:bg-[#2b77d4] rounded-[4px] cursor-pointer pressable"
              >
                Isi Inspeksi Bulan Berjalan
              </button>
            </div>
          )}

          <p className="mt-1.5 text-[11px] print:text-[7px] italic text-[var(--secondary)] print:text-black print:mt-0.5">
            Catatan: Apabila jumlah di bawah standar, maka harus diisi kembali sesuai dengan jumlah
            standar yang tercantum
          </p>
        </div>
      }
      tandaTangan={<P3kPrintSignatures />}
      modals={
        <P3kInspectionModal
          isOpen={activeMonth !== null}
          monthLabel={activeIdx >= 0 ? `${MONTH_NAMES[activeIdx]} ${year}` : ''}
          initial={activeData}
          rekam={rekamAktif}
          menyimpan={menyimpan}
          menghapusBulan={hapusInspeksi.isPending}
          onClose={() => setActiveMonth(null)}
          onSave={handleSave}
          onClear={handleClear}
        />
      }
    />
  );
};
