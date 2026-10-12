import { format, isValid, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export function formatIndonesianDate(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "";
  return format(d, "d MMMM yyyy", { locale: idLocale });
}

export function formatIndonesianMonthYear(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "";
  return format(d, "MMMM yyyy", { locale: idLocale });
}

export function toPeriodKey(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "";
  return format(d, "yyyy-MM");
}

export function toPeriodIso(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01T00:00:00.000Z`;
}

export function firstOfMonth(month: string): string {
  return `${month}-01`;
}
