import React, { useMemo, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Printer } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { STANDARD_P3K_ITEMS } from '../../lib/p3kItems';
import { P3kInspectionModal } from './P3kInspectionModal';
import { petakanGridP3k } from './petaApi';
import { UnduhPdfButton } from '@/components/ui';
import {
  useKotakP3k,
  useInspeksiP3k,
  useSimpanInspeksiP3k,
  useUbahButirP3k,
  useUbahInspeksiP3k,
  useHapusInspeksiP3k,
} from '@/services/api/queries';
import type { ApiInspeksiP3k } from '@/services/api/klien';
import { ambilButirP3k } from '@/services/api/klien';
import {
  MONTH_KEYS,
  MONTH_NAMES,
  MONTH_SHORT,
  emptyMonth,
  isMonthFilled,
  markFor,
  type P3kMonthData,
  type P3kYearGrid,
} from './types';

interface P3kPageProps {
  onBack: () => void;
}

function fmtTanggal(iso: string): string {
  if (!iso) return '–';
  try {
    return format(parseISO(iso), 'dd-MMM-yy', { locale: idLocale });
  } catch {
    return iso;
  }
}

/**
 * Inspeksi Kotak P3K — yearly grid only.
 * Box is keyed by site name (one box per site). Empty start; month click opens the input form.
 */
