import React from 'react';
import { Camera } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { EmptyState, PhotoCard } from '@/components/ui';
import type { TemuanPatroliTampil } from '@/services/api/pemetaan-umpan';

interface PatrolFeedProps {
  /** Temuan bulan terpilih yang lolos saringan, terbaru dulu (diurutkan laman). */
  findings: TemuanPatroliTampil[];
  /** Jumlah temuan bulan terpilih sebelum saringan caption. */
  totalBulan: number;
  /** Laman membuka ConfirmModal; hapus nyata menunggu konfirmasi. */
  onHapus: (id: string) => void;
}

function fmtTanggal(iso: string): string {
  try {
    return format(parseISO(iso), 'd MMMM yyyy', { locale: idLocale });
  } catch {
    return iso || '–';
  }
}

/**
 * Umpan foto patroli: bahasa kartu yang sama dengan Section B Hydrant (grid
 * 2 kolom, kartu foto, hover-delete, print-clean) plus baris kepala
 * tanggal + lencana netral per kartu. Presentasional: pengurutan dan
 * penyaringan bulan hidup di laman.
 */
export const PatrolFeed: React.FC<PatrolFeedProps> = ({ findings, totalBulan, onHapus }) => {
  if (totalBulan === 0) {
    return (
      <div className="no-print">
        <EmptyState
          icon={<Camera size={24} />}
          title="Belum ada foto patroli"
          hint="Klik tombol “Tambah Foto” untuk menambah dokumentasi lapangan."
        />
      </div>
    );
  }

  if (findings.length === 0) {
    return (
      <div className="no-print">
        <EmptyState
          icon={<Camera size={24} />}
          title="Tidak ada foto yang cocok"
          hint="Ubah kata kunci pencarian atau pilih bulan lain."
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full px-2 sm:px-4">
      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-y-10 sm:gap-y-12 print:max-w-none print:grid-cols-2 print:gap-x-24 print:gap-y-10"
        style={{ columnGap: 'clamp(3.5rem, 7vw, 6.5rem)' }}
      >
        {findings.map((temuan) => (
          <div
            key={temuan.id}
            className="flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between gap-2 px-1 pb-2 print:px-0">
              <span className="text-[11px] font-semibold text-[var(--muted)] tabular-nums print:text-black">
                {fmtTanggal(temuan.tanggal)}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-[3px] border bg-[var(--bg-hover)] text-[var(--secondary)] border-[var(--border)] print:border-black print:text-black">
                Tersimpan
              </span>
            </div>
            <PhotoCard
              imageUrl={temuan.photoUrl}
              caption={temuan.caption}
              onDelete={() => onHapus(temuan.id)}
              deleteTitle="Hapus foto patroli"
            />
          </div>
        ))}
      </div>
    </div>
  );
};
