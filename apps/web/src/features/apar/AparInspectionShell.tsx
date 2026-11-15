import React from 'react';

interface AparInspectionShellProps {
  /** Elemen kepala modal — dirender di luar form, seperti markup aslinya. */
  header: React.ReactNode;
  /** Elemen konfirmasi hapus — saudara form, bukan isinya. */
  konfirmasi: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Bingkai modal inspeksi APAR: backdrop (klik = tutup), panel, header, form,
 * lalu konfirmasi. Panel tidak menutup karena klik di dalamnya tidak pernah
 * `target === currentTarget`.
 */
export const AparInspectionShell: React.FC<AparInspectionShellProps> = ({
  header,
  konfirmasi,
  onSubmit,
  onClose,
  children,
}) => (
  <div
    className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 select-none"
    onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}
  >
    <div className="bg-[var(--bg-modal)] border border-[var(--border)] rounded-[8px] shadow-popover w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden emil-modal">
      {/* Header */}
      {header}

      {/* Form Body */}
      <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
        {children}
      </form>

      {/* Konfirmasi hapus: dua cakupan terpisah, label menyebut akibatnya */}
      {konfirmasi}
    </div>
  </div>
);
