import React, { useState } from 'react';
import { Camera, Clock, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
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
  { slot: 'Kartu', keterangan: 'Kartu APAR', hint: 'Foto kartu gantung APAR (Time Stamp)' },
  { slot: 'Berat', keterangan: 'Penimbangan CO2', hint: 'Foto hasil penimbangan (CO₂)' },
  { slot: 'Pengecekan', keterangan: 'Pengecekan fisik', hint: 'Foto bukti awal pengecekan fisik' },
] as const;

function formatWaktuSekarang(): string {
  return format(new Date(), "dd MMM yyyy · HH:mm:ss 'WIB'", { locale: idLocale });
}

/**
 * Langkah 1: Foto Bukti Fisik APAR dilakukan lebih awal sebelum melakukan inspeksi,
 * dilengkapi Time Stamp otomatis pada setiap slot dokumentasi.
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
}) => {
  const [waktuUnggahTerakhir, setWaktuUnggahTerakhir] = useState<string>(() => formatWaktuSekarang());

  return (
    <div className="space-y-2 rounded-[6px] border border-[#f2994a]/35 bg-[#f2994a]/[0.04] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-xs font-bold text-[var(--primary)] flex items-center gap-1.5">
          <Camera size={14} className="text-[#f2994a]" />
          <span>1. Foto Bukti Inspeksi Awal (Time Stamp)</span>
          <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-[#f2994a]/15 text-[#f2994a]">
            Wajib Sebelum Inspeksi
          </span>
        </label>
        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-[#f2994a] bg-[var(--bg-main)] px-2 py-0.5 rounded border border-[var(--border)] tabular-nums">
          <Clock size={11} />
          <span>Time Stamp: {waktuUnggahTerakhir}</span>
        </span>
      </div>

      <p className="text-[11px] text-[var(--secondary)]">
        Ambil/unggah foto bukti fisik APAR terlebih dahulu sebelum melakukan pemeriksaan 7 komponen di bawah.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-start pt-1">
        {SLOT.map((f) => {
          const nonaktif = terbit || (f.slot === 'Berat' && powder);
          const slotFoto = foto.filter((g) => g.caption === f.keterangan);
          return (
            <div
              key={f.slot}
              className="rounded-[5px] border border-[var(--border)] bg-[var(--bg-main)] p-2.5 space-y-2"
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
                    onFile={(file) => {
                      const ts = formatWaktuSekarang();
                      setWaktuUnggahTerakhir(ts);
                      onUnggahFoto(file, f.keterangan, { ...nilaiDraf, photoTimestamp: ts });
                    }}
                  />
                )}
              </div>

              {slotFoto.length === 0 ? (
                <div className="rounded-[5px] border border-dashed border-[var(--border-strong)] py-4 flex items-center justify-center text-[10px] text-[var(--muted)]">
                  Belum ada foto bukti ({f.slot})
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
                      <div className="mt-1 px-1.5 py-0.5 rounded bg-black/75 text-white text-[9px] font-mono flex items-center justify-between tabular-nums">
                        <span className="inline-flex items-center gap-1">
                          <Clock size={9} />
                          <span>Time Stamp</span>
                        </span>
                        <span>{waktuUnggahTerakhir}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onHapusFoto(s.id)}
                        title="Hapus foto"
                        className={
                          nonaktif
                            ? 'hidden'
                            : 'absolute top-2 right-2 w-5 h-5 rounded-full bg-black/65 text-white/90 hover:text-red-400 flex items-center justify-center cursor-pointer'
                        }
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
};
