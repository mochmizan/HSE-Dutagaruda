import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Loader2, Map, Pencil, Trash2 } from 'lucide-react';
import { ConfirmModal, FileFotoButton } from '@/components/ui';
import {
  useHapusPeta,
  usePetaProyek,
  usePilihPeta,
  useUbahNamaPeta,
  useUnggahPeta,
} from '@/services/api/queries';
import { livePetaUrl } from '@/services/api/liveClient';
import type { ApiPeta } from '@/services/api/klien';
import { PetaLightbox } from './PetaLightbox';
import { PetaPemilih } from './PetaPemilih';
import { ukuranPeta } from './petaTeks';

/**
 * Kartu `Peta proyek` di bawah kalender dasbor.
 *
 * Semua hook orkestrasi tinggal di sini (pola `HydrantPage`/`AparPage`):
 * `PetaPemilih` dan `PetaLightbox` presentasional saja. Cakupan data adalah
 * PROYEK aktif, bukan lokasi — satu denah dipakai seluruh site di proyek itu.
 */
export const PetaProyek: React.FC = () => {
  const peta = usePetaProyek();
  const unggah = useUnggahPeta();
  const pilih = usePilihPeta();
  const ubahNama = useUbahNamaPeta();
  const hapus = useHapusPeta();

  const [sunting, setSunting] = useState(false);
  const [namaDraf, setNamaDraf] = useState('');
  const [targetHapus, setTargetHapus] = useState<ApiPeta | null>(null);
  const [lihat, setLihat] = useState<ApiPeta | null>(null);

  const daftar = peta.data ?? [];
  // Server menandai satu peta terpilih; bila belum ada (mis. data lama),
  // tampilkan yang pertama supaya kartu tidak pernah kosong padahal ada berkas.
  const aktif = daftar.find((p) => p.dipilih) ?? daftar[0] ?? null;

  /**
   * Unggah berurutan, bukan paralel: server menjalankan `urutan` peta satu per
   * satu, dan unggahan paralel bisa memberi nomor urut yang bertabrakan.
   * Hook sudah meng-alert galat dalam bahasa Indonesia, jadi di sini cukup
   * berhenti agar pengguna tidak menerima alert beruntun untuk sisa berkas.
   */
  const unggahBerkas = (berkas: File[]) => {
    void (async () => {
      for (const file of berkas) {
        try {
          await unggah.mutateAsync({ file });
        } catch {
          break;
        }
      }
    })();
  };

  const mulaiSunting = (p: ApiPeta) => {
    setNamaDraf(p.nama);
    setSunting(true);
  };

  const simpanNama = (p: ApiPeta) => {
    const nama = namaDraf.trim();
    if (nama && nama !== p.nama) ubahNama.mutate({ id: p.id, nama });
    setSunting(false);
  };

  const tanggalPeta = (iso: string) => {
    try {
      return format(parseISO(iso), 'd MMMM yyyy', { locale: idLocale });
    } catch {
      return '–';
    }
  };

  const tombolUnggah = (
    <FileFotoButton
      label="Unggah Peta"
      variant="utama"
      multiple
      onFiles={unggahBerkas}
      sibuk={unggah.isPending}
    />
  );

  return (
    <div className="bg-[var(--bg-main)] border border-[var(--border)] rounded-[8px] shadow-xs overflow-hidden select-none">
      {/* Kepala kartu — chrome sama dengan HseCalendar, tinggi tetap 44px */}
      <div className="h-11 px-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-sidebar)]/50">
        <div className="flex items-center gap-2 min-w-0">
          <Map size={15} className="text-[var(--secondary)] flex-shrink-0" />
          <h2 className="text-sm font-semibold text-[var(--primary)] tracking-tight truncate">
            Peta Lokasi Proyek
          </h2>
          {peta.isPending ? (
            <span className="flex items-center gap-1 text-[11px] text-[var(--muted)] flex-shrink-0">
              <Loader2 size={11} className="animate-spin" />
              <span>Memuat peta…</span>
            </span>
          ) : (
            <span className="text-[11px] text-[var(--muted)] tabular-nums flex-shrink-0">
              {daftar.length} gambar
            </span>
          )}
        </div>
        {tombolUnggah}
      </div>

      {peta.isPending ? (
        <div className="flex items-center justify-center gap-2 px-4 py-10 text-xs text-[var(--muted)]">
          <Loader2 size={14} className="animate-spin" />
          <span>Memuat peta…</span>
        </div>
      ) : !aktif ? (
        /* Tanpa denah: arahkan ke unggahan pertama, jangan tampilkan bingkai kosong */
        <div className="border border-dashed border-[var(--border-strong)] rounded-[6px] mx-4 my-4 px-4 py-10 text-center">
          <Map size={20} className="mx-auto mb-2 text-[var(--muted)]" />
          <p className="text-sm font-medium text-[var(--primary)]">Belum ada peta untuk proyek ini</p>
          <p className="mt-1 text-[11px] text-[var(--muted)]">
            Unggah denah lantai atau site plan (JPEG/PNG/WebP, maks 10 MB).
          </p>
          <div className="mt-3 flex justify-center">{tombolUnggah}</div>
        </div>
      ) : (
        <>
          <div className="relative bg-[var(--bg-sidebar)] flex items-center justify-center">
            <img
              src={livePetaUrl(aktif.id)}
              alt={aktif.nama}
              onClick={() => setLihat(aktif)}
              className="max-h-[340px] w-full object-contain cursor-zoom-in"
            />
          </div>

          {/* Baris keterangan: nama (bisa disunting), ukuran + tanggal, aksi */}
          <div className="flex items-center justify-between gap-3 px-4 py-2 border-t border-[var(--border)]">
            <div className="min-w-0">
              {sunting ? (
                <input
                  autoFocus
                  value={namaDraf}
                  onChange={(e) => setNamaDraf(e.target.value)}
                  onBlur={() => setSunting(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      simpanNama(aktif);
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      setSunting(false);
                    }
                  }}
                  aria-label="Nama peta"
                  className="w-full max-w-[320px] px-1.5 py-0.5 text-xs font-medium text-[var(--primary)] bg-[var(--bg-main)] border border-[var(--border-strong)] rounded-[3px] outline-none focus:border-[#2f80ed]"
                />
              ) : (
                <p
                  className="text-xs font-medium text-[var(--primary)] truncate"
                  title={aktif.nama}
                >
                  {aktif.nama}
                </p>
              )}
              <p className="text-[10px] text-[var(--muted)] tabular-nums">
                {ukuranPeta(aktif.bytes)} · {tanggalPeta(aktif.createdAt)}
              </p>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => (sunting ? setSunting(false) : mulaiSunting(aktif))}
                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-[var(--secondary)] rounded-[3px] hover:bg-[var(--bg-hover)] hover:text-[var(--primary)] pressable cursor-pointer"
              >
                <Pencil size={12} />
                <span>Ganti Nama</span>
              </button>
              <button
                type="button"
                onClick={() => setTargetHapus(aktif)}
                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-[var(--secondary)] rounded-[3px] hover:bg-[var(--bg-hover)] hover:text-[#eb5757] pressable cursor-pointer"
              >
                <Trash2 size={12} />
                <span>Hapus</span>
              </button>
            </div>
          </div>

          {daftar.length > 1 && (
            <PetaPemilih
              daftar={daftar}
              onPilih={(id) => pilih.mutate(id)}
              sibuk={pilih.isPending}
            />
          )}
        </>
      )}

      <PetaLightbox peta={lihat} onClose={() => setLihat(null)} />

      <ConfirmModal
        isOpen={targetHapus !== null}
        title="Hapus peta?"
        message={`Peta "${targetHapus?.nama ?? ''}" akan dihapus dari proyek ini.`}
        confirmLabel="Hapus"
        accent="#eb5757"
        onClose={() => setTargetHapus(null)}
        onConfirm={() => {
          // Server menaikkan peta berikutnya jadi terpilih; klien tidak menebak.
          if (targetHapus) hapus.mutate(targetHapus.id);
        }}
      />
    </div>
  );
};
