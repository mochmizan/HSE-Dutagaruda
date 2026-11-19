import React, { useEffect, useState } from 'react';
import { Camera, Check, ChevronLeft, ChevronRight, Clock, ImagePlus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { FileFotoButton } from '@/components/ui';
import type { AparUnitItem } from '../../types/hse';
import type { FotoTampil } from '@/services/api/queries';

interface AparInspectionPhotosProps {
  foto: FotoTampil[];
  temuanFoto?: FotoTampil[];
  mengunggah: boolean;
  terbit: boolean;
  nilaiDraf: NonNullable<AparUnitItem['draftDetails']>;
  powder: boolean;
  kode: string;
  onUnggahFoto: (
    file: File,
    caption: string,
    nilai?: AparUnitItem['draftDetails'],
    temuan?: boolean,
  ) => void;
  onHapusFoto: (fotoId: string) => void;
  onUbahCaptionFoto?: (fotoId: string, caption: string) => void;
}

const SLOT = [
  { slot: 'Checklist', keterangan: 'Kartu APAR', hint: 'Foto checklist APAR' },
  { slot: 'Berat', keterangan: 'Penimbangan CO2', hint: 'Foto timbangan CO₂' },
  { slot: 'Dokumentasi Pengecekan', keterangan: 'Pengecekan fisik', hint: 'Foto pengecekan fisik' },
] as const;

function formatWaktuSekarang(): string {
  return format(new Date(), "dd MMM yyyy · HH:mm:ss 'WIB'", { locale: idLocale });
}

/**
 * Langkah 1: Foto Bukti Fisik APAR dilakukan lebih awal sebelum melakukan inspeksi,
 * dilengkapi bagian Temuan (multi-foto dengan navigasi < > dan komentar untuk halaman cetak).
 */
export const AparInspectionPhotos: React.FC<AparInspectionPhotosProps> = ({
  foto,
  temuanFoto = [],
  mengunggah,
  terbit,
  nilaiDraf,
  powder,
  kode,
  onUnggahFoto,
  onHapusFoto,
  onUbahCaptionFoto,
}) => {
  const [waktuUnggahTerakhir, setWaktuUnggahTerakhir] = useState<string>(() => formatWaktuSekarang());
  const [temuanIndex, setTemuanIndex] = useState(0);
  const [komentarBaru, setKomentarBaru] = useState('');
  const [editCaption, setEditCaption] = useState('');

  const safeIndex = temuanFoto.length > 0 ? Math.min(temuanIndex, temuanFoto.length - 1) : 0;
  const activeTemuan = temuanFoto[safeIndex] ?? null;

  useEffect(() => {
    setEditCaption(activeTemuan?.caption ?? '');
  }, [activeTemuan?.id, activeTemuan?.caption]);

  const handlePrevTemuan = () => {
    if (temuanFoto.length <= 1) return;
    setTemuanIndex((prev) => (prev <= 0 ? temuanFoto.length - 1 : prev - 1));
  };

  const handleNextTemuan = () => {
    if (temuanFoto.length <= 1) return;
    setTemuanIndex((prev) => (prev >= temuanFoto.length - 1 ? 0 : prev + 1));
  };

  const handleUploadTemuan = (files: File[]) => {
    const caption = komentarBaru.trim() || 'Temuan dokumentasi';
    const ts = formatWaktuSekarang();
    setWaktuUnggahTerakhir(ts);
    for (const file of files) {
      onUnggahFoto(file, caption, { ...nilaiDraf, photoTimestamp: ts }, true);
    }
    setKomentarBaru('');
    setTemuanIndex(temuanFoto.length);
  };

  return (
    <div className="space-y-3 rounded-[6px] border border-[#f2994a]/35 bg-[#f2994a]/[0.04] p-3">
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
        Unggah foto bukti fisik APAR sebelum mengisi daftar 7 komponen.
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
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-[var(--primary)] truncate">{f.slot}</p>
                  <p className="text-[10px] text-[var(--muted)] truncate">
                    {f.slot === 'Berat' && powder ? 'Khusus APAR CO₂' : f.hint}
                  </p>
                </div>
                {!terbit && (
                  <FileFotoButton
                    nonaktif={f.slot === 'Berat' && powder}
                    sibuk={mengunggah}
                    onFile={(file) => {
                      const ts = formatWaktuSekarang();
                      setWaktuUnggahTerakhir(ts);
                      onUnggahFoto(file, f.keterangan, { ...nilaiDraf, photoTimestamp: ts }, false);
                    }}
                  />
                )}
              </div>

              {slotFoto.length === 0 ? (
                <div className="rounded-[5px] border border-dashed border-[var(--border-strong)] py-4 flex items-center justify-center text-[10px] text-[var(--muted)]">
                  Belum ada foto ({f.slot})
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

      {/* Bagian Temuan (Multi-Foto + Navigasi < > + Komentar untuk Section B halaman cetak) */}
      <div className="rounded-[5px] border border-amber-500/35 bg-[var(--bg-main)] p-2.5 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-[var(--primary)] flex items-center gap-1.5">
              <ImagePlus size={13} className="text-amber-600 dark:text-amber-400" />
              <span>Temuan</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 tabular-nums">
                {temuanFoto.length} foto
              </span>
            </p>
            <p className="text-[10px] text-[var(--muted)]">
              Unggah satu atau beberapa foto temuan beserta komentarnya (ditampilkan di Bagian B halaman cetak).
            </p>
          </div>
          {!terbit && (
            <FileFotoButton
              sibuk={mengunggah}
              multiple
              label="Unggah Temuan"
              onFiles={handleUploadTemuan}
            />
          )}
        </div>

        {!terbit && (
          <div className="space-y-1">
            <label className="block text-[10px] font-semibold text-[var(--secondary)]">
              Komentar untuk foto temuan baru (opsional)
            </label>
            <input
              type="text"
              value={komentarBaru}
              onChange={(e) => setKomentarBaru(e.target.value)}
              placeholder="Tuliskan keterangan temuan sebelum mengunggah foto…"
              className="w-full text-[11px] px-2 py-1.5 rounded-[4px] border border-[var(--border)] bg-[var(--bg-sidebar)]/50 text-[var(--primary)] placeholder-[var(--muted)] focus:outline-none focus:border-amber-500"
            />
          </div>
        )}

        {!activeTemuan ? (
          <div className="rounded-[5px] border border-dashed border-[var(--border-strong)] py-4 px-2 flex flex-col items-center justify-center text-center text-[10px] text-[var(--muted)] gap-1">
            <Camera size={16} className="opacity-50" />
            <span>Belum ada foto temuan untuk unit ini</span>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="relative rounded-[5px] border border-[var(--border)] bg-[var(--bg-sidebar)]/40 p-1.5">
              <div className="relative flex items-center justify-center min-h-[160px] max-h-[260px] overflow-hidden rounded-[3px] bg-black/5 dark:bg-black/25">
                <img
                  src={activeTemuan.url}
                  alt={activeTemuan.caption || `Foto temuan ${kode}`}
                  className="max-h-[250px] w-auto object-contain rounded-[3px] image-outline"
                />
                {temuanFoto.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrevTemuan}
                      aria-label="Foto temuan sebelumnya"
                      className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/65 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer transition-[transform,background-color] duration-150 ease-out active:scale-[0.97]"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextTemuan}
                      aria-label="Foto temuan berikutnya"
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/65 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer transition-[transform,background-color] duration-150 ease-out active:scale-[0.97]"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </>
                )}
                {!terbit && (
                  <button
                    type="button"
                    onClick={() => onHapusFoto(activeTemuan.id)}
                    title="Hapus foto temuan"
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/65 text-white/90 hover:text-red-400 flex items-center justify-center cursor-pointer"
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>

              <div className="mt-1.5 flex items-center justify-between text-[10px] text-[var(--muted)] font-mono tabular-nums px-1">
                <span>
                  Foto Temuan {safeIndex + 1} / {temuanFoto.length}
                </span>
                {temuanFoto.length > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handlePrevTemuan}
                      className="px-1.5 py-0.5 rounded border border-[var(--border)] bg-[var(--bg-main)] hover:bg-[var(--bg-hover)] text-[var(--primary)] cursor-pointer"
                    >
                      &lt;
                    </button>
                    <button
                      type="button"
                      onClick={handleNextTemuan}
                      className="px-1.5 py-0.5 rounded border border-[var(--border)] bg-[var(--bg-main)] hover:bg-[var(--bg-hover)] text-[var(--primary)] cursor-pointer"
                    >
                      &gt;
                    </button>
                  </div>
                )}
              </div>
            </div>

            {terbit || !onUbahCaptionFoto ? (
              <p className="text-[11px] text-[var(--secondary)] px-1 break-words">
                <span className="font-semibold text-[var(--primary)]">Komentar: </span>
                {activeTemuan.caption || '–'}
              </p>
            ) : (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  placeholder="Komentar foto temuan ini…"
                  className="flex-1 text-[11px] px-2 py-1.5 rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] placeholder-[var(--muted)] focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  disabled={editCaption.trim() === (activeTemuan.caption ?? '').trim()}
                  onClick={() => onUbahCaptionFoto(activeTemuan.id, editCaption.trim())}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-[4px] bg-amber-500 hover:bg-amber-600 text-white cursor-pointer pressable disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Check size={11} />
                  <span>Simpan</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
