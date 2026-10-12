import React from 'react';
import { X } from 'lucide-react';
import { useDismiss, closeOnBackdrop } from './useDismiss';

/** Shared confirm modal. Esc + backdrop always close. */
interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  accent: string;
  onClose: () => void;
  onConfirm: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel,
  accent,
  onClose,
  onConfirm,
}) => {
  useDismiss(isOpen, onClose);
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none"
      onMouseDown={(e) => closeOnBackdrop(e, onClose)}
    >
      <div
        className="w-full max-w-sm bg-[var(--bg-modal)] border border-[var(--border)] rounded-[8px] shadow-popover overflow-hidden emil-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-sidebar)]/60">
          <h2 className="text-sm font-bold text-[var(--primary)]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="p-1.5 rounded-[4px] text-[var(--muted)] hover:bg-[var(--bg-hover)] pressable cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
        <p className="px-4 py-3 text-xs text-[var(--secondary)]">{message}</p>
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-[var(--secondary)] border border-[var(--border)] rounded-[4px] hover:bg-[var(--bg-hover)] pressable cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            style={{ backgroundColor: accent }}
            className="px-3 py-1.5 text-xs font-semibold text-white rounded-[4px] hover:brightness-95 pressable cursor-pointer"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
