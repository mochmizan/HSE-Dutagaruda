import React from 'react';
import { Camera, Trash2 } from 'lucide-react';
import { FileFotoButton } from '@/components/ui';
import type { ApiInspeksiApar } from '@/services/api/klien';
import type { FotoTampil } from '@/services/api/queries';

interface AparInspectionPhotosProps {
  /** Foto dokumentasi sesi per slot (Kartu / Berat / Pengecekan). */
  foto: FotoTampil[];
  /** Baris inspeksi tersimpan untuk unit+bulan ini; null = belum ada rekam. */
  inspeksi: ApiInspeksiApar | null;
  /** Status unggahan berjalan (tombol menandai proses). */
  mengunggah: boolean;
  onUnggahFoto: (slot: 'Kartu' | 'Berat' | 'Pengecekan', file: File) => void;
  onHapusFoto: (fotoId: string) => void;
  isPowder: boolean;
  kode: string;
}

/**
 * Tiga slot dokumentasi foto APAR (Kartu / Berat / Pengecekan).
 *
 * Unggahan nyata ke Garage via /api/uploads. Grid dua kolom: tiap slot kartu
 * berisi tombol + pratinjau diskalakan maksimal ke lebar kolomnya.
 */
export const AparInspectionPhotos: React.FC<AparInspectionPhotosProps> = ({
  foto,
  inspeksi,
  mengunggah,
  onUnggahFoto,
  onHapusFoto,
  isPowder,
  kode,
}) => {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-[var(--primary)] flex items-center gap-1.5">
        <Camera size={13} />
        <span>Foto Dokumentasi</span>
      </label>
      <div className="grid grid-cols-2 gap-2 items-stretch">
        {(
          [
            { slot: 'Kartu' as const, keterangan: 'Kartu APAR', disabled: false, hint: 'Foto kartu gantung APAR' },
            { slot: 'Berat' as const, keterangan: 'Penimbangan CO2', disabled: isPowder, hint: isPowder ? 'Nonaktif untuk APAR Powder (khusus CO₂)' : 'Foto hasil penimbangan (CO₂)' },
            { slot: 'Pengecekan' as const, keterangan: 'Pengecekan fisik', disabled: false, hint: 'Foto proses pengecekan fisik' },
          ]
        ).map((f) => {
          const slotFoto = foto.filter((g) => g.caption === f.keterangan);
          return (
            <div
              key={f.slot}
              className="rounded-[5px] border border-[var(--border)] bg-[var(--bg-main)] p-2 flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-[var(--primary)] truncate">{f.slot}</p>
                  <p className="text-[10px] text-[var(--muted)] truncate">{f.hint}</p>
                </div>
                <FileFotoButton
                  nonaktif={f.disabled}
                  belumTersimpan={inspeksi == null}
                  sibuk={mengunggah}
                  onFile={(file) => onUnggahFoto(f.slot, file)}
                />
              </div>
              {slotFoto.length > 0 ? (
                <div className="relative rounded-[4px] overflow-hidden border border-[var(--border)] image-outline">
                  <a
                    href={slotFoto[0].url}
                    target="_blank"
                    rel="noreferrer"
                    title={`Buka pratinjau foto ${f.slot.toLowerCase()} di tab baru`}
                  >
                    <img
                      src={slotFoto[0].url}
                      alt={`Dokumentasi ${f.slot} APAR ${kode}`}
                      className="w-full h-auto object-contain image-outline"
                    />
                  </a>
                  {slotFoto.length > 1 && (
                    <span className="absolute bottom-1 right-1 text-[9px] font-mono px-1 rounded-full bg-black/60 text-white">
                      +{slotFoto.length - 1}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => onHapusFoto(slotFoto[0].id)}
                    title="Hapus foto"
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/65 text-white/90 hover:text-red-400 flex items-center justify-center cursor-pointer"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              ) : (
                <div className="w-full aspect-[4/3] rounded-[4px] border border-dashed border-[var(--border-strong)] flex items-center justify-center text-[10px] text-[var(--muted)] text-center px-1">
                  {f.disabled ? 'Tidak berlaku untuk jenis ini' : inspeksi == null ? 'Simpan dulu untuk unggah' : 'Belum ada foto'}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
