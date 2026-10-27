import React from 'react';
import { livePetaUrl } from '@/services/api/liveClient';
import type { ApiPeta } from '@/services/api/klien';

interface PetaPemilihProps {
  daftar: ApiPeta[];
  /** Dipanggil dengan id peta yang diklik; pilihan dicatat server. */
  onPilih: (id: string) => void;
  /** Mutasi pilih sedang berjalan (tombol tidak dikunci, hanya penanda). */
  sibuk?: boolean;
}

/**
 * Strip thumbnail denah. Presentasional: tanpa hook agar `PetaProyek` tetap
 * satu-satunya pemilik state/mutasi (pola yang sama dengan halaman kategori).
 */
export const PetaPemilih: React.FC<PetaPemilihProps> = ({ daftar, onPilih, sibuk = false }) => {
  return (
    <div
      className={`flex gap-2 overflow-x-auto px-4 py-2 border-t border-[var(--border)] ${
        sibuk ? 'opacity-60' : ''
      }`}
    >
      {daftar.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onPilih(p.id)}
          title={p.nama}
          aria-pressed={p.dipilih}
          className={`w-[88px] h-[56px] shrink-0 rounded-[4px] overflow-hidden border pressable cursor-pointer ${
            p.dipilih
              ? 'border-[#2f80ed] ring-2 ring-[#2f80ed]'
              : 'border-[var(--border)] hover:border-[var(--border-strong)]'
          }`}
        >
          <img src={livePetaUrl(p.id)} alt={p.nama} className="w-full h-full object-cover" />
        </button>
      ))}
    </div>
  );
};
