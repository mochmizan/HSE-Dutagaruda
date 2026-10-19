import React from 'react';
import { Camera } from 'lucide-react';
import { PhotoCard } from '@/components/ui';
import type { HydrantFindingItem } from './types';

interface HydrantFindingsProps {
  findings: HydrantFindingItem[];
  onTambah: () => void;
  onHapus: (id: string) => void;
  aksen: string;
}

/**
 * Section B halaman Hydrant: catatan hasil temuan sebagai kartu foto.
 *
 * Dipisah dari HydrantPage. Hanya foto bertanda `temuan` yang sampai ke sini;
 * penyaringan itu dilakukan halaman, bukan komponen ini.
 */
export const HydrantFindings: React.FC<HydrantFindingsProps> = ({ findings, onTambah, onHapus, aksen }) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between gap-3">
      <div>
        <h2 className="text-sm font-bold text-[var(--primary)] tracking-tight print:text-black print:text-sm">
          B. Catatan Hasil temuan
        </h2>
        <p className="no-print text-xs text-[var(--muted)] mt-0.5">
          Dokumentasi foto dan catatan fisik ketidaksesuaian unit hydrant di lapangan
        </p>
      </div>

      <button
        type="button"
        onClick={onTambah}
        style={{ backgroundColor: aksen }}
        className="no-print px-3 py-1.5 text-xs font-semibold rounded-[4px] text-white shadow-2xs cursor-pointer flex items-center gap-1.5 pressable disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Camera size={13} strokeWidth={2.2} />
        <span>Tambah Temuan</span>
      </button>
    </div>

    {findings.length === 0 ? (
      <div className="p-8 rounded-[6px] border border-dashed border-[var(--border)] text-center text-xs text-[var(--muted)] space-y-2">
        <Camera size={24} className="mx-auto text-[var(--muted)] opacity-60" />
        <p className="font-semibold text-[var(--secondary)]">Belum ada catatan hasil temuan</p>
        <p className="text-[11px]">
          Klik tombol &quot;+ Tambah Temuan&quot; untuk menambahkan dokumentasi foto temuan fisik.
        </p>
      </div>
    ) : (
      <div className="max-w-4xl mx-auto w-full px-2 sm:px-4">
        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-y-10 sm:gap-y-12 print:max-w-none print:grid-cols-2 print:gap-x-24 print:gap-y-10"
          style={{ columnGap: 'clamp(3.5rem, 7vw, 6.5rem)' }}
        >
          {findings.map((finding) => (
            <PhotoCard
              key={finding.id}
              imageUrl={finding.imageUrl}
              caption={finding.description}
              onDelete={() => onHapus(finding.id)}
              deleteTitle="Hapus temuan"
            />
          ))}
        </div>
      </div>
    )}
  </div>
);
