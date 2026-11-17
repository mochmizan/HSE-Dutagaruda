import React, { useState } from 'react';
import { Camera, Clock, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { FileFotoButton } from '@/components/ui';
import type { HydrantUnitItem } from '../../types/hse';
import type { FotoTampil } from '@/services/api/queries';

const KETERANGAN_FOTO = 'Bukti inspeksi';

interface HydrantInspectionPhotosProps {
  foto: FotoTampil[];
  mengunggah: boolean;
  terbit: boolean;
  nilaiDraf: NonNullable<HydrantUnitItem['draftDetails']>;
  onUnggahFoto: (file: File, caption: string, nilai?: HydrantUnitItem['draftDetails']) => void;
  onHapusFoto: (fotoId: string) => void;
}

function formatWaktuSekarang(): string {
  return format(new Date(), "dd MMM yyyy · HH:mm:ss 'WIB'", { locale: idLocale });
}

/**
 * Langkah 1: Foto Bukti Fisik dilakukan lebih awal sebelum melakukan inspeksi,
 * dilengkapi Time Stamp otomatis.
 */
export const HydrantInspectionPhotos: React.FC<HydrantInspectionPhotosProps> = ({
  foto,
  mengunggah,
  terbit,
  nilaiDraf,
  onUnggahFoto,
  onHapusFoto,
}) => {
  const [waktuUnggahTerakhir, setWaktuUnggahTerakhir] = useState<string>(() => formatWaktuSekarang());

  return (
    <div className="space-y-2 rounded-[6px] border border-[#2383e2]/30 bg-[#2383e2]/[0.04] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-xs font-bold text-[var(--primary)] flex items-center gap-1.5">
          <Camera size={14} className="text-[#2383e2]" />
          <span>1. Foto Bukti Inspeksi Awal (Time Stamp)</span>
          <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-[#2383e2]/15 text-[#2383e2]">
            Wajib Sebelum Inspeksi
          </span>
        </label>
        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-[#2383e2] bg-[var(--bg-main)] px-2 py-0.5 rounded border border-[var(--border)] tabular-nums">
          <Clock size={11} />
          <span>Time Stamp: {waktuUnggahTerakhir}</span>
        </span>
      </div>

      <p className="text-[11px] text-[var(--secondary)]">
        Unggah foto bukti fisik unit hydrant sebelum mengisi daftar 6 komponen.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-start pt-1">
        <div className="rounded-[5px] border border-[var(--border)] bg-[var(--bg-main)] p-2.5 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-[var(--primary)] truncate">
                Dokumentasi Pengecekan
              </p>
              <p className="text-[10px] text-[var(--muted)] truncate">
                Foto kondisi unit &amp; time stamp
              </p>
            </div>
            {!terbit && (
              <FileFotoButton
                sibuk={mengunggah}
                onFile={(file) => {
                  const ts = formatWaktuSekarang();
                  setWaktuUnggahTerakhir(ts);
                  onUnggahFoto(file, KETERANGAN_FOTO, { ...nilaiDraf, photoTimestamp: ts });
                }}
              />
            )}
          </div>

          {foto.length === 0 ? (
            <div className="rounded-[5px] border border-dashed border-[var(--border-strong)] py-4 px-2 flex flex-col items-center justify-center text-center text-[10px] text-[var(--muted)] gap-1">
              <Camera size={16} className="opacity-50" />
              <span>Belum ada foto bukti</span>
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
                  <div className="mt-1 px-1.5 py-0.5 rounded bg-black/75 text-white text-[9px] font-mono flex items-center justify-between tabular-nums">
                    <span className="inline-flex items-center gap-1">
                      <Clock size={9} />
                      <span>Time Stamp</span>
                    </span>
                    <span>{waktuUnggahTerakhir}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onHapusFoto(f.id)}
                    title="Hapus foto"
                    className={
                      terbit
                        ? 'hidden'
                        : 'absolute top-2 right-2 w-5 h-5 rounded-full bg-black/65 text-white/90 hover:text-red-400 flex items-center justify-center cursor-pointer'
                    }
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
};
