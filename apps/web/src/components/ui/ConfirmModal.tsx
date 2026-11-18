import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useDismiss, closeOnBackdrop } from './useDismiss';

/** Shared confirm modal. Esc + backdrop always close. */
interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  accent: string;
  /** Jika diisi (mis. "HAPUS"), pengguna wajib mengetik teks ini untuk mengaktifkan tombol konfirmasi. */
  requireText?: string;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * Konfirmasi di atas modal lain.
 *
 * Wajib lewat portal ke `document.body`. Panel induk memakai `.emil-modal`,
 * yang menganimasikan `transform: scale(1)`; elemen bertransformasi menjadi
 * containing block untuk `position: fixed`, jadi tanpa portal backdrop
 * konfirmasi ini menyusut mengikuti panel induk (bukan viewport) dan muncul
 * sebagai kotak abu-abu yang salah tempat.
 *
 * `escKey="escape-only"`: Esc hanya menutup lapisan ini, bukan modal induk.
 */
export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel,
  accent,
  requireText,
  onClose,
  onConfirm,
}) => {
  const [typed, setTyped] = useState('');
  useDismiss(isOpen, onClose, 'escape-only');

  useEffect(() => {
    if (isOpen) setTyped('');
  }, [isOpen]);

  if (!isOpen) return null;

  const expected = requireText?.trim();
  const isReady = !expected || typed.trim().toUpperCase() === expected.toUpperCase();

  const submitConfirm = () => {
    if (!isReady) return;
    onConfirm();
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none"
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
        <div className="px-4 py-3 space-y-3">
          <p className="text-xs text-[var(--secondary)] leading-relaxed">{message}</p>
          {expected && (
            <label className="block space-y-1.5">
              <span className="block text-[11px] font-medium text-[var(--secondary)]">
                Ketik{' '}
                <span className="font-mono font-bold text-red-600 dark:text-red-400">
                  {expected}
                </span>{' '}
                untuk mengonfirmasi:
              </span>
              <input
                type="text"
                autoFocus
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    submitConfirm();
                  }
                }}
                placeholder={expected}
                className="w-full px-2.5 py-1.5 text-xs font-mono uppercase rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] focus:outline-none focus:border-red-500"
              />
            </label>
          )}
        </div>
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
            disabled={!isReady}
            onClick={submitConfirm}
            style={{ backgroundColor: accent }}
            className="px-3 py-1.5 text-xs font-semibold text-white rounded-[4px] hover:brightness-95 pressable cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
