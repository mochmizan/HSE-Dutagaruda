import React from 'react';
import { closeOnBackdrop } from '@/components/ui';

interface P3kInspectionShellProps {
  /** Elemen kepala modal — dirender di luar form, seperti markup aslinya. */
  header: React.ReactNode;
  /** Elemen konfirmasi hapus — saudara form, bukan isinya. */
  konfirmasi: React.ReactNode;
  onSubmit: () => void;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Bingkai modal inspeksi P3K: backdrop (klik = tutup), panel, header, form,
 * lalu konfirmasi. Panel tidak menutup karena klik di dalamnya tidak pernah
 * `target === currentTarget`. Cermin `HydrantInspectionShell`.
 */
export const P3kInspectionShell: React.FC<P3kInspectionShellProps> = ({
  header,
  konfirmasi,
  onSubmit,
  onClose,
  children,
}) => (
  <div
    className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 select-none"
    onClick={(e) => closeOnBackdrop(e, onClose)}
  >
    <div className="bg-[var(--bg-modal)] border border-[var(--border)] rounded-[8px] shadow-popover w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden emil-modal">
      {/* Header */}
      {header}

      {/* Form Body */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {children}
      </form>

      {/* Konfirmasi hapus bulan */}
      {konfirmasi}
    </div>
  </div>
);
