import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { PrintCustomizationBar } from '@/components/ui';
import { usePrintHeaderImages } from '@/lib/printHeaderConfig';
import { formatIndonesianDate } from '@/lib/dates';
import {
  PROCEDURAL_PRINT_CSS,
  renderPatrolReportSheets,
  type PatrolReportPrintPayload,
} from '@/lib/proceduralPrintTemplates';
import { useKonteksLokasi } from '@/features/konteksLokasi';
import { petakanTemuanPatroli, useLaporanPatroli } from '@/services/api/queries';

interface PatrolPrintPreviewProps {
  variant?: 'keamanan' | 'kebersihan';
  bulan?: string;
  autoPrint?: boolean;
  onKembali: () => void;
}

function bulanBerjalan(): string {
  return format(new Date(), 'yyyy-MM');
}

export const PatrolPrintPreview: React.FC<PatrolPrintPreviewProps> = ({
  variant = 'keamanan',
  bulan,
  autoPrint,
  onKembali,
}) => {
  const isKebersihan = variant === 'kebersihan';
  const defaultTitle = isKebersihan
    ? 'LAPORAN KEGIATAN SAFETY PATROL KEBERSIHAN'
    : 'LAPORAN KEGIATAN SAFETY PATROL KEAMANAN';
  const period = /^\d{4}-\d{2}$/.test(bulan ?? '') ? (bulan as string) : bulanBerjalan();
  const lokasi = useKonteksLokasi();
  const laporanQuery = useLaporanPatroli();

  const { config: headerLogos, setConfig: setHeaderLogos } = usePrintHeaderImages();

  // Customizable Header
  const [judulDokumen, setJudulDokumen] = useState(defaultTitle);
  const [headerLokasi, setHeaderLokasi] = useState('');
  const [headerTanggal, setHeaderTanggal] = useState('');

  // Handsign / Penandatangan (kosongkan jika tidak ingin dicetak)
  const [dibuatHeader, setDibuatHeader] = useState('Dibuat Oleh :');
  const [dibuatNama, setDibuatNama] = useState('Takamay Jason Hermantika Irsyad');
  const [dibuatJabatan, setDibuatJabatan] = useState('Junior HSE Analyst');
  const [diketahuiHeader, setDiketahuiHeader] = useState('Diketahui Oleh :');
  const [diketahuiNama, setDiketahuiNama] = useState('');
  const [diketahuiJabatan, setDiketahuiJabatan] = useState('');
  const [disetujuiHeader, setDisetujuiHeader] = useState('Disetujui Oleh :');
  const [disetujuiNama, setDisetujuiNama] = useState('Hizri');
  const [disetujuiJabatan, setDisetujuiJabatan] = useState('Governance, Risk, HSE & Quality Group Head');

  const laporanSite = useMemo(
    () => (laporanQuery.data ?? []).filter((l) => l.siteId === lokasi.siteId),
    [laporanQuery.data, lokasi.siteId],
  );
  const findings = useMemo(
    () =>
      petakanTemuanPatroli(laporanSite).filter((f) =>
        isKebersihan
          ? f.locationNote.startsWith('[KEBERSIHAN]')
          : !f.locationNote.startsWith('[KEBERSIHAN]'),
      ),
    [laporanSite, isKebersihan],
  );

  const umpanBulan = useMemo(
    () =>
      findings
        .filter((f) => f.tanggal.startsWith(period))
        .sort((a, b) => a.tanggal.localeCompare(b.tanggal)),
    [findings, period],
  );

  const monthDate = useMemo(() => {
    const [y, m] = period.split('-').map(Number);
    return new Date(y, m - 1, 1);
  }, [period]);
  const labelBulan = format(monthDate, 'MMMM yyyy', { locale: idLocale });

  const tanggalPatrolDefault = useMemo(() => {
    const terbaru = umpanBulan.at(-1)?.tanggal;
    return terbaru ? formatIndonesianDate(terbaru) : labelBulan;
  }, [umpanBulan, labelBulan]);

  const payload: PatrolReportPrintPayload = useMemo(() => {
    const namaSite = (headerLokasi.trim() || lokasi.siteName || 'KANTOR PUSAT').toUpperCase();
    return {
      headerLogos,
      documentTitle: judulDokumen.trim() || defaultTitle,
      siteName: namaSite,
      patrolDate: headerTanggal.trim() || tanggalPatrolDefault,
      findings: umpanBulan.map((f, idx) => ({
        no: idx + 1,
        src: f.photoUrl || null,
        caption: f.caption,
      })),
      signatures: {
        dibuatHeader,
        dibuatNama,
        dibuatJabatan,
        diketahuiHeader,
        diketahuiNama,
        diketahuiJabatan,
        disetujuiHeader,
        disetujuiNama,
        disetujuiJabatan,
      },
    };
  }, [
    headerLogos,
    judulDokumen,
    headerLokasi,
    lokasi.siteName,
    headerTanggal,
    tanggalPatrolDefault,
    umpanBulan,
    dibuatHeader,
    dibuatNama,
    dibuatJabatan,
    diketahuiHeader,
    diketahuiNama,
    diketahuiJabatan,
    disetujuiHeader,
    disetujuiNama,
    disetujuiJabatan,
  ]);

  const sheetsHtml = useMemo(() => renderPatrolReportSheets(payload), [payload]);
  const memuat = laporanQuery.isPending;

  useEffect(() => {
    if (!autoPrint || memuat) return;
    const t = window.setTimeout(() => {
      window.print();
    }, 350);
    return () => window.clearTimeout(t);
  }, [autoPrint, memuat]);

  const resetDefaults = () => {
    setJudulDokumen(defaultTitle);
    setHeaderLokasi('');
    setHeaderTanggal('');
    setDibuatHeader('Dibuat Oleh :');
    setDibuatNama('Takamay Jason Hermantika Irsyad');
    setDibuatJabatan('Junior HSE Analyst');
    setDiketahuiHeader('Diketahui Oleh :');
    setDiketahuiNama('');
    setDiketahuiJabatan('');
    setDisetujuiHeader('Disetujui Oleh :');
    setDisetujuiNama('Hizri');
    setDisetujuiJabatan('Governance, Risk, HSE & Quality Group Head');
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen overflow-y-auto bg-[#fafafa] print:bg-white text-neutral-900 px-6 py-4 print:p-0 font-sans select-none">
      <style>{`@page { size: A4 portrait; margin: 10mm 12mm; }\n${PROCEDURAL_PRINT_CSS}`}</style>

      <PrintCustomizationBar
        backLabel={isKebersihan ? "← Kembali ke Safety Patrol Kebersihan" : "← Kembali ke Safety Patrol Keamanan"}
        onKembali={onKembali}
        title={isKebersihan ? "Pratinjau Cetak Safety Patrol Kebersihan" : "Pratinjau Cetak Safety Patrol Keamanan"}
        subtitle={`${lokasi.siteName} · Periode ${period} (${umpanBulan.length} foto temuan)`}
        memuat={memuat}
        onPrint={() => window.print()}
        onResetDefaults={resetDefaults}
        onClearSigners={() => {
          setDibuatNama('');
          setDiketahuiNama('');
          setDisetujuiNama('');
        }}
        headerImageConfig={headerLogos}
        onHeaderImageChange={setHeaderLogos}
        headerFields={[
          {
            key: 'judul',
            label: 'Judul Dokumen',
            value: judulDokumen,
            onChange: setJudulDokumen,
          },
          {
            key: 'lokasi',
            label: 'Lokasi / Site',
            value: headerLokasi,
            onChange: setHeaderLokasi,
            placeholder: lokasi.siteName || 'KANTOR PUSAT',
          },
          {
            key: 'tanggal',
            label: 'Tanggal Patrol',
            value: headerTanggal,
            onChange: setHeaderTanggal,
            placeholder: tanggalPatrolDefault,
          },
        ]}
        signerFields={[
          {
            id: 'dibuat',
            headerLabel: dibuatHeader,
            onHeaderLabelChange: setDibuatHeader,
            nama: dibuatNama,
            onNamaChange: setDibuatNama,
            jabatan: dibuatJabatan,
            onJabatanChange: setDibuatJabatan,
          },
          {
            id: 'diketahui',
            headerLabel: diketahuiHeader,
            onHeaderLabelChange: setDiketahuiHeader,
            nama: diketahuiNama,
            onNamaChange: setDiketahuiNama,
            jabatan: diketahuiJabatan,
            onJabatanChange: setDiketahuiJabatan,
          },
          {
            id: 'disetujui',
            headerLabel: disetujuiHeader,
            onHeaderLabelChange: setDisetujuiHeader,
            nama: disetujuiNama,
            onNamaChange: setDisetujuiNama,
            jabatan: disetujuiJabatan,
            onJabatanChange: setDisetujuiJabatan,
          },
        ]}
      />

      {memuat ? (
        <p className="no-print text-xs text-neutral-600 tabular-nums text-center py-8">
          Memuat data Safety Patrol…
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
