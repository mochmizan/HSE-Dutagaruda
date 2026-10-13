import React from 'react';
import { Printer } from 'lucide-react';

/** One button pattern. Primary is solid page accent. Secondary is outline ghost. */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  accent: string;
}

export const PrimaryButton: React.FC<ButtonProps> = ({ accent, className = '', style, ...rest }) => (
  <button
    type="button"
    style={{ backgroundColor: accent, ...style }}
    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-[4px] shadow-xs cursor-pointer pressable disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    {...rest}
  />
);

export const GhostButton: React.FC<ButtonProps> = ({ className = '', ...rest }) => (
  <button
    type="button"
    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] rounded-[4px] hover:bg-[var(--bg-hover)] shadow-2xs cursor-pointer pressable disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    {...rest}
  />
);

interface PrintButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
}

/** One print pattern per scope. APAR renders two (Laporan + Kartu). */
export const PrintButton: React.FC<PrintButtonProps> = ({ label = 'Cetak', ...rest }) => (
  <button
    type="button"
    onClick={() => window.print()}
    title="Cetak lembar laporan ke printer atau simpan sebagai PDF"
    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] rounded-[4px] hover:bg-[var(--bg-hover)] shadow-2xs cursor-pointer pressable disabled:opacity-40 disabled:cursor-not-allowed"
    {...rest}
  >
    <Printer size={14} />
    <span>{label}</span>
  </button>
);

/** One input style. Focus ring takes the page accent. */
export const inputClass = () =>
  `w-full text-xs px-2.5 py-1.5 rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] placeholder-[var(--muted)] focus:outline-none tabular-nums`;
