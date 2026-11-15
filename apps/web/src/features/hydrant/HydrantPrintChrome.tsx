import React, { useEffect, useState } from 'react';
import { formatIndonesianDate } from '../../lib/dates';
import { ambilFotoInspeksi, type ApiFoto, type ApiInspeksiHidran } from '@/services/api/klien';
import { livePhotoUrl } from '@/services/api/liveClient';
import { detailKomponen } from './HydrantTable';
import type { HydrantUnitItem } from '../../types/hse';
import type { HydrantFindingItem } from './types';

interface HydrantPrintHeaderProps {
  siteName: string;
  monthLabel: string;
}

/**
 * Kop lembar laporan Hydrant, hanya tampil saat dicetak.
 *
 * Tanggal cetak dulu hardcoded "30 September 2026" di dalam halaman, jadi
 * setiap cetak berikutnya mencetak tanggal yang salah. Sekarang diambil dari
 * jam sistem saat render.
 */
export const HydrantPrintHeader: React.FC<HydrantPrintHeaderProps> = ({ siteName, monthLabel }) => (
  <div className="hidden print:block pb-3 mb-4 border-b border-black">
    <div className="flex items-center justify-between mb-3">
      <img
        src="/findings/report-header-logos.png"
        alt="Logo Mitra & Pengelola JPM Dukuh Atas"
        className="w-full max-h-16 object-contain"
      />
    </div>
    <div className="flex justify-between items-start pt-1">
      <div>
        <h1 className="text-sm font-extrabold text-black">
          LEMBAR LAPORAN PEMERIKSAAN BERKALA HYDRANT GEDUNG
        </h1>
        <p className="text-[10px] text-gray-700">
          Sesuai Standar K3, NFPA 25 &amp; Permenakertrans No. 04/MEN/1980
        </p>
      </div>
      <div className="text-right text-[10px] text-gray-800 leading-tight">
        <p>
          <span className="font-semibold">Lokasi Fasilitas:</span> {siteName}
        </p>
        <p>
          <span className="font-semibold">Periode Inspeksi:</span> {monthLabel}
        </p>
        <p>
          <span className="font-semibold">Tanggal Cetak:</span> {formatIndonesianDate(new Date())}
        </p>
      </div>
    </div>
  </div>
);

/** Blok tanda tangan tiga kolom pada lembar cetak Hydrant. */
export const HydrantPrintSignatures: React.FC<{ selaluTampil?: boolean }> = ({ selaluTampil }) => (
  <div className={`${selaluTampil ? 'block' : 'hidden print:block'} pt-8 mt-8 border-t border-black print:break-inside-avoid`}>
    <div className="grid grid-cols-3 gap-6 text-center text-xs text-black">
      <div>
        <p className="font-semibold">Petugas Pemeriksa (Inspector)</p>
        <div className="h-16"></div>
        <p className="font-bold underline">( Alex Chen )</p>
        <p className="text-[10px] text-gray-700">Staff HSE / Teknisi K3</p>
      </div>
      <div>
        <p className="font-semibold">Diverifikasi Oleh (Supervisor)</p>
        <div className="h-16"></div>
        <p className="font-bold underline">( Budi Santoso )</p>
        <p className="text-[10px] text-gray-700">HSE Officer &amp; Koordinator</p>
      </div>
      <div>
        <p className="font-semibold">Disetujui Oleh (Site Manager)</p>
        <div className="h-16"></div>
        <p className="font-bold underline">( Ir. Hendra Wijaya )</p>
        <p className="text-[10px] text-gray-700">Kepala Operasional Logistik</p>
      </div>
    </div>
  </div>
);

// ── Kertas cetak ganda (cetak browser) ────────────────────────────────────────
//  Mencerminkan dua printable PDF resmi ("CHECKLIST BULANAN HYDRANT" portrait
//  + "LAPORAN PEMERIKSAAN HYDRANT" landscape) dari data live yang sama: unit +
//  inspeksi + foto site+period terpilih. Aturan cetak (sembunyikan krom layar,
//  jeda halaman, @page landscape bernama) disuntik lewat <style> di sini agar
//  tidak menyentuh berkas laman/tabel lain.

const BULAN_PANJANG = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const BULAN_PENDEK = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

/** "2026-09-18T.." -> "18-Sep-26", gaya kolom Tanggal Pemeriksaan di kertas. */
function tanggalSingkat(iso: string): string {
  const m = iso.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return '';
  return `${Number(m[3])}-${BULAN_PENDEK[Number(m[2]) - 1] ?? ''}-${m[1].slice(2)}`;
}

