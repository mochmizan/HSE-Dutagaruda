import React, { useEffect, useMemo, useState } from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { formatIndonesianDate } from '@/lib/dates';
import {
  PROCEDURAL_PRINT_CSS,
  renderAparCardSheet,
  renderAparMonthlySheets,
  type AparCardPrintPayload,
  type AparMonthlyExpiryRow,
  type AparMonthlyPrintPayload,
  type AparMonthlyPrintRow,
} from '@/lib/proceduralPrintTemplates';
import { formatNoList } from './kartuApar';
import { ambilFotoInspeksi } from '@/services/api/klien';
import { livePhotoUrl } from '@/services/api/liveClient';
import { petakanUnitApar, useInspeksiApar, useUnitApar } from '@/services/api/queries';
import { useKonteksLokasi } from '@/features/konteksLokasi';

export type ModeCetakApar = 'bulanan' | 'kartu';

interface AparPrintPreviewProps {
  bulan?: string;
  modeAwal?: ModeCetakApar;
  unitAwal?: string;
  tahunAwal?: string;
  autoPrint?: boolean;
  onKembali: () => void;
}

function bulanBerjalan(): string {
  return format(new Date(), 'yyyy-MM');
}

interface FotoSlot {
  kartu?: string;
  berat?: string;
  cek: string[];
}

