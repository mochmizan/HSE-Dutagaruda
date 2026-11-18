import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Printer, RotateCcw, SlidersHorizontal, Trash2 } from 'lucide-react';

export interface PrintHeaderField {
  key: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export interface PrintSignerField {
  id: string;
  headerLabel: string;
  onHeaderLabelChange: (value: string) => void;
  nama: string;
  onNamaChange: (value: string) => void;
  jabatan: string;
  onJabatanChange: (value: string) => void;
  placeholderHeader?: string;
  placeholderNama?: string;
  placeholderJabatan?: string;
}

interface PrintCustomizationBarProps {
  backLabel: string;
  onKembali: () => void;
  title: string;
  subtitle: string;
  memuat: boolean;
  onPrint: () => void;
  modeSelector?: React.ReactNode;
  extraControls?: React.ReactNode;
  headerFields: PrintHeaderField[];
  signerFields?: PrintSignerField[];
  extraSignerControls?: React.ReactNode;
  onResetDefaults?: () => void;
  onClearSigners?: () => void;
}

/**
 * Bilah kontrol & kustomisasi pratinjau cetak (Header + Handsign) yang bersih tanpa latar biru.
 * Tersembunyi otomatis saat dicetak (.no-print).
 */
export const PrintCustomizationBar: React.FC<PrintCustomizationBarProps> = ({
  backLabel,
  onKembali,
  title,
  subtitle,
  memuat,
  onPrint,
  modeSelector,
  extraControls,
  headerFields,
  signerFields = [],
  extraSignerControls,
  onResetDefaults,
  onClearSigners,
}) => {
  const [terbuka, setTerbuka] = useState(false);
  const activeSignersCount = signerFields.filter((s) => s.nama.trim().length > 0).length;

  return (
    <div className="no-print max-w-[1180px] w-full mx-auto mb-5 shrink-0 rounded-[8px] border border-neutral-200 bg-white shadow-xs overflow-hidden text-neutral-900">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={onKembali}
          className="px-3 py-1.5 text-xs font-semibold rounded-[5px] border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 cursor-pointer pressable"
        >
          {backLabel}
        </button>

        <div className="flex flex-col min-w-0">
          <h1 className="text-sm font-bold tracking-tight text-neutral-900 truncate">{title}</h1>
          <p className="text-[11px] text-neutral-500 tabular-nums truncate">{subtitle}</p>
        </div>

        {modeSelector}
        {extraControls}

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTerbuka((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[5px] border cursor-pointer pressable transition-colors ${
              terbuka
                ? 'border-neutral-900 bg-neutral-900 text-white'
                : 'border-neutral-200 bg-neutral-50 text-neutral-800 hover:bg-neutral-100'
            }`}
          >
            <SlidersHorizontal size={13} />
            <span>Header &amp; Handsign</span>
            {signerFields.length > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-mono tabular-nums ${
                  terbuka ? 'bg-white/20 text-white' : 'bg-neutral-200 text-neutral-700'
                }`}
              >
                {activeSignersCount}/{signerFields.length}
              </span>
            )}
            {terbuka ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          <button
            type="button"
            onClick={onPrint}
            disabled={memuat}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-[5px] text-white bg-[#2f80ed] hover:bg-[#256fd1] cursor-pointer pressable disabled:opacity-40 disabled:cursor-not-allowed tabular-nums shadow-xs"
          >
            <Printer size={13} />
            <span>{memuat ? 'Memuat…' : 'Cetak / Simpan PDF'}</span>
          </button>
        </div>
      </div>

      {terbuka && (
        <div className="border-t border-neutral-200 bg-neutral-50/70 px-4 py-3.5 space-y-4">
          {/* Header Customization */}
          {headerFields.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-600">
                  1. Kustomisasi Header Dokumen
                </span>
                {onResetDefaults && (
                  <button
                    type="button"
                    onClick={onResetDefaults}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-600 hover:text-neutral-900 cursor-pointer"
                  >
                    <RotateCcw size={11} />
                    <span>Reset Default</span>
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {headerFields.map((f) => (
                  <label key={f.key} className="block space-y-1">
                    <span className="block text-[11px] font-medium text-neutral-600">{f.label}</span>
                    <input
                      type="text"
                      value={f.value}
                      onChange={(e) => f.onChange(e.target.value)}
                      placeholder={f.placeholder}
                      className="w-full px-2.5 py-1.5 text-xs rounded-[5px] border border-neutral-200 bg-white text-neutral-900 focus:outline-none focus:border-neutral-900"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Handsign Customization */}
          {(signerFields.length > 0 || extraSignerControls) && (
            <div className="space-y-2 pt-2 border-t border-neutral-200">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-600">
                  2. Handsign / Penandatangan{' '}
                  <span className="font-normal normal-case text-neutral-500">
                    (kosongkan nama jika slot tidak ingin dicetak)
                  </span>
                </span>
                {onClearSigners && signerFields.length > 0 && (
                  <button
                    type="button"
                    onClick={onClearSigners}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600 hover:text-red-700 cursor-pointer"
                  >
                    <Trash2 size={11} />
                    <span>Kosongkan Semua TTD</span>
                  </button>
                )}
              </div>

              {extraSignerControls}

              {signerFields.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  {signerFields.map((s, idx) => (
                    <div
                      key={s.id}
                      className="rounded-[6px] border border-neutral-200 bg-white p-2.5 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                          Penandatangan {idx + 1}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                            s.nama.trim()
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-neutral-100 text-neutral-500'
                          }`}
                        >
                          {s.nama.trim() ? 'Aktif' : 'Disembunyikan'}
                        </span>
                      </div>
                      <input
                        type="text"
                        value={s.headerLabel}
                        onChange={(e) => s.onHeaderLabelChange(e.target.value)}
                        placeholder={s.placeholderHeader ?? 'Label (mis. Petugas Pemeriksa :)'}
                        className="w-full px-2 py-1 text-[11px] font-semibold rounded-[4px] border border-neutral-200 bg-neutral-50 text-neutral-800 focus:outline-none focus:border-neutral-900"
                      />
                      <input
                        type="text"
                        value={s.nama}
                        onChange={(e) => s.onNamaChange(e.target.value)}
                        placeholder={s.placeholderNama ?? 'Nama (kosongkan = tidak dicetak)'}
                        className="w-full px-2 py-1 text-xs rounded-[4px] border border-neutral-200 bg-white text-neutral-900 focus:outline-none focus:border-neutral-900"
                      />
                      <input
                        type="text"
                        value={s.jabatan}
                        onChange={(e) => s.onJabatanChange(e.target.value)}
                        placeholder={s.placeholderJabatan ?? 'Jabatan / Posisi'}
                        className="w-full px-2 py-1 text-[11px] rounded-[4px] border border-neutral-200 bg-white text-neutral-700 focus:outline-none focus:border-neutral-900"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
