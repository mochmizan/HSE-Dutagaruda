import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Plus } from 'lucide-react';

/** Kelas aksen ditulis statis agar tetap terdeteksi pemindai Tailwind. */
const AKSEN = {
  '#eb5757': {
    fokus: 'focus:border-[#eb5757]',
    teks: 'text-[#eb5757]',
    pil: 'bg-[#eb5757]/10 text-[#eb5757]',
    garis: 'border-[#eb5757]/20',
  },
  '#f2994a': {
    fokus: 'focus:border-[#f2994a]',
    teks: 'text-[#f2994a]',
    pil: 'bg-[#f2994a]/10 text-[#f2994a]',
    garis: 'border-[#f2994a]/20',
  },
  '#27ae60': {
    fokus: 'focus:border-[#27ae60]',
    teks: 'text-[#27ae60]',
    pil: 'bg-[#27ae60]/10 text-[#27ae60]',
    garis: 'border-[#27ae60]/20',
  },
} as const;

export type UnifiedComboboxAccent = keyof typeof AKSEN;

export interface UnifiedComboboxItem {
  id: string;
  label: string;
  sublabel?: string;
}

export interface UnifiedComboboxProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  items: UnifiedComboboxItem[];
  placeholder: string;
  isNewItem: boolean;
  /** Aksen kategori: cincin fokus, baris “Gunakan baru”, baris terpilih, ikon centang. */
  accent?: UnifiedComboboxAccent;
  /** Terapkan `tabular-nums` pada input dan label opsi (kode unit APAR). */
  tabularNums?: boolean;
}

/**
 * Input + dropdown seragam: pilih opsi terdaftar atau ketik nilai baru.
 * Menutup saat klik di luar; baris “Gunakan baru” disembunyikan bila nilai
 * sudah cocok persis dengan opsi terdaftar. Esc dikelola modal induk.
 */
export const UnifiedCombobox: React.FC<UnifiedComboboxProps> = ({
  label,
  value,
  onChange,
  items,
  placeholder,
  isNewItem,
  accent = '#eb5757',
  tabularNums = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const aksen = AKSEN[accent];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const trimmedValue = value.trim();
  const filteredItems = items.filter((item) =>
    item.label.toLowerCase().includes(trimmedValue.toLowerCase())
  );
  const hasExactMatch = items.some(
    (item) => item.label.toLowerCase() === trimmedValue.toLowerCase()
  );

  return (
    <div ref={containerRef} className="space-y-1.5 relative">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-[var(--primary)]">{label}</label>
        {trimmedValue && (
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded font-medium border ${
              isNewItem
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
            }`}
          >
            {isNewItem ? '+ Baru' : '✓ Terdaftar'}
          </span>
        )}
      </div>

      {/* Unified Input + Dropdown Trigger */}
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={`w-full text-xs pl-2.5 pr-8 py-2 rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] focus:outline-none ${aksen.fokus}${tabularNums ? ' tabular-nums' : ''}`}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setIsOpen((prev) => !prev)}
          className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-[var(--muted)] hover:text-[var(--primary)] cursor-pointer"
          aria-label={`Buka pilihan ${label}`}
        >
          <ChevronDown
            size={14}
            className={`transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 z-30 max-h-48 overflow-y-auto rounded-[4px] border border-[var(--border)] bg-[var(--bg-modal)] shadow-lg py-1 divide-y divide-[var(--border)]">
          {/* Option to create new if user typed non-matching value */}
          {trimmedValue && !hasExactMatch && (
            <div
              onClick={() => setIsOpen(false)}
              className={`px-2.5 py-1.5 text-xs hover:bg-[var(--bg-hover)] cursor-pointer flex items-center justify-between ${aksen.teks} font-medium`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <Plus size={12} strokeWidth={2.5} className="flex-shrink-0" />
                <span className="truncate">Gunakan baru: “{trimmedValue}”</span>
              </div>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded ${aksen.pil} border ${aksen.garis} flex-shrink-0`}
              >
                Baru
              </span>
            </div>
          )}

          {/* Existing options */}
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => {
              const isSelected = item.label.toLowerCase() === trimmedValue.toLowerCase();
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onChange(item.label);
                    setIsOpen(false);
                  }}
                  className={`px-2.5 py-1.5 text-xs hover:bg-[var(--bg-hover)] cursor-pointer flex items-center justify-between ${
                    isSelected ? `${aksen.pil} font-semibold` : 'text-[var(--primary)]'
                  }`}
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className={`font-medium truncate${tabularNums ? ' tabular-nums' : ''}`}>
                      {item.label}
                    </span>
                    {item.sublabel && (
                      <span className="text-[10px] text-[var(--muted)] truncate">{item.sublabel}</span>
                    )}
                  </div>
                  {isSelected && (
                    <Check size={12} strokeWidth={2.5} className={`${aksen.teks} flex-shrink-0`} />
                  )}
                </div>
              );
            })
          ) : (
            !trimmedValue && (
              <div className="px-2.5 py-2 text-xs text-[var(--muted)] text-center">
                Belum ada opsi terdaftar
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};
