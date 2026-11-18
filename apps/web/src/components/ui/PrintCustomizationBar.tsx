import React, { useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Printer,
  RotateCcw,
  SlidersHorizontal,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  DEFAULT_HEADER_IMAGE_CONFIG,
  readHeaderImageAsDataUrl,
  type PrintHeaderImageConfig,
} from '@/lib/printHeaderConfig';

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
  headerImageConfig?: PrintHeaderImageConfig;
  onHeaderImageChange?: (next: PrintHeaderImageConfig) => void;
  signerFields?: PrintSignerField[];
  extraSignerControls?: React.ReactNode;
  onResetDefaults?: () => void;
  onClearSigners?: () => void;
}

const ImageSlotControl: React.FC<{
  label: string;
  src?: string;
  onUpload: (dataUrl: string) => void;
  onClear: () => void;
}> = ({ label, src, onUpload, onClear }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = await readHeaderImageAsDataUrl(file);
      onUpload(dataUrl);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-2.5 rounded-[6px] border border-neutral-200 bg-white p-2.5">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-12 h-9 rounded-[4px] border border-neutral-200 bg-neutral-50 flex items-center justify-center overflow-hidden flex-shrink-0">
          {src ? (
            <img src={src} alt={label} className="max-w-full max-h-full object-contain" />
          ) : (
            <ImageIcon size={14} className="text-neutral-400" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-neutral-800 truncate">{label}</p>
          <p className="text-[10px] text-neutral-500 truncate">
            {src ? 'Gambar kustom aktif' : 'Memakai logo bawaan'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          onChange={(e) => void handleFile(e)}
          className="hidden"
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-[4px] border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-800 cursor-pointer pressable disabled:opacity-50"
        >
          <Upload size={11} />
          <span>{busy ? 'Memuat…' : src ? 'Ganti' : 'Unggah'}</span>
        </button>
        {src && (
          <button
            type="button"
            onClick={onClear}
            title="Kembalikan ke bawaan"
            className="p-1 rounded-[4px] text-neutral-500 hover:text-red-600 hover:bg-red-50 cursor-pointer"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Bilah kontrol & kustomisasi pratinjau cetak (Gambar Header + Teks Header + Handsign)
 * yang bersih tanpa latar biru. Tersembunyi otomatis saat dicetak (.no-print).
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
  headerImageConfig,
  onHeaderImageChange,
  signerFields = [],
  extraSignerControls,
  onResetDefaults,
  onClearSigners,
}) => {
  const [terbuka, setTerbuka] = useState(false);
  const activeSignersCount = signerFields.filter((s) => s.nama.trim().length > 0).length;
  const imgCfg = headerImageConfig ?? DEFAULT_HEADER_IMAGE_CONFIG;

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
          {/* Gambar Header / Kop Surat */}
          {onHeaderImageChange && (
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-600">
                  1. Gambar Header / Kop Surat
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 bg-white p-0.5 rounded-[5px] border border-neutral-200 text-[11px]">
                    <button
                      type="button"
                      onClick={() => onHeaderImageChange({ ...imgCfg, mode: 'dual' })}
                      className={`px-2 py-0.5 rounded-[4px] font-semibold cursor-pointer ${
                        imgCfg.mode === 'dual'
                          ? 'bg-neutral-900 text-white'
                          : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      Logo Kiri &amp; Kanan
                    </button>
                    <button
                      type="button"
                      onClick={() => onHeaderImageChange({ ...imgCfg, mode: 'banner' })}
                      className={`px-2 py-0.5 rounded-[4px] font-semibold cursor-pointer ${
                        imgCfg.mode === 'banner'
                          ? 'bg-neutral-900 text-white'
                          : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      Banner Penuh
                    </button>
                  </div>

                  <label className="inline-flex items-center gap-1.5 text-[11px] text-neutral-600">
                    <span>Tinggi:</span>
                    <input
                      type="number"
                      min={24}
                      max={120}
                      value={imgCfg.heightPx ?? 44}
                      onChange={(e) =>
                        onHeaderImageChange({
                          ...imgCfg,
                          heightPx: Math.min(120, Math.max(24, Number(e.target.value) || 44)),
                        })
                      }
                      className="w-14 px-1.5 py-0.5 text-xs font-mono rounded-[4px] border border-neutral-200 bg-white text-neutral-900 tabular-nums"
                    />
                    <span>px</span>
                  </label>

                  {(imgCfg.leftLogoSrc || imgCfg.rightLogoSrc || imgCfg.bannerSrc) && (
                    <button
                      type="button"
                      onClick={() => onHeaderImageChange(DEFAULT_HEADER_IMAGE_CONFIG)}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-600 hover:text-neutral-900 cursor-pointer"
                    >
                      <RotateCcw size={11} />
                      <span>Reset Gambar</span>
                    </button>
                  )}
                </div>
              </div>

              {imgCfg.mode === 'banner' ? (
                <ImageSlotControl
                  label="Banner Header Penuh (Kop Surat)"
                  src={imgCfg.bannerSrc}
                  onUpload={(url) => onHeaderImageChange({ ...imgCfg, mode: 'banner', bannerSrc: url })}
                  onClear={() => onHeaderImageChange({ ...imgCfg, bannerSrc: undefined })}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <ImageSlotControl
                    label="Logo Kiri (Perusahaan)"
                    src={imgCfg.leftLogoSrc}
                    onUpload={(url) => onHeaderImageChange({ ...imgCfg, leftLogoSrc: url })}
                    onClear={() => onHeaderImageChange({ ...imgCfg, leftLogoSrc: undefined })}
                  />
                  <ImageSlotControl
                    label="Logo Kanan (K3 / Mitra)"
                    src={imgCfg.rightLogoSrc}
                    onUpload={(url) => onHeaderImageChange({ ...imgCfg, rightLogoSrc: url })}
                    onClear={() => onHeaderImageChange({ ...imgCfg, rightLogoSrc: undefined })}
                  />
                </div>
              )}
            </div>
          )}

          {/* Header Text Customization */}
          {headerFields.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-neutral-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-600">
                  {onHeaderImageChange ? '2. Teks Header Dokumen' : '1. Kustomisasi Header Dokumen'}
                </span>
                {onResetDefaults && (
                  <button
                    type="button"
                    onClick={onResetDefaults}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-600 hover:text-neutral-900 cursor-pointer"
                  >
                    <RotateCcw size={11} />
                    <span>Reset Teks</span>
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
                  {onHeaderImageChange ? '3. Handsign / Penandatangan' : '2. Handsign / Penandatangan'}{' '}
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
