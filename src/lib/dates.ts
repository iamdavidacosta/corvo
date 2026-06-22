import { addDays, addMonths, addYears, differenceInCalendarDays, endOfMonth, format, getDay, isSameMonth, parseISO, startOfMonth, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Frequency } from '../types';

export function todayISO() {
  return format(new Date(), 'yyyy-MM-dd');
}

export function monthISO(date = new Date()) {
  return format(startOfMonth(date), 'yyyy-MM-dd');
}

export function readableMonth(month: string) {
  return format(parseISO(month), 'MMMM yyyy', { locale: es });
}

export function readableDate(date: string | null | undefined) {
  if (!date) return 'Sin fecha';
  return format(parseISO(date), 'd MMM yyyy', { locale: es });
}

export function belongsToMonth(date: string | null | undefined, month: string) {
  if (!date) return false;
  return isSameMonth(parseISO(date), parseISO(month));
}

export function belongsToPeriod(date: string | null | undefined, start: string, end: string) {
  if (!date) return false;
  return date >= start && date <= end;
}

export function daysUntil(date: string) {
  return differenceInCalendarDays(parseISO(date), new Date());
}

export function nextDueDate(date: string, frequency: Frequency) {
  if (frequency === 'monthly') return format(addMonths(parseISO(date), 1), 'yyyy-MM-dd');
  if (frequency === 'yearly') return format(addYears(parseISO(date), 1), 'yyyy-MM-dd');
  return date;
}

export function statusFromDueDate(status: string, dueDate: string) {
  if (status === 'paid' || status === 'inactive') return status;
  return daysUntil(dueDate) < 0 ? 'overdue' : 'pending';
}

function easterDate(year: number) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function nextMonday(date: Date) {
  const day = getDay(date);
  return day === 1 ? date : addDays(date, (8 - day) % 7);
}

function isoFromParts(year: number, monthIndex: number, day: number) {
  return format(new Date(year, monthIndex, day), 'yyyy-MM-dd');
}

export function colombianHolidaySet(year: number) {
  const easter = easterDate(year);
  const fixed = [
    isoFromParts(year, 0, 1),
    isoFromParts(year, 4, 1),
    isoFromParts(year, 6, 20),
    isoFromParts(year, 7, 7),
    isoFromParts(year, 11, 8),
    isoFromParts(year, 11, 25),
  ];
  const movedToMonday = [
    new Date(year, 0, 6),
    new Date(year, 2, 19),
    new Date(year, 5, 29),
    new Date(year, 7, 15),
    new Date(year, 9, 12),
    new Date(year, 10, 1),
    new Date(year, 10, 11),
    addDays(easter, 39),
    addDays(easter, 60),
    addDays(easter, 68),
  ].map((date) => format(nextMonday(date), 'yyyy-MM-dd'));
  const easterFixed = [format(addDays(easter, -3), 'yyyy-MM-dd'), format(addDays(easter, -2), 'yyyy-MM-dd')];
  return new Set([...fixed, ...movedToMonday, ...easterFixed]);
}

export function isColombianBusinessDay(date: Date) {
  const day = getDay(date);
  if (day === 0 || day === 6) return false;
  return !colombianHolidaySet(date.getFullYear()).has(format(date, 'yyyy-MM-dd'));
}

export function adjustedSalaryDate(month: string, salaryCycleDay = 1, adjustToBusinessDay = true) {
  const base = parseISO(month);
  const lastDay = endOfMonth(base).getDate();
  const day = Math.min(Math.max(1, salaryCycleDay), lastDay);
  let date = new Date(base.getFullYear(), base.getMonth(), day);
  if (!adjustToBusinessDay) return format(date, 'yyyy-MM-dd');
  while (!isColombianBusinessDay(date)) {
    date = subDays(date, 1);
  }
  return format(date, 'yyyy-MM-dd');
}

export function salaryCycleForMonth(month: string, salaryCycleDay = 1, adjustToBusinessDay = true) {
  const periodStart = adjustedSalaryDate(month, salaryCycleDay, adjustToBusinessDay);
  const nextMonth = monthISO(addMonths(parseISO(month), 1));
  const nextPaymentDate = adjustedSalaryDate(nextMonth, salaryCycleDay, adjustToBusinessDay);
  const periodEnd = format(subDays(parseISO(nextPaymentDate), 1), 'yyyy-MM-dd');
  return { periodStart, periodEnd, nextPaymentDate };
}

export function activeSalaryCycleMonth(date = new Date(), salaryCycleDay = 1, adjustToBusinessDay = true) {
  const currentMonth = monthISO(date);
  const currentPeriodStart = adjustedSalaryDate(currentMonth, salaryCycleDay, adjustToBusinessDay);
  if (format(date, 'yyyy-MM-dd') >= currentPeriodStart) return currentMonth;
  return monthISO(addMonths(parseISO(currentMonth), -1));
}
