import React, { useState } from 'react';
import { ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { useMasuk } from './sesi';

/** Layar masuk — email + sandi, gaya Notion-Kit, label K3 Bahasa Indonesia. */
export const LoginScreen: React.FC = () => {
  const masuk = useMasuk();
  const [email, setEmail] = useState('');
  const [sandi, setSandi] = useState('');

  const kirim = (e: React.FormEvent) => {
    e.preventDefault();
    masuk.mutate({ email, sandi });
  };

  const pesanGagal =
    masuk.isError
      ? 'Email atau kata sandi salah. Coba lagi.'
      : null;

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[var(--bg-main)] px-4 select-none">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-[6px] bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 flex items-center justify-center">
            <ShieldCheck size={20} strokeWidth={2} />
          </div>
          <h1 className="text-lg font-bold text-[var(--primary)] tracking-tight">
            Digitalisasi Inspeksi K3
          </h1>
          <p className="text-xs text-[var(--muted)] text-center">
            Masuk untuk mengakses laporan pemeriksaan berkala
          </p>
        </div>

        <form
          onSubmit={kirim}
          className="rounded-[8px] border border-[var(--border)] bg-[var(--bg-modal)] p-5 shadow-xs space-y-3"
        >
          <div className="space-y-1">
            <label htmlFor="email" className="text-xs font-semibold text-[var(--primary)]">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@perusahaan.id"
              className="w-full px-2.5 py-1.5 text-xs bg-[var(--bg-main)] border border-[var(--border)] rounded-[4px] text-[var(--primary)] placeholder-[var(--muted)] focus:outline-none focus:border-[#2383e2] tabular-nums"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="sandi" className="text-xs font-semibold text-[var(--primary)]">
              Kata Sandi
            </label>
            <input
              id="sandi"
              type="password"
              required
              autoComplete="current-password"
              value={sandi}
              onChange={(e) => setSandi(e.target.value)}
              placeholder="••••••••"
              className="w-full px-2.5 py-1.5 text-xs bg-[var(--bg-main)] border border-[var(--border)] rounded-[4px] text-[var(--primary)] placeholder-[var(--muted)] focus:outline-none focus:border-[#2383e2]"
            />
          </div>

          {pesanGagal && (
            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-[4px] bg-rose-500/10 border border-rose-500/25 text-[11px] text-rose-600 dark:text-rose-400">
              <AlertCircle size={12} className="flex-shrink-0" />
              <span>{pesanGagal}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={masuk.isPending}
            className="w-full flex items-center justify-center gap-2 py-1.5 bg-[#2383e2] hover:bg-[#1a73cb] text-white text-xs font-semibold rounded-[4px] shadow-xs cursor-pointer pressable disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {masuk.isPending ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Memproses…</span>
              </>
            ) : (
              <span>Masuk</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
