import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut } from 'lucide-react';
import { useDismiss, closeOnBackdrop } from '@/components/ui';
import { livePetaUrl } from '@/services/api/liveClient';
import type { ApiPeta } from '@/services/api/klien';

interface PetaLightboxProps {
  /** `null` = tertutup. */
  peta: ApiPeta | null;
  onClose: () => void;
}

/**
 * Penampil denah layar penuh. `zoom` lokal: hanya urusan tampilan, tidak
 * pernah ikut tersimpan — jadi tidak perlu naik ke `PetaProyek`.
 */
export const PetaLightbox: React.FC<PetaLightboxProps> = ({ peta, onClose }) => {
  const [zoom, setZoom] = useState(false);
  useDismiss(peta !== null, onClose);

  if (!peta) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 select-none"
      onClick={(e) => closeOnBackdrop(e, onClose)}
      role="dialog"
      aria-modal="true"
      aria-label={`Peta ${peta.nama}`}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Tutup"
        className="absolute top-4 right-4 w-8 h-8 rounded-[4px] flex items-center justify-center bg-black/50 text-white hover:bg-black/70 pressable cursor-pointer"
      >
        <X size={18} />
      </button>

      <button
        type="button"
        onClick={() => setZoom((z) => !z)}
        className="absolute top-4 right-14 h-8 px-2 rounded-[4px] flex items-center gap-1.5 bg-black/50 text-white text-[11px] font-semibold hover:bg-black/70 pressable cursor-pointer"
      >
        {zoom ? <ZoomOut size={14} /> : <ZoomIn size={14} />}
        <span>{zoom ? 'Perkecil' : 'Perbesar'}</span>
      </button>

      {/* Gulir bebas saat diperbesar: gambar melebihi viewport tidak boleh terpotong mati. */}
      <div className={`overflow-auto ${zoom ? 'w-full h-full flex items-center justify-center' : ''}`}>
        <img
          src={livePetaUrl(peta.id)}
          alt={peta.nama}
          className={`transition-transform duration-200 ease-out ${
            zoom ? 'max-w-none w-auto max-h-none scale-150' : 'max-h-[92vh] max-w-[92vw] object-contain'
          }`}
        />
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-[92vw] px-3 py-1.5 rounded-[4px] bg-black/60 text-white text-xs font-medium truncate">
        {peta.nama}
      </div>
    </div>
  );
};
