import { useCallback, useEffect, useState } from 'react';

export interface PrintHeaderImageConfig {
  mode: 'dual' | 'banner';
  leftLogoSrc?: string;
  rightLogoSrc?: string;
  bannerSrc?: string;
  heightPx?: number;
}

const STORAGE_KEY = 'hse:print-header-images:v1';

export const DEFAULT_HEADER_IMAGE_CONFIG: PrintHeaderImageConfig = {
  mode: 'dual',
  heightPx: 44,
};

function loadConfig(): PrintHeaderImageConfig {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_HEADER_IMAGE_CONFIG;
    const parsed = JSON.parse(raw) as Partial<PrintHeaderImageConfig>;
    return {
      mode: parsed.mode === 'banner' ? 'banner' : 'dual',
      leftLogoSrc: typeof parsed.leftLogoSrc === 'string' ? parsed.leftLogoSrc : undefined,
      rightLogoSrc: typeof parsed.rightLogoSrc === 'string' ? parsed.rightLogoSrc : undefined,
      bannerSrc: typeof parsed.bannerSrc === 'string' ? parsed.bannerSrc : undefined,
      heightPx:
        typeof parsed.heightPx === 'number' && Number.isFinite(parsed.heightPx)
          ? Math.min(120, Math.max(24, parsed.heightPx))
          : 44,
    };
  } catch {
    return DEFAULT_HEADER_IMAGE_CONFIG;
  }
}

export function usePrintHeaderImages() {
  const [config, setConfigState] = useState<PrintHeaderImageConfig>(loadConfig);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setConfigState(loadConfig());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setConfig = useCallback((next: PrintHeaderImageConfig) => {
    setConfigState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore quota errors */
    }
  }, []);

  const resetConfig = useCallback(() => {
    setConfigState(DEFAULT_HEADER_IMAGE_CONFIG);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return { config, setConfig, resetConfig };
}

/**
 * Konversi berkas gambar unggahan ke data-URI agar langsung tampil saat window.print()
 * tanpa ketergantungan jaringan. Gambar raster >1600px diperkecil agar ringan di localStorage.
 */
export function readHeaderImageAsDataUrl(file: File, maxWidth = 1600): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca berkas gambar.'));
    reader.onload = () => {
      const dataUrl = String(reader.result ?? '');
      if (file.type === 'image/svg+xml' || !file.type.startsWith('image/')) {
        resolve(dataUrl);
        return;
      }
      const img = new Image();
      img.onerror = () => resolve(dataUrl);
      img.onload = () => {
        if (img.width <= maxWidth) {
          resolve(dataUrl);
          return;
        }
        const scale = maxWidth / img.width;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const outType = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
        resolve(canvas.toDataURL(outType, 0.9));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}
