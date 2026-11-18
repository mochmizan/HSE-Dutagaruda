import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { PrintCustomizationBar } from '@/components/ui';
import {
  PROCEDURAL_PRINT_CSS,
  renderHydrantLaporanSheet,
  renderHydrantMonthlySheets,
  type HydrantLaporanPrintPayload,
  type HydrantMonthlyPrintPayload,
} from '@/lib/proceduralPrintTemplates';
import { ambilFotoInspeksi, type ApiFoto } from '@/services/api/klien';
import { livePhotoUrl } from '@/services/api/liveClient';
import {
  petakanUnitHidran,
  useFotoInspeksi,
  useInspeksiHidran,
  useUnitHidran,
} from '@/services/api/queries';
import { useKonteksLokasi } from '@/features/konteksLokasi';
import { LABEL_KOMPONEN, uraiCatatan } from './catatanHidran';

export type ModeCetakHydrant = 'checklist' | 'laporan' | 'semua';

interface HydrantPrintPreviewProps {
  bulan?: string;
  modeAwal?: ModeCetakHydrant;
  autoPrint?: boolean;
  onKembali: () => void;
}

function bulanBerjalan(): string {
  return format(new Date(), 'yyyy-MM');
}

const BULAN_PENDEK = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function tanggalSingkat(iso?: string): string {
  if (!iso) return '16-Sep-26';
  const m = iso.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return '16-Sep-26';
  return `${Number(m[3])}-${BULAN_PENDEK[Number(m[2]) - 1] ?? ''}-${m[1].slice(2)}`;
}

function statusTeksHydrant(status?: string): string {
  if (status === 'LAYAK') return 'Standar';
  if (status === 'LAYAK_DENGAN_CATATAN') return 'Standar\ndengan\ncatatan';
  return 'Tidak\nStandar';
}

interface BuktiHydrantSlot {
  pemeriksaan?: string;
  checklist?: string;
}

