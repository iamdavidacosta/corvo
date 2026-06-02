import type { Category } from '../types';
import { monthISO } from './dates';

export const defaultCategories = [
  { name: 'ADDI', type: 'debt', color: '#F8FAFC', icon: 'layers' },
  { name: 'Servicios', type: 'service', color: '#D1D5DB', icon: 'receipt' },
  { name: 'Suscripciones', type: 'subscription', color: '#A3A3A3', icon: 'repeat' },
  { name: 'Préstamos', type: 'loan', color: '#737373', icon: 'landmark' },
  { name: 'Impuestos', type: 'tax', color: '#FBBF24', icon: 'file' },
  { name: 'Constantes', type: 'fixed', color: '#22C55E', icon: 'wallet' },
  { name: 'Tarjetas de Crédito', type: 'credit_card', color: '#525252', icon: 'credit-card' },
  { name: 'Otros', type: 'other', color: '#94A3B8', icon: 'circle' },
];

const services = [
  ['Luz', 120000, 1, false],
  ['Acueducto y Aseo', 43000, 1, false],
  ['Gas', 35010, 1, false],
  ['Internet', 101990, 21, true],
] as const;

const subscriptions = [
  ['Rappi', 29900, 11, true],
  ['Netflix', 54800, 4, true],
  ['Postpago Tigo', 35900, 5, true],
  ['Postpago Claro', 39000, 7, true],
  ['YouTube Premium', 13300, 13, true],
  ['iCloud', 12900, 18, true],
  ['Amazon Prime', 25000, 1, false],
] as const;

const taxes = [['Salud Premium', 53100, 1, true]] as const;

const fixedCosts = [
  ['Arriendo', 1370000, 1, false],
  ['Salidas/Otros', 1500000, 1, false],
  ['Mercado', 600000, 1, false],
  ['Proteína', 175000, 1, false],
  ['Complemento Almuerzo', 300000, 1, false],
  ['Mesada', 1000000, 1, false],
  ['Fondo Imprevistos', 113950, 1, false],
] as const;

type DemoItem = readonly [description: string, amount: number, dueDay: number, hadDateInSheet: boolean];

function dateInSelectedMonth(selectedMonth: string, day: number) {
  return `${selectedMonth.slice(0, 8)}${String(day).padStart(2, '0')}`;
}

export function buildDemoItems(userId: string, categories: Category[], selectedMonth = monthISO()) {
  const byName = new Map(categories.map((category) => [category.name, category.id]));
  const item = ([description, amount, dueDay, hadDateInSheet]: DemoItem, category: string) => ({
    user_id: userId,
    category_id: byName.get(category),
    description,
    amount,
    due_date: dateInSelectedMonth(selectedMonth, dueDay),
    frequency: 'monthly',
    status: 'pending',
    notes: hadDateInSheet ? null : 'Sin fecha en la hoja original',
    is_active: true,
  });

  return [
    ...services.map((row) => item(row, 'Servicios')),
    ...subscriptions.map((row) => item(row, 'Suscripciones')),
    ...taxes.map((row) => item(row, 'Impuestos')),
    ...fixedCosts.map((row) => item(row, 'Constantes')),
  ];
}

export function buildDemoIncomes(userId: string, selectedMonth = monthISO()) {
  return [
    { user_id: userId, name: 'Contrato GBS', amount: 7622850, income_type: 'current', frequency: 'monthly', month: selectedMonth, is_active: true },
  ];
}

export function buildDemoCards(userId: string, selectedMonth = monthISO()) {
  return [
    { user_id: userId, name: 'Rappi Asly', bank: 'Rappi', current_amount: 1227893, payment_date: selectedMonth, status: 'pending', notes: 'Tarjeta de la hoja original' },
    { user_id: userId, name: 'Tarjeta joven', bank: null, current_amount: 1479586, payment_date: selectedMonth, status: 'pending', notes: 'Tarjeta de la hoja original' },
    { user_id: userId, name: 'Rappi David', bank: 'Rappi', current_amount: 0, payment_date: selectedMonth, status: 'paid', notes: 'Sin valor pendiente en la hoja original' },
  ];
}
