/**
 * Date and Period Utilities for HSE Inspections
 * Standardized Indonesian locale formatting
 */

import { format, parseISO, isValid } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

/**
 * Format date in standard Indonesian readable format
 * e.g., "27 September 2026"
 */
export function formatIndonesianDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '';
  return format(d, 'd MMMM yyyy', { locale: idLocale });
}

/**
 * Format month and year
 * e.g., "September 2026"
 */
export function formatIndonesianMonthYear(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '';
  return format(d, 'MMMM yyyy', { locale: idLocale });
}

/**
 * Format period key (YYYY-MM)
 */
export function toPeriodKey(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '';
  return format(d, 'yyyy-MM');
}

/**
 * Format first-of-month ISO string (YYYY-MM-01T00:00:00.000Z)
 */
export function toPeriodIso(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01T00:00:00.000Z`;
}
