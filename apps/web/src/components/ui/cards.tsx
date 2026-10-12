import React from 'react';
import { Camera, Trash2 } from 'lucide-react';

/** One category badge. Locked accent behind a flag. */
export const CategoryBadge: React.FC<{ label: string; accent: string }> = ({ label, accent }) => (
  <span
    className="px-1.5 py-0.2 rounded text-[10px] font-semibold"
    style={{ backgroundColor: `${accent}26`, color: accent }}
  >
    {label}
  </span>
);

/** Shared photo card: 4/5 frame, caption, hover-delete, print-clean. */
interface PhotoCardProps {
  imageUrl: string;
  caption: string;
  onDelete?: () => void;
  deleteTitle?: string;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({ imageUrl, caption, onDelete, deleteTitle = 'Hapus foto' }) => (
  <div className="group relative flex flex-col justify-between w-full h-full rounded-[10px] border border-[var(--border)] bg-[var(--bg-main)] p-4 hover:border-[var(--border-strong)] hover:shadow-md transition-all print:border-none print:p-0 print:bg-transparent print:break-inside-avoid print:shadow-none">
    <div className="w-full aspect-[4/5] overflow-hidden rounded-[7px] bg-[var(--bg-sidebar)] border border-[var(--border)]/40 relative print:border-none print:rounded-none print:bg-transparent print:aspect-auto print:max-h-[290px] print:flex print:items-center print:justify-center">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={caption}
          className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-102 print:w-auto print:max-h-[280px] print:object-contain print:mx-auto"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-[var(--muted)]">
          <Camera size={28} className="opacity-50" />
          <span className="text-[10px]">Foto menyusul</span>
        </div>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="no-print absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/65 text-white/90 hover:text-red-400 hover:bg-black/90 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer shadow-sm"
          title={deleteTitle}
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
    <div className="mt-5 mb-1 min-h-[44px] flex flex-col items-center justify-center text-center w-full px-2">
      <p className="text-xs sm:text-sm font-medium text-[var(--primary)] print:text-black print:text-xs print:font-normal leading-snug">
        {caption}
      </p>
    </div>
  </div>
);

/** Shared empty state. */
export const EmptyState: React.FC<{ icon: React.ReactNode; title: string; hint: string }> = ({ icon, title, hint }) => (
  <div className="p-8 rounded-[6px] border border-dashed border-[var(--border)] text-center text-xs text-[var(--muted)] space-y-2">
    <div className="mx-auto opacity-60 flex justify-center">{icon}</div>
    <p className="font-semibold text-[var(--secondary)]">{title}</p>
    <p className="text-[11px]">{hint}</p>
  </div>
);
