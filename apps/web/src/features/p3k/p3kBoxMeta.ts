/**
 * Helper metadata Kotak P3K agar kompatibel dengan tabel p3k_boxes (API)
 * sekaligus mendukung Kode, Zona/Lantai, dan Tipe (A, B, C).
 */

import { detectP3kBoxType, type P3kBoxType } from '@/lib/p3kItems';

export interface ParsedP3kBoxMeta {
  kode: string;
  zoneName: string;
  boxType: P3kBoxType;
}

export function parseP3kBoxName(rawName: string, index = 0): ParsedP3kBoxMeta {
  const boxType = detectP3kBoxType(rawName);
  const parts = rawName.split('·').map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return {
      kode: parts[0],
      zoneName: parts[1],
      boxType,
    };
  }
  const lantaiMatch = rawName.match(/(Lantai\s*\d+|Lt\.?\s*\d+|Zona\s*\d+)/i);
  const zoneName = lantaiMatch ? lantaiMatch[1] : rawName.replace(/\(.*?\)/g, '').trim() || 'Kantor Pusat';
  const kode = `P3K-${String(index + 1).padStart(2, '0')}`;
  return { kode, zoneName, boxType };
}

export function formatP3kBoxName(kode: string, zoneName: string, boxType: P3kBoxType): string {
  const k = kode.trim() || 'P3K-01';
  const z = zoneName.trim() || 'Lantai 2';
  return `${k} · ${z} · Kotak Tipe ${boxType}`;
}
