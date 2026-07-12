import {
  addMonths,
  endOfMonth,
  format,
  isSameDay,
  isToday,
  parseISO,
  startOfMonth,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";

export const TIMEZONE = "America/Sao_Paulo";

export function nowInSaoPaulo(): Date {
  return toZonedTime(new Date(), TIMEZONE);
}

export function formatDate(date: string | Date, pattern = "dd/MM/yyyy"): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatInTimeZone(d, TIMEZONE, pattern, { locale: ptBR });
}

export function formatDateLong(date: string | Date): string {
  return formatDate(date, "dd 'de' MMMM 'de' yyyy");
}

export function formatMonthYear(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  const formatted = formatInTimeZone(d, TIMEZONE, "MMMM yyyy", { locale: ptBR });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function toISODate(date: Date): string {
  return formatInTimeZone(date, TIMEZONE, "yyyy-MM-dd");
}

export function monthKey(date: Date | string = nowInSaoPaulo()): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatInTimeZone(d, TIMEZONE, "yyyy-MM");
}

export function greetingForNow(name: string): string {
  const hour = Number(formatInTimeZone(new Date(), TIMEZONE, "H"));
  let greeting = "Boa noite";
  if (hour >= 5 && hour < 12) greeting = "Bom dia";
  else if (hour >= 12 && hour < 18) greeting = "Boa tarde";
  return `${greeting}, ${name}`;
}

export function getMonthRange(month: string): { start: string; end: string } {
  const start = parseISO(`${month}-01`);
  return {
    start: toISODate(startOfMonth(start)),
    end: toISODate(endOfMonth(start)),
  };
}

export function shiftMonth(month: string, delta: number): string {
  const date = parseISO(`${month}-01`);
  return monthKey(addMonths(date, delta));
}

export function previousMonth(month: string): string {
  return shiftMonth(month, -1);
}

export function daysUntil(date: string): number {
  const target = parseISO(date);
  const today = parseISO(toISODate(nowInSaoPaulo()));
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function isOverdueDate(date: string): boolean {
  return daysUntil(date) < 0;
}

export function isDueToday(date: string): boolean {
  return isToday(parseISO(date));
}

export function computeStatusFromDates(
  status: string,
  dueDate: string | null,
  paymentDate: string | null
): "paid" | "pending" | "due_today" | "overdue" | "scheduled" {
  if (status === "paid" || paymentDate) return "paid";
  if (status === "scheduled") return "scheduled";
  if (!dueDate) return "pending";
  if (isDueToday(dueDate)) return "due_today";
  if (isOverdueDate(dueDate)) return "overdue";
  return "pending";
}

export function estimatePayoffDate(
  remainingInstallments: number,
  dueDay: number,
  from: Date = nowInSaoPaulo()
): string {
  const target = addMonths(from, Math.max(remainingInstallments, 0));
  const year = target.getFullYear();
  const month = target.getMonth();
  const lastDay = endOfMonth(target).getDate();
  const day = Math.min(dueDay, lastDay);
  return toISODate(new Date(year, month, day));
}

export function formatRelativeDue(date: string): string {
  const days = daysUntil(date);
  if (days === 0) return "Vence hoje";
  if (days === 1) return "Vence amanhã";
  if (days === -1) return "Atrasado 1 dia";
  if (days < 0) return `Atrasado ${Math.abs(days)} dias`;
  return `Em ${days} dias`;
}

export function sameCalendarDay(a: string, b: string): boolean {
  return isSameDay(parseISO(a), parseISO(b));
}

export function startOfCurrentMonth(): string {
  return toISODate(startOfMonth(nowInSaoPaulo()));
}

export function monthsBetween(start: string, end: string): number {
  const s = parseISO(start);
  const e = parseISO(end);
  return (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
}

export { addMonths, subMonths, startOfMonth, endOfMonth, format, parseISO, ptBR };