/** Tanggal-tanggal unik gaya kertas: "16 dan 18 September 2026". */
function daftarTanggal(isoList: string[], periodKey: string): string {
  const hari = [...new Set(
    isoList
      .map((s) => {
        const m = s.match(/\d{4}-\d{2}-(\d{2})/);
        return m ? Number(m[1]) : NaN;
      })
      .filter((n) => Number.isFinite(n)),
  )].sort((a, b) => a - b);
  const pm = periodKey.match(/(\d{4})-(\d{2})/);
  const label = pm ? `${BULAN_PANJANG[Number(pm[2]) - 1] ?? ''} ${pm[1]}` : '';
  if (hari.length === 0) return label;
  if (hari.length === 1) return `${hari[0]} ${label}`.trim();
  return `${hari.slice(0, -1).join(', ')} dan ${hari[hari.length - 1]} ${label}`.trim();
}

/** Status akhir -> kalimat kolom Status Penggunaan (ejaan K3 baku). */
function statusPakai(status?: string): string {
  if (status === 'LAYAK') return 'Layak digunakan';
  if (status === 'LAYAK_DENGAN_CATATAN') return 'Layak digunakan dengan catatan';
  return 'Tidak layak digunakan';
}

const KOMPONEN_LAPORAN = [
  { kunci: 'boxHydrant', label: 'Box Hydrant' },
  { kunci: 'fireHose', label: 'Fire Hose' },
  { kunci: 'hoseCoupling', label: 'Hose Coupling' },
  { kunci: 'hoseRack', label: 'Hose Rack' },
  { kunci: 'nozzle', label: 'Nozzle' },
  { kunci: 'valvePillar', label: 'Valve / Pillar Hydrant' },
] as const;

/** Tanda kertas laporan: LAYAK -> ✓ di Standar; TIDAK_LAYAK -> X, HILANG -> -. */
function tandaLaporan(status: string | undefined, kolom: 'standar' | 'bawah'): string {
  if (kolom === 'standar') return status === 'LAYAK' ? '✓' : '';
  if (status === 'TIDAK_LAYAK') return 'X';
  if (status === 'HILANG') return '-';
  return '';
}

export interface BuktiCetak {
  url: string;
  caption: string;
  temuan: boolean;
}

