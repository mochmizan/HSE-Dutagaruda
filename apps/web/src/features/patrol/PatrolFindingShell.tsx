import React, { useEffect } from 'react';

interface PatrolFindingShellProps {
  /** Elemen kepala modal — dirender di luar form, seperti markup aslinya. */
  header: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Bingkai modal tambah foto patroli: backdrop (klik = tutup), panel, header,
 * lalu form. Panel tidak menutup karena klik di dalamnya tidak pernah
 * `target === currentTarget`. Kunci gulir badan + Esc hidup di sini (kontrak
 * Shell halaman ini); isi form tetap presentasional di bawah.
 */
export const PatrolFindingShell: React.FC<PatrolFindingShellProps> = ({
  header,
  onSubmit,
  onClose,
  children,
}) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    const asal = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = asal;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg bg-[var(--bg-modal)] text-[var(--primary)] rounded-lg border border-[var(--border)] shadow-2xl overflow-hidden emil-modal font-sans flex flex-col max-h-[90vh]">
        {header}

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {children}
        </form>
      </div>
    </div>
  );
};
