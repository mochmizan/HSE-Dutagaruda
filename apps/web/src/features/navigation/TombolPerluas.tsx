import React from 'react';
import { ChevronsRight } from 'lucide-react';

/** Tombol perluas bilah samping untuk baris judul tiap tampilan saat mode ciut. */
export const TombolPerluas: React.FC<{ onKlik: () => void }> = ({ onKlik }) => (
  <button
    type="button"
    onClick={onKlik}
    title="Tampilkan bilah samping"
    aria-label="Tampilkan bilah samping"
    className="w-6 h-6 rounded-[3px] flex items-center justify-center text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--bg-hover)] cursor-pointer pressable flex-shrink-0"
  >
    <ChevronsRight size={15} />
  </button>
);