/** Bukti inspeksi tiap rekam (temuan=false) untuk kolom foto cetak. */
function useBuktiCetak(inspeksiIds: string[]): Record<string, BuktiCetak[]> {
  const [peta, setPeta] = useState<Record<string, BuktiCetak[]>>({});
  const kunci = inspeksiIds.join('|');
  useEffect(() => {
    if (inspeksiIds.length === 0) {
      setPeta({});
      return;
    }
    let batal = false;
    void (async () => {
      const hasil = await Promise.all(
        inspeksiIds.map(async (id) => {
          try {
            const res = await ambilFotoInspeksi('hydrant', id);
            const items = (res.items as (ApiFoto & { createdAt: string })[])
              .slice()
              .sort((a, b) => (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0));
            return [id, items.map((f) => ({ url: livePhotoUrl(f.id), caption: f.caption ?? '', temuan: f.temuan }))] as const;
          } catch {
            return [id, []] as const;
          }
        }),
      );
      if (!batal) setPeta(Object.fromEntries(hasil));
    })();
    return () => {
      batal = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- kunci string stabil per daftar id
  }, [kunci]);
  return peta;
}

export interface HydrantPrintKertasProps {
  siteName: string;
  /** Kunci bulan YYYY-MM. */
  period: string;
  units: HydrantUnitItem[];
  /** Semua inspeksi site ini (disaring ke period di sini). */
  inspeksi: ApiInspeksiHidran[];
  findings: HydrantFindingItem[];
  /** Pratinjau layar: tampilkan kertas di layar, bukan hanya saat cetak. */
  selaluTampil?: boolean;
}

/**
 * Dua layout kertas resmi untuk cetak browser, berurutan dengan jeda halaman.
 * Pembungkusnya (`.hyd-print-area`, dipasang laman di `kepalaCetak`) adalah anak
 * pertama cangkang sehingga aturan `@media print` di bawah menyembunyikan
 * semua saudara (krom layar + tabel layar) saat mencetak.
 */
export const HydrantPrintKertas: React.FC<HydrantPrintKertasProps> = ({
  siteName,
  period,
  units,
  inspeksi,
  findings,
  selaluTampil,
}) => {
  const bulan = inspeksi.filter((i) => i.period.startsWith(period));
  const perUnit = new Map(bulan.map((i) => [i.unitId, i]));
  // Kertas hanya memuat unit yang punya rekam bulan ini (sama seperti PDF).
  const baris = units.filter((u) => perUnit.has(u.id));
  const bukti = useBuktiCetak(bulan.map((i) => i.id));
  const tanggalBaris = daftarTanggal(bulan.map((i) => i.createdAt), period);
  const pm = period.match(/(\d{4})-(\d{2})/);
  const namaBulan = pm ? BULAN_PANJANG[Number(pm[2]) - 1] ?? '' : '';
  const tahun = pm ? pm[1] : period;

  return (
    <>
      <style>{`@media print {
  .hyd-print-area ~ * { display: none !important; }
  .hyd-kertas-2 { page: hyd-laporan; break-before: page; }
  .hyd-kertas-1 table tr, .hyd-kertas-2 table tr { break-inside: avoid; }
}
@page hyd-laporan { size: A4 landscape; margin: 10mm; }`}</style>

      {/* Kertas 1 — CHECKLIST BULANAN HYDRANT (portrait). */}
      <div className={`hyd-kertas-1 ${selaluTampil ? 'block' : 'hidden print:block'} text-black`}>
        <div className="mb-2">
          <img
            src="/findings/report-header-logos.png"
            alt="JPM Dukuh Atas"
            className="w-full max-h-16 object-contain"
          />
        </div>
        <div className="text-center my-2">
          <h1 className="text-base font-extrabold tracking-wide">CHECKLIST BULANAN HYDRANT</h1>
          <p className="text-xs font-bold">{(siteName || '-').toUpperCase()}</p>
        </div>
        <p className="text-[11px]"><strong>Periode : {namaBulan} {tahun}</strong></p>
        <p className="text-[11px]"><strong>Tanggal : {tanggalBaris}</strong></p>

        <h2 className="text-xs font-bold uppercase tracking-wider mt-3 mb-1 pb-1 border-b border-black">
          A. Laporan hasil Inspeksi Hydrant
        </h2>
        <table className="w-full border-collapse text-[8px] text-center">
          <thead>
            <tr className="bg-gray-100">
              {['No', 'Zona', 'Kode Hydrant', 'Dokumentasi Pemeriksaan', 'Dokumentasi Checklist', 'Status Penggunaan'].map((h) => (
                <th key={h} className="border border-black px-1 py-1 font-bold uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {baris.map((u, idx) => {
              const insp = perUnit.get(u.id);
              const semua = insp ? bukti[insp.id] ?? [] : [];
              const buktiFoto = semua.filter((f) => !f.temuan);
              const temuanFoto = semua.filter((f) => f.temuan);
              const selA = buktiFoto[0]?.url ?? null;
              const selB = temuanFoto[0]?.url ?? buktiFoto[1]?.url ?? null;
              const status = insp?.overallStatus ?? u.completedReport?.overallStatus ?? u.draftDetails?.overallStatus;
              return (
                <tr key={u.id}>
                  <td className="border border-black px-1 py-1 tabular-nums">{idx + 1}</td>
                  <td className="border border-black px-1 py-1 text-left">{u.zoneName}</td>
                  <td className="border border-black px-1 py-1 text-left font-bold">{u.kode}</td>
                  <td className="border border-black p-0.5 w-[118px] h-[62px]">
                    {selA ? <img src={selA} alt="Dokumentasi pemeriksaan" className="max-w-[114px] max-h-[58px] object-contain mx-auto" /> : null}
                  </td>
                  <td className="border border-black p-0.5 w-[118px] h-[62px]">
                    {selB ? <img src={selB} alt="Dokumentasi checklist" className="max-w-[114px] max-h-[58px] object-contain mx-auto" /> : null}
                  </td>
                  <td className="border border-black px-1 py-1 text-left">{statusPakai(status)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <h2 className="text-xs font-bold uppercase tracking-wider mt-3 mb-1 pb-1 border-b border-black">
          B. Catatan Hasil temuan
        </h2>
        {findings.length === 0 ? (
          <p className="text-[8px] italic text-gray-600">Tidak ada foto temuan pada periode ini.</p>
        ) : (
          <table className="w-full border-collapse">
            <tbody>
              {Array.from({ length: Math.ceil(findings.length / 2) }, (_, r) => (
                <tr key={r}>
                  {[findings[r * 2], findings[r * 2 + 1]].map((f, c) =>
                    f ? (
                      <td key={f.id} className="w-1/2 p-1.5 align-top">
                        <div className="border border-black rounded flex items-center justify-center h-[150px] bg-gray-100 overflow-hidden">
                          <img src={f.imageUrl} alt="Foto temuan" className="max-w-full max-h-full object-contain" />
                        </div>
                        <p className="text-center text-[8px] mt-1 font-bold">{f.description}</p>
                      </td>
                    ) : (
                      <td key={`kosong-${c}`} className="w-1/2 p-1.5" />
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="text-right text-[7px] text-gray-600 mt-2 tabular-nums">
          Dokumen dihasilkan sistem – {formatIndonesianDate(new Date())} · {baris.length} unit
        </p>
      </div>

      {/* Kertas 2 — LAPORAN PEMERIKSAAN HYDRANT (landscape). */}
      <div className={`hyd-kertas-2 ${selaluTampil ? 'block' : 'hidden print:block'} text-black`}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[9px] font-bold text-teal-700 leading-tight">dutagaruda<br />piranti prima</p>
          <h1 className="text-sm font-extrabold tracking-wide text-center">LAPORAN PEMERIKSAAN HYDRANT</h1>
          <p className="text-[8px] font-bold text-blue-900 text-right">INTEGRASI TRANSIT JAKARTA</p>
        </div>
        <div className="text-[8px] mb-1">
          <p><strong>Tahun Pemeriksaan :</strong> <span className="tabular-nums">{tahun}</span> | <strong>Bulan :</strong> {namaBulan}</p>
          <p><strong>Lokasi Pemeriksaan :</strong> ITJ {(siteName || '-').toUpperCase()}</p>
          <p><strong>Keterangan :</strong> Layak Digunakan (✓), Tidak Layak Digunakan (X), Hilang (-)</p>
        </div>
        <table className="w-full border-collapse text-[6px] text-center table-fixed">
          <thead>
            <tr className="bg-gray-100">
              <th rowSpan={3} className="border border-black px-0.5 py-1 font-bold w-[22px]">No</th>
              <th rowSpan={3} className="border border-black px-0.5 py-1 font-bold w-[58px]">Kode Hydrant</th>
              <th colSpan={12} className="border border-black px-0.5 py-1 font-bold">Item Alat</th>
              <th rowSpan={3} className="border border-black px-0.5 py-1 font-bold w-[52px]">Tanggal Pemeriksaan</th>
              <th rowSpan={3} className="border border-black px-0.5 py-1 font-bold w-[60px]">Petugas Pemeriksa</th>
              <th rowSpan={3} className="border border-black px-0.5 py-1 font-bold">Keterangan</th>
            </tr>
            <tr className="bg-gray-100">
              {KOMPONEN_LAPORAN.map((k) => (
                <th key={k.kunci} colSpan={2} className="border border-black px-0.5 py-1 font-bold">{k.label}</th>
              ))}
            </tr>
            <tr className="bg-gray-100">
              {KOMPONEN_LAPORAN.map((k) => (
                <React.Fragment key={k.kunci}>
                  <th className="border border-black px-0.5 py-0.5 font-bold">Standar</th>
                  <th className="border border-black px-0.5 py-0.5 font-bold">Dibawah Standar</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {baris.map((u, idx) => {
              const insp = perUnit.get(u.id);
              const det = detailKomponen(u);
              const perKunci: Record<string, string | undefined> = {};
              if (insp) {
                perKunci.boxHydrant = insp.boxHydrant;
                perKunci.fireHose = insp.fireHose;
                perKunci.hoseCoupling = insp.hoseCoupling;
                perKunci.hoseRack = insp.hoseRack;
                perKunci.nozzle = insp.nozzle;
                perKunci.valvePillar = insp.valvePillar;
              } else {
                // `detailKomponen` mengembalikan label tabel layar ("Valve/Pillar
                // Hydrant"); petakan menurut urutan yang sama dengan kertas.
                KOMPONEN_LAPORAN.forEach((k, i) => {
                  perKunci[k.kunci] = det[i]?.status;
                });
              }
              return (
                <tr key={u.id}>
                  <td className="border border-black px-0.5 py-1 tabular-nums">{idx + 1}</td>
                  <td className="border border-black px-0.5 py-1 text-left font-bold">{u.kode}</td>
                  {KOMPONEN_LAPORAN.map((k) => (
                    <React.Fragment key={k.kunci}>
                      <td className="border border-black px-0.5 py-1 font-bold">{tandaLaporan(perKunci[k.kunci], 'standar')}</td>
                      <td className="border border-black px-0.5 py-1 font-bold">{tandaLaporan(perKunci[k.kunci], 'bawah')}</td>
                    </React.Fragment>
                  ))}
                  <td className="border border-black px-0.5 py-1 tabular-nums">{insp ? tanggalSingkat(insp.createdAt) : ''}</td>
                  <td className="border border-black px-0.5 py-1 text-left">Pengawas K3</td>
                  <td className="border border-black px-0.5 py-1 text-left italic">{insp?.notes ?? u.completedReport?.summaryNotes ?? u.draftDetails?.notes ?? '–'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="text-right text-[7px] text-gray-600 mt-2 tabular-nums">
          Dokumen dihasilkan sistem – {formatIndonesianDate(new Date())} · {baris.length} unit
        </p>
      </div>
    </>
  );
};
