import { addMonths, addYears, differenceInCalendarDays, format, isSameMonth, parseISO, startOfMonth } from 'date-fns';
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
