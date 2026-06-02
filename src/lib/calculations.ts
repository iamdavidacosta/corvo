import { isAfter, isBefore, isEqual, parseISO } from 'date-fns';
import type { FinancialItem, IncomeSource, Payment } from '../types';
import { daysUntil } from './dates';

export function getTotalDebt(items: FinancialItem[]) {
  return items.filter((item) => item.status !== 'paid' && item.status !== 'inactive' && item.is_active).reduce((sum, item) => sum + Number(item.amount), 0);
}

export function getTotalPaid(payments: Payment[]) {
  return payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
}

export function getPendingTotal(items: FinancialItem[]) {
  return items.filter((item) => item.status === 'pending' && item.is_active).reduce((sum, item) => sum + Number(item.amount), 0);
}

export function getOverdueItems(items: FinancialItem[]) {
  const today = new Date();
  return items.filter((item) => item.status !== 'paid' && item.status !== 'inactive' && item.is_active && isBefore(parseISO(item.due_date), today));
}

export function getUpcomingItems(items: FinancialItem[], days = 3) {
  return items
    .filter((item) => {
      const gap = daysUntil(item.due_date);
      return item.status !== 'paid' && item.status !== 'inactive' && item.is_active && gap >= 0 && gap <= days;
    })
    .sort((a, b) => a.due_date.localeCompare(b.due_date));
}

export function getCurrentIncome(incomes: IncomeSource[]) {
  return incomes.filter((income) => income.income_type === 'current' && income.is_active).reduce((sum, income) => sum + Number(income.amount), 0);
}

export function getExpectedIncome(incomes: IncomeSource[]) {
  return incomes.filter((income) => income.income_type === 'expected' && income.is_active).reduce((sum, income) => sum + Number(income.amount), 0);
}

export function getCurrentBalanceWithoutDebt(currentIncome: number, debtTotal: number) {
  return currentIncome - debtTotal;
}

export function getExpectedBalanceWithoutDebt(expectedIncome: number, debtTotal: number) {
  return expectedIncome - debtTotal;
}

export function getFreeBalance(balanceWithoutDebt: number, dailyDesignatedMoney: number) {
  return balanceWithoutDebt - dailyDesignatedMoney;
}

export function groupByCategory(items: FinancialItem[]) {
  return items.reduce<Record<string, number>>((groups, item) => {
    const name = item.categories?.name ?? 'Sin categoría';
    groups[name] = (groups[name] ?? 0) + Number(item.amount);
    return groups;
  }, {});
}

export function groupByDueDate(items: FinancialItem[]) {
  return items.reduce<Record<string, FinancialItem[]>>((groups, item) => {
    groups[item.due_date] = [...(groups[item.due_date] ?? []), item];
    return groups;
  }, {});
}

export function isDateInRange(date: string, start: string, end: string) {
  const parsed = parseISO(date);
  const startDate = parseISO(start);
  const endDate = parseISO(end);
  return (isAfter(parsed, startDate) || isEqual(parsed, startDate)) && (isBefore(parsed, endDate) || isEqual(parsed, endDate));
}
