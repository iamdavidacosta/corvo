import { createClient } from '@supabase/supabase-js';
import { addMonths, addYears, format, parseISO } from 'date-fns';
import webpush from 'web-push';

export type ApiRequest = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
};

export type ApiResponse = {
  status: (code: number) => {
    json: (body: unknown) => void;
  };
};

export function getServerSupabase() {
  const url = process.env.VITE_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) throw new Error('Faltan VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, serviceRole, { auth: { persistSession: false } });
}

export function configureWebPush() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@corvo.app';
  if (!publicKey || !privateKey) throw new Error('Faltan VAPID_PUBLIC_KEY o VAPID_PRIVATE_KEY');
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export function addDaysISO(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

export function recurringDateInPeriod(date: string, frequency: string, periodStart: string, periodEnd: string) {
  if (frequency === 'one_time') return date >= periodStart && date <= periodEnd ? date : null;

  let occurrence = date;
  while (occurrence < periodStart) {
    const parsed = parseISO(occurrence);
    occurrence = format(frequency === 'yearly' ? addYears(parsed, 1) : addMonths(parsed, 1), 'yyyy-MM-dd');
  }

  return occurrence <= periodEnd ? occurrence : null;
}
