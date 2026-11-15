import React from 'react';
import { Camera, Trash2 } from 'lucide-react';
import { FileFotoButton } from '@/components/ui';
import type { AparUnitItem } from '../../types/hse';
import type { FotoTampil } from '@/services/api/queries';

interface AparInspectionPhotosProps {
  foto: FotoTampil[];
  mengunggah: boolean;
  terbit: boolean;
  /** Potret nilai form saat unggah: foto ikut menyimpan status komponen. */
  nilaiDraf: NonNullable<AparUnitItem['draftDetails']>;
  powder: boolean;
  kode: string;
  onUnggahFoto: (file: File, caption: string, nilai?: AparUnitItem['draftDetails']) => void;
  onHapusFoto: (fotoId: string) => void;
}

const SLOT = [
  { slot: 'Kartu', keterangan: 'Kartu APAR', hint: 'Foto kartu gantung APAR' },
  { slot: 'Berat', keterangan: 'Penimbangan CO2', hint: 'Foto hasil penimbangan (CO₂)' },
  { slot: 'Pengecekan', keterangan: 'Pengecekan fisik', hint: 'Foto proses pengecekan fisik' },
] as const;

/**
 * Foto dokumentasi APAR — unggahan nyata ke Garage via /api/uploads.
 *
 * Tiga slot (Kartu/Berat/Pengecekan): tiap slot kartu berisi label + hint +
 * tombol unggah di atas, pratinjau di bawahnya, lebar kolom penuh.
 */
export const AparInspectionPhotos: React.FC<AparInspectionPhotosProps> = ({
  foto,
  mengunggah,
  terbit,
  nilaiDraf,
  powder,
  kode,
  onUnggahFoto,
  onHapusFoto,
}) => (
  <div className="space-y-1">
    <label className="text-xs font-semibold text-[var(--primary)] flex items-center gap-1.5">
      <Camera size={13} />
      <span>Foto Dokumentasi</span>
    </label>
    <div className="grid grid-cols-2 gap-2 items-start">
      {SLOT.map((f) => {
        const nonaktif = terbit || (f.slot === 'Berat' && powder);
        const slotFoto = foto.filter((g) => g.caption === f.keterangan);
        return (
          <div
            key={f.slot}
            className="rounded-[5px] border border-[var(--border)] bg-[var(--bg-main)] p-2 space-y-2"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-[var(--primary)]">{f.slot}</p>
                <p className="text-[10px] text-[var(--muted)]">
                  {f.slot === 'Berat' && powder ? 'Nonaktif untuk APAR Powder (khusus CO₂)' : f.hint}
                </p>
              </div>
              {!terbit && (
                <FileFotoButton
                  nonaktif={f.slot === 'Berat' && powder}
                  sibuk={mengunggah}
                  onFile={(file) => onUnggahFoto(file, f.keterangan, nilaiDraf)}
                />
              )}
            </div>

            {slotFoto.length === 0 ? (
              <div className="rounded-[5px] border border-dashed border-[var(--border-strong)] py-4 flex items-center justify-center text-[10px] text-[var(--muted)]">
                Belum ada foto
              </div>
            ) : (
              <div className="space-y-2">
                {slotFoto.map((s) => (
                  <div
                    key={s.id}
                    className="relative rounded-[5px] border border-[var(--border)] bg-[var(--bg-main)] p-1 group"
                  >
                    <img
                      src={s.url}
                      alt={`Dokumentasi ${f.slot} ${kode}`}
                      className="w-full h-auto object-contain rounded-[3px] image-outline"
                    />
                    <button
                      type="button"
                      onClick={() => onHapusFoto(s.id)}
                      title="Hapus foto"
                      className={nonaktif ? 'hidden' : 'absolute top-2 right-2 w-5 h-5 rounded-full bg-black/65 text-white/90 hover:text-red-400 flex items-center justify-center cursor-pointer'}
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                ))}
                {slotFoto.length > 1 && (
                  <span className="text-[9px] font-mono text-[var(--muted)]">
                    +{slotFoto.length - 1} foto lain pada slot ini
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  </div>
);
