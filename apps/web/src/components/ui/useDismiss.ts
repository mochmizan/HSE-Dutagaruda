import { useEffect } from 'react';

/**
 * Esc + backdrop dismissal. Every modal uses this hook.
 *
 * `escKey`:
 * - `'capture'` (bawaan) — modal biasa. Listener di fase capture supaya Esc
 *   sampai sebelum handler lain yang mungkin ada di dalam.
 * - `'escape-only'` — lapisan di atas lapisan (konfirmasi hapus di dalam modal
 *   inspeksi). Handler menutup dirinya lalu `stopPropagation`, sehingga Esc
 *   tidak ikut menutup modal induk yang sedang menampungnya.
 */
export function useDismiss(
  active: boolean,
  onClose: () => void,
  escKey: 'capture' | 'escape-only' = 'capture',
) {
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      onClose();
      if (escKey === 'escape-only') {
        // Hentikan di sini: lapisan bawah tidak boleh ikut menutup.
        e.stopPropagation();
        e.preventDefault();
      }
    };
    const fase = escKey === 'escape-only' ? true : false;
    window.addEventListener('keydown', onKey, fase);
    return () => window.removeEventListener('keydown', onKey, fase);
  }, [active, onClose, escKey]);
}

/** Backdrop click closes only when the backdrop itself is clicked. */
export function closeOnBackdrop(e: React.MouseEvent, onClose: () => void) {
  if (e.target === e.currentTarget) onClose();
}
