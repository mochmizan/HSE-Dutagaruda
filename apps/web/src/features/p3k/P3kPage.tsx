import React, { useMemo, useState } from 'react';
import { STANDARD_P3K_ITEMS } from '../../lib/p3kItems';
import { P3kInspectionModal } from './P3kInspectionModal';
import { P3kHeader } from './P3kHeader';
import { P3kKepala } from './P3kKepala';
import { P3kStatistik } from './P3kStatistik';
import { P3kTabel } from './P3kTabel';
import { petakanGridP3k } from './petaApi';
import {
  useKotakP3k,
  useInspeksiP3k,
  useSimpanInspeksiP3k,
  useUbahButirP3k,
  useUbahInspeksiP3k,
  useHapusInspeksiP3k,
} from '@/services/api/queries';
import { ambilButirP3k } from '@/services/api/klien';
import { useKonteksLokasi } from '@/features/konteksLokasi';
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
  onBack: () => void;
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
}

/**
 * Inspeksi Kotak P3K — yearly grid only.
 * Box is keyed by site name (one box per site). Empty start; month click opens the input form.
 */
export const P3kPage: React.FC<P3kPageProps> = ({ onBack, isCollapsed, onToggleCollapsed }) => {
  const lokasi = useKonteksLokasi();
  const kotakQuery = useKotakP3k();
  const inspeksiQuery = useInspeksiP3k();
  const buatInspeksi = useSimpanInspeksiP3k();
  const ubahInspeksi = useUbahInspeksiP3k();
  const ubahButir = useUbahButirP3k();
  const hapusInspeksi = useHapusInspeksiP3k();

  // Tahun berjalan, bukan tahun yang dipatok: grid tahunan harus membuka tahun
  // ini tanpa perlu diklik dua kali setiap Januari.
  const [year, setYear] = useState(() => String(new Date().getFullYear()));
  const [unitKerja, setUnitKerja] = useState('HSE');
  const [lokasiKerja, setLokasiKerja] = useState('ITJ JPM Dukuh Atas');
  const [activeMonth, setActiveMonth] = useState<string | null>(null);

  // Kotak lokasi aktif (satu kotak per lokasi, sesuai kontrak halaman).
  const kotak = (kotakQuery.data ?? []).find((b) => b.siteId === lokasi.siteId) ?? null;
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

  const activeData: P3kMonthData = activeMonth ? (grid[activeMonth] ?? emptyMonth()) : emptyMonth();
  const activeIdx = activeMonth ? MONTH_KEYS.indexOf(activeMonth) : -1;

  return (
    <main className="flex-1 flex flex-col h-screen overflow-y-auto px-6 py-4 bg-[var(--bg-main)]">
      {/* Top bar */}
      <P3kHeader
        isCollapsed={isCollapsed}
        onToggleCollapsed={onToggleCollapsed}
        onBack={onBack}
        year={year}
        onShiftYear={(delta) => setYear((y) => String(Number(y) + delta))}
        jangkarEkspor={jangkarEkspor}
        onPrint={handlePrint}
      />

      {/* Stats */}
      <P3kStatistik filled={stats.filled} kurang={stats.kurang} kd={stats.kd} />

      {/* Paper header */}
      <div className="bg-white dark:bg-[var(--bg-main)] print:bg-white">
        <P3kKepala
          year={year}
          unitKerja={unitKerja}
          onUbahUnitKerja={setUnitKerja}
          lokasiKerja={lokasiKerja}
          onUbahLokasiKerja={setLokasiKerja}
        />

        {/* Yearly grid */}
        <P3kTabel grid={grid} year={year} onPilihBulan={setActiveMonth} />

        <p className="mt-1.5 text-[11px] print:text-[7px] italic text-[var(--secondary)] print:text-black print:mt-0.5">
          Catatan: Apabila jumlah di bawah standar, maka harus diisi kembali sesuai dengan jumlah
          standar yang tercantum
        </p>
      </div>

      <P3kInspectionModal
        isOpen={activeMonth !== null}
        monthLabel={activeIdx >= 0 ? `${MONTH_NAMES[activeIdx]} ${year}` : ''}
        initial={activeData}
        onClose={() => setActiveMonth(null)}
        onSave={(data) => {
          if (activeMonth && kotak) {
            const bulan = `${year}-${activeMonth}`;
            const kepala = {
              inspectionDate: data.tanggal.trim() ? data.tanggal.trim() : undefined,
              paraf: data.paraf.trim() ? data.paraf.trim() : undefined,
            };
            const simpanButir = (insp: { id: string; items?: Array<{ id: string; itemName: string }> }) => {
              for (const std of STANDARD_P3K_ITEMS) {
                const target = (insp.items ?? []).find((it) => it.itemName === std.name);
                const nilai = data.items[std.id];
                if (!target || nilai === undefined) continue;
                const actual = typeof nilai.actual === 'number' ? nilai.actual : 0;
                ubahButir.mutate({
                  inspectionId: insp.id,
                  itemId: target.id,
                  body: {
                    actualQty: actual,
                    status: nilai.expired ? 'KADALUARSA' : actual >= std.standardQty ? 'STANDAR' : 'DIBAWAH_STANDAR',
                  },
                });
              }
            };
            // Rekam bulan sudah ada → perbarui kepala + butir (tanpa 409).
            const ada = (inspeksiQuery.data ?? []).find(
              (i) => i.boxId === kotak.id && i.period.startsWith(bulan),
            );
            if (ada) {
              if (kepala.inspectionDate !== undefined || kepala.paraf !== undefined) {
                ubahInspeksi.mutate({ id: ada.id, body: kepala });
              }
              ambilButirP3k(ada.id).then(simpanButir);
            } else {
              // Inspeksi bulan dibuat bila belum ada; lalu setiap butir disimpan.
              buatInspeksi.mutate(
                { boxId: kotak.id, month: bulan, ...kepala },
                { onSuccess: (insp) => simpanButir(insp) },
              );
            }
          }
          setActiveMonth(null);
        }}
        onClear={() => {
          if (activeMonth && kotak) {
            const ada = (inspeksiQuery.data ?? []).find(
              (i) => i.boxId === kotak.id && i.period.startsWith(`${year}-${activeMonth}`),
            );
            if (ada) hapusInspeksi.mutate(ada.id);
          }
          setActiveMonth(null);
        }}
      />
    </main>
  );
};
