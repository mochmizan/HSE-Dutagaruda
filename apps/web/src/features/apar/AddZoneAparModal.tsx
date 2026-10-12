import React, { useState, useEffect, useRef } from 'react';
import { X, Layers, ChevronDown, Check, Plus, AlertCircle } from 'lucide-react';

export interface AparCreationItem {
  kode: string;
  zoneName: string;
  jenis: 'POWDER' | 'CO2';
  ukuran: string;
  tahunPembuatan: number;
  expiredDate: string;
  inspectorName?: string;
}

export interface AddZoneAparModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingZones: string[];
  existingUnits: { id: string; kode: string; zoneName: string }[];
  lastUnitNumber?: number;
  onAddZone: (zoneName: string) => void;
  onAddAparUnits: (newUnits: AparCreationItem[]) => void;
  onReassignUnitZone: (unitId: string, newZoneName: string) => void;
}

interface UnifiedComboboxItem {
  id: string;
  label: string;
  sublabel?: string;
}

interface UnifiedComboboxProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  items: UnifiedComboboxItem[];
  placeholder: string;
  isNewItem: boolean;
}

const UnifiedCombobox: React.FC<UnifiedComboboxProps> = ({
  label,
  value,
  onChange,
  items,
  placeholder,
  isNewItem,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
          className="w-full text-xs pl-2.5 pr-8 py-2 rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] focus:outline-none focus:border-[#f2994a] tabular-nums"
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

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 z-30 max-h-48 overflow-y-auto rounded-[4px] border border-[var(--border)] bg-[var(--bg-modal)] shadow-lg py-1 divide-y divide-[var(--border)]">
          {trimmedValue && !hasExactMatch && (
            <div
              onClick={() => setIsOpen(false)}
              className="px-2.5 py-1.5 text-xs hover:bg-[var(--bg-hover)] cursor-pointer flex items-center justify-between text-[#f2994a] font-medium"
            >
              <div className="flex items-center gap-1.5 truncate">
                <Plus size={12} strokeWidth={2.5} className="flex-shrink-0" />
                <span className="truncate">Gunakan baru: “{trimmedValue}”</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#f2994a]/10 text-[#f2994a] border border-[#f2994a]/20 flex-shrink-0">
                Baru
              </span>
            </div>
          )}

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
                    isSelected ? 'bg-[#f2994a]/10 text-[#f2994a] font-semibold' : 'text-[var(--primary)]'
                  }`}
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="font-medium truncate tabular-nums">{item.label}</span>
                    {item.sublabel && (
                      <span className="text-[10px] text-[var(--muted)] truncate">{item.sublabel}</span>
                    )}
                  </div>
                  {isSelected && (
                    <Check size={12} strokeWidth={2.5} className="text-[#f2994a] flex-shrink-0" />
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

export const AddZoneAparModal: React.FC<AddZoneAparModalProps> = ({
  isOpen,
  onClose,
  existingZones,
  existingUnits = [],
  onAddZone,
  onAddAparUnits,
  onReassignUnitZone,
}) => {
  const [zoneInput, setZoneInput] = useState<string>('');
  const [aparInput, setAparInput] = useState<string>('');
  const [jenis, setJenis] = useState<'POWDER' | 'CO2'>('POWDER');
  const [ukuran, setUkuran] = useState<string>('3 kg');
  const [ukuranTouched, setUkuranTouched] = useState(false);
  const [tahunPembuatan, setTahunPembuatan] = useState<number>(2026);
  const [expiredDate, setExpiredDate] = useState<string>('');
  const [inspectorName, setInspectorName] = useState<string>('Alex Chen (Staff HSE)');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setZoneInput(existingZones.length > 0 ? existingZones[0] : '');
      setAparInput('');
      setJenis('POWDER');
      setUkuran('3 kg');
      setUkuranTouched(false);
      setTahunPembuatan(2026);
      setExpiredDate('');
      setInspectorName('Alex Chen (Staff HSE)');
      setErrorMessage('');
    }
  }, [isOpen, existingZones]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleJenisChange = (next: 'POWDER' | 'CO2') => {
    setJenis(next);
    if (!ukuranTouched) {
      setUkuran(next === 'CO2' ? '5 kg' : '3 kg');
    }
  };

  if (!isOpen) return null;

  const isNewZone =
    Boolean(zoneInput.trim()) &&
    !existingZones.some((z) => z.toLowerCase() === zoneInput.trim().toLowerCase());

  const isNewApar =
    Boolean(aparInput.trim()) &&
    !existingUnits.some((u) => u.kode.toLowerCase() === aparInput.trim().toLowerCase());

  const zoneOptions: UnifiedComboboxItem[] = existingZones.map((z) => ({
    id: z,
    label: z,
  }));

  const aparOptions: UnifiedComboboxItem[] = existingUnits.map((u) => ({
    id: u.id,
    label: u.kode,
    sublabel: `Zona saat ini: ${u.zoneName}`,
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const targetZone = zoneInput.trim();
    if (!targetZone) {
      setErrorMessage('Tentukan nama zona (pilih dari dropdown atau ketik nama baru).');
      return;
    }

    const targetApar = aparInput.trim();

    if (!targetApar) {
      if (isNewZone) {
        onAddZone(targetZone);
        onClose();
        return;
      }
      setErrorMessage('Tentukan kode APAR (pilih dari dropdown atau ketik kode baru).');
      return;
    }

    const matchedExistingUnit = existingUnits.find(
      (u) => u.kode.toLowerCase() === targetApar.toLowerCase()
    );

    if (matchedExistingUnit) {
      if (isNewZone) {
        onAddZone(targetZone);
      }
      onReassignUnitZone(matchedExistingUnit.id, targetZone);
      onClose();
      return;
    }

    if (!expiredDate) {
      setErrorMessage('Tanggal kedaluwarsa wajib diisi untuk unit APAR baru.');
      return;
    }

    if (!ukuran.trim()) {
      setErrorMessage('Ukuran APAR wajib diisi (contoh: 3 kg).');
      return;
    }

    if (!Number.isFinite(tahunPembuatan) || tahunPembuatan < 1990 || tahunPembuatan > 2030) {
      setErrorMessage('Tahun pembuatan tidak valid (1990–2030).');
      return;
    }

    const codes = targetApar
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    if (codes.length === 0) {
      setErrorMessage('Masukkan kode APAR yang valid.');
      return;
    }

    const duplicate = codes.find((c) =>
      existingUnits.some((u) => u.kode.toLowerCase() === c.toLowerCase())
    );
    if (duplicate) {
      setErrorMessage(`Kode APAR “${duplicate}” sudah terdaftar. Gunakan kode lain.`);
      return;
    }

    if (isNewZone) {
      onAddZone(targetZone);
    }

    const payload: AparCreationItem[] = codes.map((kode) => ({
      kode,
      zoneName: targetZone,
      jenis,
      ukuran: ukuran.trim(),
      tahunPembuatan,
      expiredDate,
      inspectorName,
    }));

    onAddAparUnits(payload);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none no-print"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-md bg-[var(--bg-modal)] text-[var(--primary)] rounded-lg border border-[var(--border)] shadow-xl overflow-hidden emil-modal font-sans flex flex-col max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="unified-add-zone-apar-title"
      >
        <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-sidebar)]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-[#f2994a]/15 text-[#f2994a] flex items-center justify-center text-xs font-bold flex-shrink-0">
              <Layers size={15} strokeWidth={2.2} />
            </div>
            <div>
              <h2
                id="unified-add-zone-apar-title"
                className="text-xs font-bold text-[var(--primary)] tracking-tight"
              >
                Kelola Zona &amp; APAR
              </h2>
              <p className="text-[11px] text-[var(--muted)]">
                Pilih dari daftar dropdown atau ketik langsung untuk baru
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 rounded flex items-center justify-center text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--bg-hover)] cursor-pointer pressable"
            aria-label="Tutup modal"
          >
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {errorMessage && (
            <div className="p-2 rounded bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <UnifiedCombobox
            label="Zona"
            value={zoneInput}
            onChange={setZoneInput}
            items={zoneOptions}
            placeholder="Pilih atau ketik nama zona..."
            isNewItem={isNewZone}
          />

          <UnifiedCombobox
            label="Unit APAR"
            value={aparInput}
            onChange={setAparInput}
            items={aparOptions}
            placeholder="Pilih atau ketik kode APAR..."
            isNewItem={isNewApar}
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[var(--primary)]">
                Jenis APAR
              </label>
              <select
                value={jenis}
                onChange={(e) => handleJenisChange(e.target.value as 'POWDER' | 'CO2')}
                className="w-full text-xs px-2.5 py-2 rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] focus:outline-none focus:border-[#f2994a]"
              >
                <option value="POWDER">Powder</option>
                <option value="CO2">CO₂</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[var(--primary)]">
                Ukuran
              </label>
              <input
                type="text"
                value={ukuran}
                onChange={(e) => {
                  setUkuran(e.target.value);
                  setUkuranTouched(true);
                }}
                placeholder="cth: 3 kg"
                className="w-full text-xs px-2.5 py-2 rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] tabular-nums focus:outline-none focus:border-[#f2994a]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[var(--primary)]">
                Tahun Pembuatan
              </label>
              <input
                type="number"
                value={tahunPembuatan}
                min={1990}
                max={2030}
                onChange={(e) => setTahunPembuatan(Number(e.target.value))}
                className="w-full text-xs px-2.5 py-2 rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] tabular-nums focus:outline-none focus:border-[#f2994a]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[var(--primary)]">
                Tanggal Kedaluwarsa
              </label>
              <input
                type="date"
                value={expiredDate}
                onChange={(e) => setExpiredDate(e.target.value)}
                className="w-full text-xs px-2.5 py-2 rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] tabular-nums focus:outline-none focus:border-[#f2994a]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[var(--primary)]">
              Petugas Pemeriksa
            </label>
            <select
              value={inspectorName}
              onChange={(e) => setInspectorName(e.target.value)}
              className="w-full text-xs px-2.5 py-2 rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] focus:outline-none focus:border-[#f2994a]"
            >
              <option value="Alex Chen (Staff HSE)">Alex Chen (Staff HSE)</option>
              <option value="Budi Santoso (Staff HSE)">Budi Santoso (Staff HSE)</option>
              <option value="Siti Rahma (Inspector K3)">Siti Rahma (Inspector K3)</option>
              <option value="Deni Kurniawan (Teknisi K3)">Deni Kurniawan (Teknisi K3)</option>
            </select>
          </div>

          <div className="pt-2 border-t border-[var(--border)] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium rounded border border-[var(--border)] hover:bg-[var(--bg-hover)] text-[var(--secondary)] cursor-pointer pressable"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold rounded bg-[#f2994a] hover:bg-[#e08838] text-white shadow-2xs cursor-pointer flex items-center gap-1.5 pressable"
            >
              <Check size={13} strokeWidth={2.5} />
              <span>Simpan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