function useBuktiHydrant(inspeksiIds: string[]): { peta: Record<string, BuktiHydrantSlot>; selesai: boolean } {
  const [peta, setPeta] = useState<Record<string, BuktiHydrantSlot>>({});
  const [selesai, setSelesai] = useState(false);
  const kunci = inspeksiIds.join('|');
  useEffect(() => {
    if (inspeksiIds.length === 0) {
      setPeta({});
      setSelesai(true);
      return;
    }
    let batal = false;
    setSelesai(false);
    void (async () => {
      const hasil = await Promise.all(
        inspeksiIds.map(async (id) => {
          try {
            const res = await ambilFotoInspeksi('hydrant', id);
            const items = (res.items as (ApiFoto & { createdAt: string })[])
              .slice()
              .sort((a, b) => (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0));
            const bukti = items.filter((f) => !f.temuan);
            const temuan = items.filter((f) => f.temuan);

            const checklistFoto = bukti.find((f) => /checklist|kartu/i.test(f.caption ?? ''));
            const pemeriksaanFoto =
              bukti.find((f) => f.id !== checklistFoto?.id) ?? bukti[0];

            return [
              id,
              {
                pemeriksaan: pemeriksaanFoto ? livePhotoUrl(pemeriksaanFoto.id) : undefined,
                checklist: checklistFoto
                  ? livePhotoUrl(checklistFoto.id)
                  : bukti[1]
                    ? livePhotoUrl(bukti[1].id)
                    : temuan[0]
                      ? livePhotoUrl(temuan[0].id)
                      : undefined,
              },
            ] as const;
          } catch {
            return [id, {}] as const;
          }
        }),
      );
      if (!batal) {
        setPeta(Object.fromEntries(hasil));
        setSelesai(true);
      }
    })();
    return () => {
      batal = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kunci]);
  return { peta, selesai };
}

function mapStatusAlat(st?: string): string {
  if (st === 'LAYAK') return 'STANDAR';
  if (st === 'TIDAK_LAYAK' || st === 'HILANG') return 'DIBAWAH';
  return 'STANDAR';
}

function splitCatatanHydrant(raw: string): { temuan: string; rekomendasi: string } {
  const parsed = uraiCatatan(raw);
  const temuanParts: string[] = [];
  for (const [key, label] of Object.entries(LABEL_KOMPONEN)) {
    const val = parsed.catatanKomponen[key]?.trim();
    if (val) temuanParts.push(`${label}: ${val}`);
  }
  if (parsed.tambahan.trim()) temuanParts.push(parsed.tambahan.trim());
  return {
    temuan: temuanParts.join('\n'),
    rekomendasi: parsed.tindakLanjut.trim(),
  };
}

export const HydrantPrintPreview: React.FC<HydrantPrintPreviewProps> = ({
  bulan,
  modeAwal = 'checklist',
  autoPrint,
  onKembali,
}) => {
  const period = /^\d{4}-\d{2}$/.test(bulan ?? '') ? (bulan as string) : bulanBerjalan();
  const [mode, setMode] = useState<ModeCetakHydrant>(modeAwal);

  const lokasi = useKonteksLokasi();
  const unitQuery = useUnitHidran();
  const inspeksiQuery = useInspeksiHidran();

  const unitSite = useMemo(
    () => (unitQuery.data ?? []).filter((u) => u.siteId === lokasi.siteId),
    [unitQuery.data, lokasi.siteId],
  );
  const inspeksiSite = useMemo(() => {
    const idUnit = new Set(unitSite.map((u) => u.id));
    return (inspeksiQuery.data ?? []).filter((i) => idUnit.has(i.unitId));
  }, [inspeksiQuery.data, unitSite]);

  const units = useMemo(
    () => petakanUnitHidran(unitSite, inspeksiSite, lokasi.zonaIdKeNama, period),
    [unitSite, inspeksiSite, lokasi.zonaIdKeNama, period],
  );

  const inspeksiBulan = useMemo(
    () => inspeksiSite.filter((i) => i.period.startsWith(period)),
    [inspeksiSite, period],
  );
  const perUnit = useMemo(() => new Map(inspeksiBulan.map((i) => [i.unitId, i])), [inspeksiBulan]);

  const { peta: buktiSlot, selesai: buktiSelesai } = useBuktiHydrant(
    useMemo(() => inspeksiBulan.map((i) => i.id), [inspeksiBulan]),
  );

  const jangkarTemuan = inspeksiBulan[0]?.id ?? null;
  const fotoTemuan = useFotoInspeksi(jangkarTemuan, 'hydrant');

  const monthDate = useMemo(() => {
    const [y, m] = period.split('-').map(Number);
    return new Date(y, m - 1, 1);
  }, [period]);
  const monthLabel = format(monthDate, 'MMMM yyyy', { locale: idLocale });
  const namaBulanDefault = format(monthDate, 'MMMM', { locale: idLocale });
  const tahunDefault = period.slice(0, 4);

  const tanggalDaftarDefault = useMemo(() => {
    const hari = [
      ...new Set(
        inspeksiBulan
          .map((i) => {
            const m = i.createdAt.match(/\d{4}-\d{2}-(\d{2})/);
            return m ? Number(m[1]) : NaN;
          })
          .filter((n) => Number.isFinite(n)),
      ),
    ].sort((a, b) => a - b);
    if (hari.length === 0) return `16 dan 18 ${monthLabel}`;
    if (hari.length === 1) return `${hari[0]} ${monthLabel}`;
    return `${hari.slice(0, -1).join(', ')} dan ${hari[hari.length - 1]} ${monthLabel}`;
  }, [inspeksiBulan, monthLabel]);

  // Customizable Header fields
  const [judulChecklist, setJudulChecklist] = useState('CHECKLIST BULANAN HYDRANT');
  const [judulLaporan, setJudulLaporan] = useState('LAPORAN PEMERIKSAAN HYDRANT');
  const [headerLokasi, setHeaderLokasi] = useState('');
  const [headerPeriode, setHeaderPeriode] = useState('');
  const [headerTanggal, setHeaderTanggal] = useState('');
  const [headerKeterangan, setHeaderKeterangan] = useState('Keterangan : Standar (✓), Tidak Standar (X)');

  // Handsign / Penandatangan (kosongkan jika tidak ingin dicetak)
  const [petugasHeader, setPetugasHeader] = useState('Petugas Pemeriksa :');
  const [petugasNama, setPetugasNama] = useState('Takamay Jason Hermantika Irsyad');
  const [petugasJabatan, setPetugasJabatan] = useState('Junior HSE Analyst');
  const [mengetahuiHeader, setMengetahuiHeader] = useState('Mengetahui / Disetujui Oleh :');
  const [mengetahuiNama, setMengetahuiNama] = useState('Hizri');
  const [mengetahuiJabatan, setMengetahuiJabatan] = useState('Governance, Risk, HSE & Quality Group Head');

  const resolvedSite = (headerLokasi.trim() || lokasi.siteName || 'KANTOR PUSAT').toUpperCase();

  const payloadChecklist: HydrantMonthlyPrintPayload = useMemo(
    () => ({
      documentTitle: judulChecklist.trim() || 'CHECKLIST BULANAN HYDRANT',
      documentSubtitle: resolvedSite,
      siteName: resolvedSite,
      period: headerPeriode.trim() || monthLabel,
      inspectionDate: headerTanggal.trim() || tanggalDaftarDefault,
      rows: units.map((u, idx) => {
        const insp = perUnit.get(u.id);
        const slot = insp ? buktiSlot[insp.id] : undefined;
        const st = insp?.overallStatus ?? u.completedReport?.overallStatus ?? u.draftDetails?.overallStatus;
        return {
          no: idx + 1,
          zoneName: u.zoneName,
          kode: u.kode.replace(/^Hydrant\s*/i, ''),
          pemeriksaanSrc: slot?.pemeriksaan ?? null,
          checklistSrc: slot?.checklist ?? null,
          statusText: statusTeksHydrant(st),
        };
      }),
      temuan: (fotoTemuan.data ?? [])
        .filter((f) => f.temuan)
        .map((f, idx) => ({
          no: idx + 1,
          src: f.url,
          caption: f.caption || 'Catatan temuan tambahan',
        })),
      signatures: {
        petugasHeader,
        petugasNama,
        petugasJabatan,
        mengetahuiHeader,
        mengetahuiNama,
        mengetahuiJabatan,
      },
    }),
    [
      judulChecklist,
      resolvedSite,
      headerPeriode,
      monthLabel,
      headerTanggal,
      tanggalDaftarDefault,
      units,
      perUnit,
      buktiSlot,
      fotoTemuan.data,
      petugasHeader,
      petugasNama,
      petugasJabatan,
      mengetahuiHeader,
      mengetahuiNama,
      mengetahuiJabatan,
    ],
  );

  const payloadLaporan: HydrantLaporanPrintPayload = useMemo(
    () => ({
      documentTitle: judulLaporan.trim() || 'LAPORAN PEMERIKSAAN HYDRANT',
      keteranganLabel: headerKeterangan.trim() || 'Keterangan : Standar (✓), Tidak Standar (X)',
      tahun: tahunDefault,
      bulan: headerPeriode.trim() || namaBulanDefault,
      siteName: resolvedSite,
      rows: units.map((u, idx) => {
        const insp = perUnit.get(u.id);
        const rawNotes = insp?.notes ?? u.completedReport?.summaryNotes ?? u.draftDetails?.notes ?? '';
        const { temuan, rekomendasi } = splitCatatanHydrant(rawNotes);
        return {
          no: idx + 1,
          kode: u.kode,
          box: mapStatusAlat(insp?.boxHydrant ?? u.draftDetails?.boxHydrant),
          hose: mapStatusAlat(insp?.fireHose ?? u.draftDetails?.fireHose),
          coupling: mapStatusAlat(insp?.hoseCoupling ?? u.draftDetails?.hoseCoupling),
          rack: mapStatusAlat(insp?.hoseRack ?? u.draftDetails?.hoseRack),
          nozzle: mapStatusAlat(insp?.nozzle ?? u.draftDetails?.nozzle),
          valve: mapStatusAlat(insp?.valvePillar ?? u.draftDetails?.valvePillar),
          tanggal: tanggalSingkat(insp?.createdAt),
          petugas: petugasNama.trim(),
          temuan,
          rekomendasi,
        };
      }),
      signatures: {
        petugasHeader,
        petugasNama,
        petugasJabatan,
        mengetahuiHeader,
        mengetahuiNama,
        mengetahuiJabatan,
      },
    }),
    [
      judulLaporan,
      headerKeterangan,
      tahunDefault,
      headerPeriode,
      namaBulanDefault,
      resolvedSite,
      units,
      perUnit,
      petugasHeader,
      petugasNama,
      petugasJabatan,
      mengetahuiHeader,
      mengetahuiNama,
      mengetahuiJabatan,
    ],
  );

  const sheetsHtml = useMemo(() => {
    if (mode === 'laporan') return renderHydrantLaporanSheet(payloadLaporan);
    if (mode === 'semua') {
      return `${renderHydrantMonthlySheets(payloadChecklist)}\n${renderHydrantLaporanSheet(payloadLaporan)}`;
    }
    return renderHydrantMonthlySheets(payloadChecklist);
  }, [mode, payloadChecklist, payloadLaporan]);

  const isLandscape = mode === 'laporan';
  const memuat = unitQuery.isPending || inspeksiQuery.isPending || !buktiSelesai;

  useEffect(() => {
    if (!autoPrint || memuat) return;
    const t = window.setTimeout(() => {
      window.print();
    }, 350);
    return () => window.clearTimeout(t);
  }, [autoPrint, memuat]);

  const resetDefaults = () => {
    setJudulChecklist('CHECKLIST BULANAN HYDRANT');
    setJudulLaporan('LAPORAN PEMERIKSAAN HYDRANT');
    setHeaderLokasi('');
    setHeaderPeriode('');
    setHeaderTanggal('');
    setHeaderKeterangan('Keterangan : Standar (✓), Tidak Standar (X)');
    setPetugasHeader('Petugas Pemeriksa :');
    setPetugasNama('Takamay Jason Hermantika Irsyad');
    setPetugasJabatan('Junior HSE Analyst');
    setMengetahuiHeader('Mengetahui / Disetujui Oleh :');
    setMengetahuiNama('Hizri');
    setMengetahuiJabatan('Governance, Risk, HSE & Quality Group Head');
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen overflow-y-auto bg-[#fafafa] print:bg-white text-neutral-900 px-6 py-4 print:p-0 font-sans select-none">
      <style>{`@page { size: A4 ${isLandscape ? 'landscape' : 'portrait'}; margin: ${
        isLandscape ? '8mm 10mm' : '10mm 12mm'
      }; }\n${PROCEDURAL_PRINT_CSS}`}</style>

      <PrintCustomizationBar
        backLabel="← Kembali ke Halaman Hydrant"
        onKembali={onKembali}
        title={
          mode === 'checklist'
            ? 'Pratinjau Cetak Checklist Bulanan Hydrant'
            : mode === 'laporan'
              ? 'Pratinjau Cetak Laporan Pemeriksaan Hydrant'
              : 'Pratinjau Cetak Hydrant Lengkap'
        }
        subtitle={`${lokasi.siteName} · Periode ${period}`}
        memuat={memuat}
        onPrint={() => window.print()}
        onResetDefaults={resetDefaults}
        onClearSigners={() => {
          setPetugasNama('');
          setMengetahuiNama('');
        }}
        modeSelector={
          <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-[6px] border border-neutral-200 text-xs">
            <button
              type="button"
              onClick={() => setMode('checklist')}
              className={`px-2.5 py-1 rounded-[4px] font-semibold cursor-pointer pressable ${
                mode === 'checklist' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              1. Checklist (Portrait)
            </button>
            <button
              type="button"
              onClick={() => setMode('laporan')}
              className={`px-2.5 py-1 rounded-[4px] font-semibold cursor-pointer pressable ${
                mode === 'laporan' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              2. Laporan (Landscape)
            </button>
            <button
              type="button"
              onClick={() => setMode('semua')}
              className={`px-2.5 py-1 rounded-[4px] font-semibold cursor-pointer pressable ${
                mode === 'semua' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Gabungan
            </button>
          </div>
        }
        headerFields={[
          {
            key: 'judul',
            label: mode === 'laporan' ? 'Judul Laporan' : 'Judul Checklist',
            value: mode === 'laporan' ? judulLaporan : judulChecklist,
            onChange: mode === 'laporan' ? setJudulLaporan : setJudulChecklist,
          },
          {
            key: 'lokasi',
            label: 'Lokasi / Subjudul',
            value: headerLokasi,
            onChange: setHeaderLokasi,
            placeholder: lokasi.siteName || 'KANTOR PUSAT',
          },
          {
            key: 'periode',
            label: mode === 'laporan' ? 'Bulan' : 'Periode',
            value: headerPeriode,
            onChange: setHeaderPeriode,
            placeholder: mode === 'laporan' ? namaBulanDefault : monthLabel,
          },
          mode === 'laporan'
            ? {
                key: 'keterangan',
                label: 'Teks Keterangan',
                value: headerKeterangan,
                onChange: setHeaderKeterangan,
              }
            : {
                key: 'tanggal',
                label: 'Tanggal Inspeksi',
                value: headerTanggal,
                onChange: setHeaderTanggal,
                placeholder: tanggalDaftarDefault,
              },
        ]}
        signerFields={[
          {
            id: 'petugas',
            headerLabel: petugasHeader,
            onHeaderLabelChange: setPetugasHeader,
            nama: petugasNama,
            onNamaChange: setPetugasNama,
            jabatan: petugasJabatan,
            onJabatanChange: setPetugasJabatan,
          },
          {
            id: 'mengetahui',
            headerLabel: mengetahuiHeader,
            onHeaderLabelChange: setMengetahuiHeader,
            nama: mengetahuiNama,
            onNamaChange: setMengetahuiNama,
            jabatan: mengetahuiJabatan,
            onJabatanChange: setMengetahuiJabatan,
          },
        ]}
      />

      {memuat ? (
        <p className="no-print text-xs text-neutral-600 tabular-nums text-center py-8">
          Memuat data inspeksi Hydrant…
        </p>
      ) : (
        <div className="procedural-print-canvas">
          <div dangerouslySetInnerHTML={{ __html: sheetsHtml }} />
          <div id="pdf-ready" data-status="ready"></div>
        </div>
      )}
    </div>
  );
};