export const P3kPage: React.FC<P3kPageProps> = ({ onBack }) => {
  const kotakQuery = useKotakP3k();
  const inspeksiQuery = useInspeksiP3k();
  const buatInspeksi = useSimpanInspeksiP3k();
  const ubahInspeksi = useUbahInspeksiP3k();
  const ubahButir = useUbahButirP3k();
  const hapusInspeksi = useHapusInspeksiP3k();

  const [year, setYear] = useState('2026');
  const [unitKerja, setUnitKerja] = useState('HSE');
  const [lokasiKerja, setLokasiKerja] = useState('ITJ JPM Dukuh Atas');
  const [activeMonth, setActiveMonth] = useState<string | null>(null);

  // Kotak pertama pada lokasi aktif (satu kotak per lokasi, sesuai kontrak halaman).
  const kotak = (kotakQuery.data ?? [])[0] ?? null;
  // Grid tahunan dari API — kosong di awal, terisi saat inspeksi dibuat per bulan.
  const grid: P3kYearGrid = useMemo(
    () => (kotak ? petakanGridP3k([kotak], inspeksiQuery.data ?? [], year)[kotak.id] ?? {} : {}),
    [kotak, inspeksiQuery.data, year],
  );

  // Alur persetujuan: per bulan (satu rekam inspeksi per bulan). Bulan terbuka kini.
  const inspeksiBulanAktif: ApiInspeksiP3k | null = useMemo(() => {
    if (!activeMonth || !kotak) return null;
    return (
      (inspeksiQuery.data ?? []).find(
        (i) => i.boxId === kotak.id && i.period.startsWith(`${year}-${activeMonth}`),
      ) ?? null
    );
  }, [activeMonth, kotak, inspeksiQuery.data, year]);
  const bulanTerkunci = (m: string): boolean => {
    if (!kotak) return false;
    const baris = (inspeksiQuery.data ?? []).find(
      (i) => i.boxId === kotak.id && i.period.startsWith(`${year}-${m}`),
    );
    return baris != null && baris.approvalStatus !== 'DRAFT';
  };

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

  const keteranganFor = (id: number, std: number): string => {
    const kurangMonths: string[] = [];
    const kdMonths: string[] = [];
    MONTH_KEYS.forEach((m, i) => {
      const mark = markFor(id, std, grid[m]);
      if (mark === 'kurang') kurangMonths.push(MONTH_SHORT[i]);
      else if (mark === 'kd') kdMonths.push(MONTH_SHORT[i]);
    });
    const parts: string[] = [];
    if (kdMonths.length) parts.push(`KD: ${kdMonths.join(', ')}`);
    if (kurangMonths.length) parts.push(`Kurang: ${kurangMonths.join(', ')}`);
    return parts.length ? parts.join(' · ') : '–';
  };

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
      <div className="no-print flex items-center justify-between gap-2 pb-3 mb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onBack}
            aria-label="Kembali"
            className="p-1.5 rounded-[4px] text-[var(--muted)] hover:bg-[var(--bg-hover)] pressable cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-lg font-bold text-[var(--primary)] tracking-tight truncate">
            Inspeksi Kotak P3K
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setYear((y) => String(Number(y) - 1))}
              aria-label="Tahun sebelumnya"
              className="p-1.5 rounded-[4px] text-[var(--muted)] hover:bg-[var(--bg-hover)] pressable cursor-pointer"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="text-sm font-bold tabular-nums min-w-12 text-center">{year}</span>
            <button
              type="button"
              onClick={() => setYear((y) => String(Number(y) + 1))}
              aria-label="Tahun berikutnya"
              className="p-1.5 rounded-[4px] text-[var(--muted)] hover:bg-[var(--bg-hover)] pressable cursor-pointer"
            >
              <ChevronRight size={15} />
            </button>
          </div>
          <UnduhPdfButton category="p3k-yearly" refId={jangkarEkspor} label="Unduh PDF" namaBerkas={year} />
          <button
            type="button"
            onClick={handlePrint}
            title="Cetak lembar laporan ke printer atau simpan sebagai PDF"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#27ae60] rounded-[4px] hover:brightness-95 pressable cursor-pointer"
          >
            <Printer size={13} /> Cetak
          </button>
        </div>
      </div>

      {/* Alur persetujuan pindah ke modal isi bulan (satu rekam per bulan) */}

      {/* Stats */}
      <div className="no-print grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Bulan Terisi', value: `${stats.filled}/12` },
          { label: 'Sel Di Bawah Standar', value: String(stats.kurang) },
          { label: 'Kadaluarsa', value: String(stats.kd) },
        ].map((s) => (
          <div
            key={s.label}
            className="px-3 py-2.5 rounded-[6px] border border-[var(--border)] bg-[var(--bg-sidebar)]/60"
          >
            <p className="text-xl font-bold tabular-nums text-[var(--primary)]">{s.value}</p>
            <p className="text-[10px] text-[var(--muted)] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Paper header */}
      <div className="bg-white dark:bg-[var(--bg-main)] print:bg-white">
        <h2 className="text-base font-bold text-center text-[var(--primary)] tracking-tight print:text-black">
          INSPEKSI KOTAK P3K
        </h2>
        <div className="mt-1 px-2 py-1 text-[11px] font-semibold bg-[#dbe7f3] dark:bg-[var(--bg-sidebar)] print:bg-[#dbe7f3] print:text-black rounded-[3px] tabular-nums">
          Periode : {year}
        </div>
        <div className="mt-1.5 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-[11px] print:text-[10px] print:text-black">
          <span>
            <span className="font-semibold">Unit Kerja : </span>
            <input
              value={unitKerja}
              onChange={(e) => setUnitKerja(e.target.value)}
              aria-label="Unit Kerja"
              className="no-print w-28 bg-transparent border-b border-[var(--border)] focus:outline-none focus:border-[#27ae60] px-1"
            />
            <span className="hidden print:inline">{unitKerja}</span>
          </span>
          <span>
            <span className="font-semibold">Lokasi Kerja : </span>
            <input
              value={lokasiKerja}
              onChange={(e) => setLokasiKerja(e.target.value)}
              aria-label="Lokasi Kerja"
              className="no-print w-48 bg-transparent border-b border-[var(--border)] focus:outline-none focus:border-[#27ae60] px-1"
            />
            <span className="hidden print:inline">{lokasiKerja}</span>
          </span>
          <span className="sm:ml-auto text-[var(--muted)] print:text-black">
            <span className="font-semibold">Keterangan: </span>
            Standar ( √ ) | Di Bawah Standar ( × ) | Kadaluarsa (KD)
          </span>
        </div>
        <p className="no-print text-[11px] text-[var(--muted)] mt-1.5 mb-2">
          Klik nama bulan untuk mengisi hasil pemeriksaan bulan tersebut.
        </p>

        {/* Yearly grid */}
        <div className="overflow-x-auto border border-[var(--border)] print:border-black bg-[var(--bg-main)] dark:bg-[var(--bg-main)] print:bg-white shadow-2xs print:shadow-none rounded-[6px] print:rounded-none">
          <table className="w-full border-collapse text-xs print:text-[7px] min-w-[1024px] print:min-w-0">
            <thead>
              <tr className="border-b border-[var(--border)] print:border-black bg-[var(--bg-sidebar)]/80 print:bg-white text-[10px] print:text-[7px] font-bold text-[var(--primary)] print:text-black">
                <th className="py-1.5 px-2 text-center align-middle print:py-0.5 print:px-1">NO.</th>
                <th className="py-1.5 px-2 text-center align-middle print:py-0.5 print:px-1">ITEM</th>
                <th className="py-1.5 px-2 text-center align-middle print:py-0.5 print:px-1">JUMLAH STANDAR</th>
                {MONTH_KEYS.map((m, i) => (
                  <th key={m} className="py-1 px-1 text-center align-middle print:py-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (bulanTerkunci(m)) return;
                        setActiveMonth(m);
                      }}
                      title={
                        bulanTerkunci(m)
                          ? 'Laporan terkunci — menunggu persetujuan'
                          : `Isi ${MONTH_NAMES[i]} ${year}`
                      }
                      className="no-print inline-flex items-center gap-1 font-bold hover:text-[#27ae60] pressable cursor-pointer tabular-nums"
                    >
                      {MONTH_SHORT[i]}
                      {isMonthFilled(grid[m]) && (
                        <span className="text-[8px] text-[#27ae60] font-bold">●</span>
                      )}
                    </button>
                    <span className="hidden print:inline tabular-nums">{MONTH_SHORT[i]}</span>
                  </th>
                ))}
                <th className="py-1.5 px-2 text-center align-middle print:py-0.5 print:px-1">KETERANGAN</th>
              </tr>
            </thead>
            <tbody>
              {STANDARD_P3K_ITEMS.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-[var(--border)]/60 print:border-black last:border-none"
                >
                  <td className="py-1 px-2 text-center align-middle tabular-nums text-[var(--secondary)] print:py-[1px] print:px-1">
                    {item.id}
                  </td>
                  <td className="py-1 px-2 text-left align-middle text-[var(--primary)] print:py-[1px] print:px-1 print:whitespace-nowrap">
                    {item.name}
                  </td>
                  <td className="py-1 px-2 text-center align-middle tabular-nums text-[var(--secondary)] print:py-[1px] print:px-1">
                    {item.standardQty}
                  </td>
                  {MONTH_KEYS.map((m) => {
                    const mark = markFor(item.id, item.standardQty, grid[m]);
                    return (
                      <td
                        key={m}
                        className={`py-1 px-1 text-center align-middle tabular-nums font-semibold print:py-[1px] ${
                          mark === 'kurang' || mark === 'kd' ? 'bg-red-500/[0.07]' : ''
                        }`}
                      >
                        {mark === 'standar' ? (
                          <span className="text-emerald-600 dark:text-emerald-400">√</span>
                        ) : mark === 'kurang' ? (
                          <span className="text-red-600 dark:text-red-400">×</span>
                        ) : mark === 'kd' ? (
                          <span className="text-red-600 dark:text-red-400 font-bold">KD</span>
                        ) : (
                          <span className="font-normal text-[var(--muted)]">–</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="py-1 px-2 text-left align-middle text-[10px] print:text-[6px] text-[var(--secondary)] print:py-[1px] print:px-1 print:leading-tight">
                    {keteranganFor(item.id, item.standardQty)}
                  </td>
                </tr>
              ))}
              <tr className="border-t border-[var(--border)] print:border-black bg-[var(--bg-sidebar)]/50 print:bg-white">
                <td colSpan={3} className="py-1.5 px-2 text-center align-middle text-[10px] print:text-[7px] font-bold text-[var(--primary)] print:text-black print:py-0.5 print:px-1">
                  TANGGAL INSPEKSI
                </td>
                {MONTH_KEYS.map((m) => (
                  <td
                    key={m}
                    className="py-1.5 px-1 text-center align-middle text-[10px] print:text-[7px] tabular-nums text-[var(--secondary)] print:py-0.5 print:whitespace-nowrap"
                  >
                    {fmtTanggal(grid[m]?.tanggal ?? '')}
                  </td>
                ))}
                <td className="py-1.5 px-2 text-center align-middle text-[var(--muted)] print:py-0.5">–</td>
              </tr>
              <tr className="border-t border-[var(--border)] print:border-black bg-[var(--bg-sidebar)]/50 print:bg-white">
                <td colSpan={3} className="py-1.5 px-2 text-center align-middle text-[10px] print:text-[7px] font-bold text-[var(--primary)] print:text-black print:py-0.5 print:px-1">
                  PARAF &amp; INISIAL
                </td>
                {MONTH_KEYS.map((m) => (
                  <td
                    key={m}
                    className="py-1.5 px-1 text-center align-middle text-[10px] print:text-[7px] text-[var(--secondary)] print:py-0.5"
                  >
                    {grid[m]?.paraf?.trim() ? grid[m]?.paraf : '–'}
                  </td>
                ))}
                <td className="py-1.5 px-2 text-center align-middle text-[var(--muted)] print:py-0.5">–</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="mt-1.5 text-[11px] print:text-[7px] italic text-[var(--secondary)] print:text-black print:mt-0.5">
          Catatan: Apabila jumlah di bawah standar, maka harus diisi kembali sesuai dengan jumlah
          standar yang tercantum
        </p>
      </div>

      <P3kInspectionModal
        isOpen={activeMonth !== null}
        monthLabel={activeIdx >= 0 ? `${MONTH_NAMES[activeIdx]} ${year}` : ''}
        initial={activeData}
        terkunci={bulanTerkunci(activeMonth ?? '')}
        inspeksi={inspeksiBulanAktif}
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
