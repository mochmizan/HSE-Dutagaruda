import React from 'react';
import { Camera, Trash2 } from 'lucide-react';
import { FileFotoButton } from '@/components/ui';
import type { HydrantUnitItem } from '../../types/hse';
import type { FotoTampil } from '@/services/api/queries';

const KETERANGAN_FOTO = 'Bukti inspeksi';

interface HydrantInspectionPhotosProps {
  foto: FotoTampil[];
  mengunggah: boolean;
  terbit: boolean;
  /** Potret nilai form saat unggah: foto ikut menyimpan status komponen. */
  nilaiDraf: NonNullable<HydrantUnitItem['draftDetails']>;
  onUnggahFoto: (file: File, caption: string, nilai?: HydrantUnitItem['draftDetails']) => void;
  onHapusFoto: (fotoId: string) => void;
}

/**
 * Foto Bukti Fisik — unggahan nyata ke Garage via /api/uploads.
 * Satu kartu selebar satu kolom: kontrol unggah di atas, pratinjau foto
 * bertumpuk di bawahnya.
 */
export const HydrantInspectionPhotos: React.FC<HydrantInspectionPhotosProps> = ({
  foto,
  mengunggah,
  terbit,
  nilaiDraf,
  onUnggahFoto,
  onHapusFoto,
}) => (
  <div className="space-y-1">
    <label className="text-xs font-semibold text-[var(--primary)] flex items-center gap-1.5">
      <Camera size={13} />
      <span>Foto Bukti Fisik Inspeksi</span>
    </label>
    <div className="grid grid-cols-2 gap-2 items-start">
      <div className="rounded-[5px] border border-[var(--border)] bg-[var(--bg-main)] p-2 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-[var(--primary)]">Bukti Inspeksi</p>
            <p className="text-[10px] text-[var(--muted)]">
              Dokumentasi kondisi fisik unit
            </p>
          </div>
          {!terbit && (
            <FileFotoButton
              sibuk={mengunggah}
              onFile={(file) => onUnggahFoto(file, KETERANGAN_FOTO, nilaiDraf)}
            />
          )}
        </div>

        {foto.length === 0 ? (
          <div className="rounded-[5px] border border-dashed border-[var(--border-strong)] py-4 flex items-center justify-center text-[10px] text-[var(--muted)]">
            Belum ada foto
          </div>
        ) : (
          <div className="space-y-2">
            {foto.map((f) => (
              <div
                key={f.id}
                className="relative rounded-[5px] border border-[var(--border)] bg-[var(--bg-main)] p-1 group"
              >
                <img
                  src={f.url}
                  alt={f.caption}
                  className="w-full h-auto object-contain rounded-[3px] image-outline"
                />
                <button
                  type="button"
                  onClick={() => onHapusFoto(f.id)}
                  title="Hapus foto"
                  className={terbit ? 'hidden' : 'absolute top-2 right-2 w-5 h-5 rounded-full bg-black/65 text-white/90 hover:text-red-400 flex items-center justify-center cursor-pointer'}
                >
                  <Trash2 size={10} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);
