import React from 'react';
import { useSesi } from '@/features/auth';
import { useAksiPersetujuan } from '@/services/api/queries';
import type {
  AksiPersetujuan,
  ApiStatusPersetujuan,
  KategoriPersetujuan,
} from '@/services/api/klien';

export const LABEL_STATUS: Record<ApiStatusPersetujuan, string> = {
  DRAFT: 'Draf',
  DIAJUKAN: 'Diajukan',
  DIKETAHUI: 'Diketahui',
  DISETUJUI: 'Disetujui',
};

const TONE: Record<ApiStatusPersetujuan, string> = {
  DISETUJUI:
    'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  DIKETAHUI: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
  DIAJUKAN: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  DRAFT: 'bg-[var(--bg-hover)] text-[var(--muted)] border-[var(--border)]',
};

/**
 * Satu bilah persetujuan untuk semua halaman inspeksi. Memanggil
 * POST /api/approvals/:category/:refId/approval; pengirim tidak dapat
 * menyetujui laporannya sendiri (aturan sisi API juga menolak dengan 403).
 */
interface ApprovalBarProps {
  category: KategoriPersetujuan;
  /** ID baris inspeksi/laporan; null = belum tersimpan (bilah nonaktif). */
  refId: string | null;
  status: ApiStatusPersetujuan;
  submittedById: string | null;
  accent: string;
}

const AksiTombol: {
  action: AksiPersetujuan;
  label: string;
  dari: ApiStatusPersetujuan;
  title: string;
  utama?: boolean;
}[] = [
  {
    action: 'ajukan',
    label: 'Ajukan',
    dari: 'DRAFT',
    title: 'Kirim laporan draf ke proses persetujuan',
  },
  {
    action: 'ketahui',
    label: 'Ketahui',
    dari: 'DIAJUKAN',
    title: 'Mengetahui laporan yang diajukan',
  },
  {
    action: 'setujui',
    label: 'Setujui',
    dari: 'DIKETAHUI',
    title: 'Menyetujui laporan (tidak oleh pengirim sendiri)',
    utama: true,
  },
];

export const ApprovalBar: React.FC<ApprovalBarProps> = ({
  category,
  refId,
  status,
  submittedById,
  accent,
}) => {
  const sesi = useSesi();
  const aksi = useAksiPersetujuan();
  const pengirim = submittedById != null && sesi.data?.id === submittedById;

  const boleh = (action: AksiPersetujuan, dari: ApiStatusPersetujuan) => {
    if (!refId || aksi.isPending) return false;
    if (status !== dari) return false;
    if (action === 'setujui' && pengirim) return false;
    return true;
  };

  const jalankan = (action: AksiPersetujuan) => {
    if (!refId) return;
    aksi.mutate({ category, refId, action });
  };

  return (
    <div className="no-print flex flex-col sm:flex-row sm:items-center gap-3 mb-4 p-3 rounded-[6px] border border-[var(--border)] bg-[var(--bg-sidebar)]/60">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
          Status Laporan
        </span>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-[3px] text-[11px] font-bold border tabular-nums ${TONE[status]}`}
        >
          {LABEL_STATUS[status]}
        </span>
      </div>
      {pengirim && status !== 'DRAFT' && (
        <p className="text-[11px] text-[var(--muted)]">
          Anda pengirim laporan ini — persetujuan oleh pihak lain.
        </p>
      )}
      <div className="flex items-center gap-1.5 flex-wrap sm:ml-auto">
        {AksiTombol.map((t) => {
          const bisa = boleh(t.action, t.dari);
          return (
            <button
              key={t.action}
              type="button"
              disabled={!bisa}
              onClick={() => jalankan(t.action)}
              title={
                !refId
                  ? 'Simpan laporan dahulu untuk mengajukan persetujuan'
                  : t.action === 'setujui' && pengirim
                    ? 'Pengirim laporan tidak dapat menyetujuinya sendiri'
                    : t.title
              }
              style={t.utama && bisa ? { backgroundColor: accent } : undefined}
              className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-[4px] border cursor-pointer pressable disabled:opacity-40 disabled:cursor-not-allowed ${
                t.utama && bisa
                  ? 'border-transparent text-white'
                  : 'border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)]'
              }`}
            >
              {aksi.isPending ? 'Memproses…' : t.label}
            </button>
          );
        })}
        {status !== 'DRAFT' && (
          <button
            type="button"
            disabled={!refId || aksi.isPending}
            onClick={() => jalankan('kembalikan')}
            title="Kembalikan laporan ke draf untuk diperbaiki"
            className="px-2.5 py-1.5 text-[11px] font-semibold rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] cursor-pointer pressable disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Kembalikan
          </button>
        )}
      </div>
    </div>
  );
};
