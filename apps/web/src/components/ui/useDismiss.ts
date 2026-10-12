import { useEffect } from 'react';

/** Shared Esc + backdrop dismissal. Every modal uses this hook. */
export function useDismiss(active: boolean, onClose: () => void) {
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, onClose]);
}

/** Backdrop click closes only when the backdrop itself is clicked. */
export function closeOnBackdrop(e: React.MouseEvent, onClose: () => void) {
  if (e.target === e.currentTarget) onClose();
}