function useFotoSlotApar(inspeksiIds: string[]): { peta: Record<string, FotoSlot>; selesai: boolean } {
  const [peta, setPeta] = useState<Record<string, FotoSlot>>({});
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
            const res = await ambilFotoInspeksi('apar', id);
            const slot: FotoSlot = { cek: [] };
            for (const f of res.items) {
              if (f.temuan) continue;
              const caption = (f.caption ?? '').trim().toLowerCase();
              const url = livePhotoUrl(f.id);
              if ((caption.includes('kartu') || caption.includes('checklist')) && !slot.kartu) slot.kartu = url;
              else if ((caption.includes('berat') || caption.includes('co2')) && !slot.berat) slot.berat = url;
              else slot.cek.push(url);
            }
            return [id, slot] as const;
          } catch {
            return [id, { cek: [] }] as const;
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

function pecahTanggalSlot(iso?: string | null): [string, string, string] {
  if (!iso) return ['', '', ''];
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return ['', '', ''];
  return [String(Number(m[3])), String(Number(m[2])), m[1].slice(2)];
}

export const AparPrintPreview: React.FC<AparPrintPreviewProps> = ({
  bulan,
  modeAwal = 'bulanan',
  unitAwal,
  tahunAwal,
  autoPrint,
  onKembali,
}) => {
  const period = /^\d{4}-\d{2}$/.test(bulan ?? '') ? (bulan as string) : bulanBerjalan();
  const [mode, setMode] = useState<ModeCetakApar>(modeAwal);
  const [tahunKartu, setTahunKartu] = useState<string>(
    () => (/^\d{4}$/.test(tahunAwal ?? '') ? (tahunAwal as string) : period.slice(0, 4)),
  );
  const [selectedUnitId, setSelectedUnitId] = useState<string | undefined>(unitAwal);

  // Handsign / Penandatangan (kosongkan jika tidak ingin dicetak)
  const [dibuatNama, setDibuatNama] = useState('Takamay Jason Hermantika Irsyad');
  const [dibuatJabatan, setDibuatJabatan] = useState('Junior HSE Analyst');
  const [diketahuiNama, setDiketahuiNama] = useState('');
  const [diketahuiJabatan, setDiketahuiJabatan] = useState('');
  const [disetujuiNama, setDisetujuiNama] = useState('Hizri');
  const [disetujuiJabatan, setDisetujuiJabatan] = useState('Governance, Risk, HSE & Quality Group Head');
  const [kartuPemeriksa, setKartuPemeriksa] = useState('Takamay Jason H. I.');
  const [kartuParaf, setKartuParaf] = useState('');

  const lokasi = useKonteksLokasi();
  const unitQuery = useUnitApar();
  const inspeksiQuery = useInspeksiApar();

  const unitSite = useMemo(
    () => (unitQuery.data ?? []).filter((u) => u.siteId === lokasi.siteId),
    [unitQuery.data, lokasi.siteId],
  );
  const inspeksiSite = useMemo(() => {
    const idUnit = new Set(unitSite.map((u) => u.id));
    return (inspeksiQuery.data ?? []).filter((i) => idUnit.has(i.unitId));
  }, [inspeksiQuery.data, unitSite]);

  const units = useMemo(
    () => petakanUnitApar(unitSite, inspeksiSite, lokasi.zonaIdKeNama, period),
    [unitSite, inspeksiSite, lokasi.zonaIdKeNama, period],
  );

  const unitAktif = useMemo(() => {
    if (selectedUnitId) {
      const byIdOrKode = units.find((u) => u.id === selectedUnitId || u.kode === selectedUnitId);
      if (byIdOrKode) return byIdOrKode;
    }
    return units[0] ?? null;
  }, [units, selectedUnitId]);

  const inspeksiBulan = useMemo(
    () => inspeksiSite.filter((i) => i.period.startsWith(period)),
    [inspeksiSite, period],
  );
  const inspeksiPerUnit = useMemo(() => {
    const peta = new Map<string, (typeof inspeksiBulan)[number]>();
    for (const i of inspeksiBulan) peta.set(i.unitId, i);
    return peta;
  }, [inspeksiBulan]);

  const inspeksiIds = useMemo(() => inspeksiBulan.map((i) => i.id), [inspeksiBulan]);
  const { peta: slotFoto, selesai: fotoSelesai } = useFotoSlotApar(inspeksiIds);

  const monthDate = useMemo(() => {
    const [y, m] = period.split('-').map(Number);
    return new Date(y, m - 1, 1);
  }, [period]);
  const monthLabel = format(monthDate, 'MMMM yyyy', { locale: idLocale });

  const tanggalInspeksi = useMemo(() => {
    if (inspeksiBulan.length === 0) return formatIndonesianDate(new Date());
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
    if (hari.length === 0) return monthLabel;
    if (hari.length === 1) return `${hari[0]} ${monthLabel}`;
    return `${hari.slice(0, -1).join(', ')} dan ${hari[hari.length - 1]} ${monthLabel}`;
  }, [inspeksiBulan, monthLabel]);

  const catatan = useMemo(() => {
    const unik: string[] = [];
    for (const i of inspeksiBulan) {
      const t = (i.notes ?? '').trim();
      if (t && !unik.includes(t)) unik.push(t);
    }
    return unik.join('\n');
  }, [inspeksiBulan]);

  const rows: AparMonthlyPrintRow[] = useMemo(
    () =>
      units.map((u, idx) => {
        const insp = inspeksiPerUnit.get(u.id);
        const slot = insp ? slotFoto[insp.id] : undefined;
        const tampil = formatIndonesianDate(u.expiredDate) || u.expiredDate;
        return {
          no: idx + 1,
          zoneName: u.zoneName,
          kode: u.kode.replace(/^APAR\s*/i, '').padStart(2, '0'),
          expiredDate: tampil,
          kartuSrc: slot?.kartu,
          beratSrc: slot?.berat,
          pengecekanSrc: slot?.cek[0],
          pengecekanExtraSrc: slot?.cek[1],
        };
      }),
    [units, inspeksiPerUnit, slotFoto],
  );

  const expiryRows: AparMonthlyExpiryRow[] = useMemo(() => {
    const grup = new Map<string, { kunci: number; no: number[] }>();
    rows.forEach((r) => {
      const key = String(r.expiredDate || '').trim();
      if (!key) return;
      const mentah = units[r.no - 1]?.expiredDate ?? '';
      const t = parseISO(mentah);
      const kunciUrut = isValid(t) ? t.getTime() : Number.POSITIVE_INFINITY;
      const g = grup.get(key) ?? { kunci: kunciUrut, no: [] };
      g.no.push(r.no);
      if (kunciUrut < g.kunci) g.kunci = kunciUrut;
      grup.set(key, g);
    });
    return [...grup.entries()]
      .sort((a, b) => a[1].kunci - b[1].kunci)
      .map(([periodeKadaluwarsa, g], idx) => ({
        no: idx < 3 ? `${idx + 1}.` : `${idx + 1}`,
        periodeKadaluwarsa,
        totalApar: g.no.length,
        noApar: formatNoList(g.no.map(String)),
      }));
  }, [rows, units]);

  const docBulanan: AparMonthlyPrintPayload = useMemo(
    () => ({
      siteName: lokasi.siteName,
      periodLabel: `Periode : ${monthLabel}`,
      inspectionDate: tanggalInspeksi,
      notes: catatan,
      signers: {
        dibuatNama,
        dibuatJabatan,
        diketahuiNama,
        diketahuiJabatan,
        disetujuiNama,
        disetujuiJabatan,
      },
      rows,
      expiryRows,
    }),
    [
      lokasi.siteName,
      monthLabel,
      tanggalInspeksi,
      catatan,
      dibuatNama,
      dibuatJabatan,
      diketahuiNama,
      diketahuiJabatan,
      disetujuiNama,
      disetujuiJabatan,
      rows,
      expiryRows,
    ],
  );

  const docKartu: AparCardPrintPayload | null = useMemo(() => {
    if (!unitAktif) return null;
    const rekamUnitTahun = inspeksiSite.filter(
      (i) => i.unitId === unitAktif.id && i.period.startsWith(`${tahunKartu}-`),
    );
    const perBulan = new Map<number, (typeof rekamUnitTahun)[number]>();
    for (const r of rekamUnitTahun) {
      const mIdx = Number(r.period.slice(5, 7)) - 1;
      if (mIdx >= 0 && mIdx < 12) perBulan.set(mIdx, r);
    }
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
    const months = monthLabels.map((bulanLabel, idx) => {
      const r = perBulan.get(idx);
      if (!r) {
        return { bulan: bulanLabel };
      }
      const dMatch = r.createdAt.match(/\d{4}-(\d{2})-(\d{2})/);
      const tanggal = dMatch ? `${Number(dMatch[2])}/${Number(dMatch[1])}` : `${idx + 1}/${idx + 1}`;
      return {
        bulan: bulanLabel,
        tanggal,
        safetyPin: r.safetyPin,
        corong: r.corong,
        segel: r.segel,
        tekanan: r.tekanan,
        tabung: r.tabung,
        selang: r.selang,
        katupTuas: r.katupTuas,
        namaPemeriksa: kartuPemeriksa.trim(),
        paraf: kartuParaf.trim(),
      };
    });

    const tRefill = pecahTanggalSlot(unitAktif.expiredDate);
    const expYear = Number(unitAktif.expiredDate.slice(0, 4));
    const refillYear =
      unitAktif.tahunPembuatan && unitAktif.tahunPembuatan >= 2000
        ? unitAktif.tahunPembuatan
        : Number.isFinite(expYear)
        ? expYear - 2
        : 2025;
    const tLast: [string, string, string] = tRefill[0]
      ? [tRefill[0], tRefill[1], String(refillYear).slice(2)]
      : ['', '', ''];

    return {
      tahun: tahunKartu,
      ukuran: unitAktif.ukuran || '3 kg',
      kode: unitAktif.kode.replace(/^APAR\s*/i, '').padStart(2, '0'),
      jenis: unitAktif.jenis === 'CO2' ? 'CO2' : 'Powder',
      zoneName: unitAktif.zoneName,
      siteName: lokasi.siteName,
      tglPengisianTerakhir: tLast,
      tglPengisianUlang: tRefill,
      months,
    };
  }, [unitAktif, inspeksiSite, tahunKartu, lokasi.siteName, kartuPemeriksa, kartuParaf]);

  const sheetsHtml = useMemo(() => {
    if (mode === 'kartu') {
      return docKartu ? renderAparCardSheet(docKartu) : '';
    }
    return renderAparMonthlySheets(docBulanan);
  }, [mode, docKartu, docBulanan]);

  const memuat = unitQuery.isPending || inspeksiQuery.isPending || !fotoSelesai;

  useEffect(() => {
    if (!autoPrint || memuat) return;
    const t = window.setTimeout(() => {
      window.print();
    }, 350);
    return () => window.clearTimeout(t);
  }, [autoPrint, memuat]);

  return (
    <div className="flex-1 flex flex-col min-h-screen overflow-y-auto bg-slate-100 text-slate-900 px-6 py-4 font-sans select-none">
      <style>{`@page { size: A4 portrait; margin: 10mm 12mm; }\n${PROCEDURAL_PRINT_CSS}`}</style>
      <div className="no-print space-y-3 pb-3 mb-4 border-b border-slate-300 bg-white px-4 py-3 rounded-[6px] shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onKembali}
            className="px-3 py-1.5 text-xs font-semibold rounded-[4px] border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 cursor-pointer pressable"
          >
            ← Kembali ke Halaman APAR
          </button>

          <div className="flex flex-col">
            <h1 className="text-sm font-bold tracking-tight text-slate-900">
              {mode === 'bulanan' ? 'Pratinjau Cetak Checklist Bulanan APAR' : 'Pratinjau Cetak Kartu Tahunan APAR'}
            </h1>
            <p className="text-xs text-slate-500 tabular-nums">
              {lokasi.siteName} · {mode === 'bulanan' ? `Periode ${period}` : `Tahun ${tahunKartu}`}
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-[5px] border border-slate-300 text-xs">
            <button
              type="button"
              onClick={() => setMode('bulanan')}
              className={`px-3 py-1 rounded-[4px] font-semibold cursor-pointer pressable ${
                mode === 'bulanan' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1. Checklist Bulanan (Portrait)
            </button>
            <button
              type="button"
              onClick={() => setMode('kartu')}
              className={`px-3 py-1 rounded-[4px] font-semibold cursor-pointer pressable ${
                mode === 'kartu' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2. Kartu Tahunan Unit (Hang-Tag)
            </button>
          </div>

          {mode === 'kartu' && units.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <label className="font-semibold text-slate-700">Unit:</label>
              <select
                value={unitAktif?.id ?? ''}
                onChange={(e) => setSelectedUnitId(e.target.value)}
                className="px-2.5 py-1 rounded-[4px] border border-slate-300 bg-white text-slate-900 font-semibold tabular-nums"
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.kode} ({u.zoneName})
                  </option>
                ))}
              </select>
              <label className="font-semibold text-slate-700">Tahun:</label>
              <select
                value={tahunKartu}
                onChange={(e) => setTahunKartu(e.target.value)}
                className="px-2.5 py-1 rounded-[4px] border border-slate-300 bg-white text-slate-900 font-semibold tabular-nums"
              >
                {['2025', '2026', '2027'].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={() => window.print()}
            disabled={memuat}
            className="ml-auto px-4 py-1.5 text-xs font-semibold rounded-[4px] text-white bg-[#2f80ed] hover:bg-[#2b77d4] cursor-pointer pressable disabled:opacity-40 disabled:cursor-not-allowed tabular-nums"
          >
            {memuat ? 'Memuat…' : 'Cetak / Simpan PDF'}
          </button>
        </div>

        {/* Kolom Handsign / Penandatangan — kosongkan jika bagian tersebut tidak perlu dicetak */}
        <div className="pt-2.5 border-t border-slate-200 flex flex-wrap items-end gap-2 text-[11px]">
          <span className="font-bold text-slate-700 mr-1 self-center">
            Handsign / Penandatangan <span className="font-normal text-slate-500">(kosongkan jika tidak dicetak):</span>
          </span>
          {mode === 'bulanan' ? (
            <>
              <input
                type="text"
                value={dibuatNama}
                onChange={(e) => setDibuatNama(e.target.value)}
                placeholder="Nama Pemeriksa"
                className="w-44 px-2 py-1 rounded border border-slate-300 bg-white text-slate-900"
              />
              <input
                type="text"
                value={dibuatJabatan}
                onChange={(e) => setDibuatJabatan(e.target.value)}
                placeholder="Jabatan Pemeriksa"
                className="w-36 px-2 py-1 rounded border border-slate-300 bg-white text-slate-900"
              />
              <input
                type="text"
                value={diketahuiNama}
                onChange={(e) => setDiketahuiNama(e.target.value)}
                placeholder="Diketahui Oleh (opsional)"
                className="w-40 px-2 py-1 rounded border border-slate-300 bg-white text-slate-900"
              />
              <input
                type="text"
                value={diketahuiJabatan}
                onChange={(e) => setDiketahuiJabatan(e.target.value)}
                placeholder="Jabatan Diketahui"
                className="w-32 px-2 py-1 rounded border border-slate-300 bg-white text-slate-900"
              />
              <input
                type="text"
                value={disetujuiNama}
                onChange={(e) => setDisetujuiNama(e.target.value)}
                placeholder="Disetujui Oleh"
                className="w-36 px-2 py-1 rounded border border-slate-300 bg-white text-slate-900"
              />
              <input
                type="text"
                value={disetujuiJabatan}
                onChange={(e) => setDisetujuiJabatan(e.target.value)}
                placeholder="Jabatan Disetujui"
                className="w-48 px-2 py-1 rounded border border-slate-300 bg-white text-slate-900"
              />
            </>
          ) : (
            <>
              <input
                type="text"
                value={kartuPemeriksa}
                onChange={(e) => setKartuPemeriksa(e.target.value)}
                placeholder="Nama Pemeriksa (kosong = tidak diisi)"
                className="w-52 px-2 py-1 rounded border border-slate-300 bg-white text-slate-900"
              />
              <input
                type="text"
                value={kartuParaf}
                onChange={(e) => setKartuParaf(e.target.value)}
                placeholder="Paraf Pemeriksa (kosong = kosong)"
                className="w-48 px-2 py-1 rounded border border-slate-300 bg-white text-slate-900"
              />
            </>
          )}
        </div>
      </div>

      {memuat ? (
        <p className="no-print text-xs text-slate-600 tabular-nums">Memuat data inspeksi APAR…</p>
      ) : (
        <div className="procedural-print-canvas">
          <div dangerouslySetInnerHTML={{ __html: sheetsHtml }} />
          <div id="pdf-ready" data-status="ready"></div>
        </div>
      )}
    </div>
  );
};
