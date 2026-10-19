import React from 'react';

interface AparInspectionShellProps {
  kode: string;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Bingkai popup: latar gelap (klik = tutup) + panel yang menahan propagasi
 * supaya klik di dalam formulir tidak menutup popup.
 */
export const AparInspectionShell: React.FC<AparInspectionShellProps> = ({
  kode,
  onClose,
  children,
}) => {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 select-none no-print"
      onClick={onClose}
    >
      <div
        className="bg-[var(--bg-modal)] border border-[var(--border)] rounded-[8px] shadow-popover w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden emil-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Formulir pemeriksaan APAR ${kode}`}
      >
        {children}
      </div>
    </div>
  );
};
