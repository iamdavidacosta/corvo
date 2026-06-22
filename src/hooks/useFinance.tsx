import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { addDays, format, parseISO } from 'date-fns';
import { supabase } from '../lib/supabase';
import { belongsToPeriod, nextDueDate, recurringDateInPeriod, salaryCycleForMonth } from '../lib/dates';
import { buildDemoCards, buildDemoIncomes, buildDemoItems, buildDemoPockets, defaultCategories } from '../lib/demoData';
import type { BudgetPocket, Category, CreditCard, FinanceData, FinancialItem, IncomeSource, MonthlySetting, Payment } from '../types';
import type { BudgetPocketFormValues, CategoryFormValues, CreditCardFormValues, FinancialItemFormValues, IncomeFormValues, MonthlySettingFormValues } from '../lib/validations';
import { useAuth } from '../features/auth/AuthProvider';

type FinanceContextValue = FinanceData & {
  selectedMonth: string;
  loading: boolean;
  refresh: () => Promise<void>;
  saveFinancialItem: (values: FinancialItemFormValues, id?: string) => Promise<void>;
  deleteFinancialItem: (id: string) => Promise<void>;
  markFinancialItemPaid: (item: FinancialItem) => Promise<void>;
  saveBudgetPocket: (values: BudgetPocketFormValues, id?: string) => Promise<void>;
  deleteBudgetPocket: (id: string) => Promise<void>;
  saveIncome: (values: IncomeFormValues, id?: string) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
  saveCreditCard: (values: CreditCardFormValues, id?: string) => Promise<void>;
  deleteCreditCard: (id: string) => Promise<void>;
  saveMonthlySetting: (values: MonthlySettingFormValues) => Promise<void>;
  revertPayment: (payment: Payment) => Promise<void>;
  createDefaultCategories: () => Promise<Category[]>;
  saveCategory: (values: CategoryFormValues) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  loadDemoData: () => Promise<void>;
};

const FinanceContext = createContext<FinanceContextValue | null>(null);

const emptyData: FinanceData = {
  categories: [],
  items: [],
  pockets: [],
  incomes: [],
  cards: [],
  payments: [],
  monthlySetting: null,
  periodStart: '',
  periodEnd: '',
  nextPaymentDate: '',
};

export function FinanceProvider({ selectedMonth, children }: { selectedMonth: string; children: React.ReactNode }) {
  const { profile, user } = useAuth();
  const [data, setData] = useState<FinanceData>(emptyData);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const salaryCycleDay = profile?.salary_cycle_day ?? 1;
    const adjustToBusinessDay = profile?.salary_adjusts_to_business_day ?? true;
    const { periodStart, periodEnd, nextPaymentDate } = salaryCycleForMonth(selectedMonth, salaryCycleDay, adjustToBusinessDay);
    const periodEndExclusive = format(addDays(parseISO(periodEnd), 1), 'yyyy-MM-dd');
    const periodAnchors = Array.from(new Set([periodStart, selectedMonth]));

    const [categoriesRes, itemsRes, pocketsRes, incomesRes, cardsRes, paymentsRes, settingsRes] = await Promise.all([
      supabase.from('categories').select('*').eq('user_id', user.id).order('name'),
      supabase.from('financial_items').select('*, categories(*)').eq('user_id', user.id).eq('is_active', true).lte('due_date', periodEnd).order('due_date'),
      supabase.from('budget_pockets').select('*, categories(*)').eq('user_id', user.id).lte('month', periodStart).order('month', { ascending: false }),
      supabase.from('income_sources').select('*').eq('user_id', user.id).eq('is_active', true).order('name'),
      supabase.from('credit_cards').select('*').eq('user_id', user.id).order('payment_date', { nullsFirst: false }),
      supabase.from('payments').select('*, financial_items(*, categories(*))').eq('user_id', user.id).gte('paid_at', periodStart).lt('paid_at', periodEndExclusive).order('paid_at', { ascending: false }),
      supabase.from('monthly_settings').select('*').eq('user_id', user.id).in('month', periodAnchors),
    ]);

    const firstError = [categoriesRes, itemsRes, pocketsRes, incomesRes, cardsRes, paymentsRes, settingsRes].find((result) => result.error)?.error;
    if (firstError) throw firstError;

    const settings = ((settingsRes.data ?? []) as MonthlySetting[]).find((setting) => setting.month === periodStart) ?? ((settingsRes.data ?? []) as MonthlySetting[])[0] ?? null;
    const items = ((itemsRes.data ?? []) as FinancialItem[]).flatMap((item) => {
      const dueDate = recurringDateInPeriod(item.due_date, item.frequency, periodStart, periodEnd);
      if (!dueDate) return [];
      return [{ ...item, due_date: dueDate, status: dueDate === item.due_date ? item.status : 'pending' as const }];
    });
    const latestPockets = ((pocketsRes.data ?? []) as BudgetPocket[]).reduce<Map<string, BudgetPocket>>((latest, pocket) => {
      if (!latest.has(pocket.name)) latest.set(pocket.name, pocket);
      return latest;
    }, new Map());
    const pockets = Array.from(latestPockets.values())
      .filter((pocket) => pocket.status === 'active')
      .map((pocket) => pocket.month === periodStart ? pocket : { ...pocket, month: periodStart, spent_amount: 0 });
    const incomes = ((incomesRes.data ?? []) as IncomeSource[]).filter((income) => income.frequency === 'monthly' || !income.month || belongsToPeriod(income.month, periodStart, periodEnd));
    setData({
      categories: (categoriesRes.data ?? []) as Category[],
      items,
      pockets,
      incomes,
      cards: (cardsRes.data ?? []) as CreditCard[],
      payments: (paymentsRes.data ?? []) as Payment[],
      monthlySetting: settings,
      periodStart,
      periodEnd,
      nextPaymentDate,
    });
    setLoading(false);
  }, [profile?.salary_adjusts_to_business_day, profile?.salary_cycle_day, selectedMonth, user]);

  useEffect(() => {
    void refresh().catch(() => setLoading(false));
  }, [refresh]);

  const createDefaultCategories = useCallback(async () => {
    if (!user) return [];
    const rows = defaultCategories.map((category) => ({ ...category, user_id: user.id }));
    const { data: inserted, error } = await supabase.from('categories').upsert(rows, { onConflict: 'user_id,name' }).select('*');
    if (error) throw error;
    await refresh();
    return inserted as Category[];
  }, [refresh, user]);

  const saveCategory = useCallback(
    async (values: CategoryFormValues) => {
      if (!user) return;
      const { error } = await supabase.from('categories').upsert(
        {
          user_id: user.id,
          name: values.name,
          type: values.type || 'fixed',
          color: values.color || '#00E5FF',
          icon: values.icon || 'receipt',
        },
        { onConflict: 'user_id,name' },
      );
      if (error) throw error;
      await refresh();
    },
    [refresh, user],
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      if (!user) return;
      const { error } = await supabase.from('categories').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      await refresh();
    },
    [refresh, user],
  );

  const saveFinancialItem = useCallback(
    async (values: FinancialItemFormValues, id?: string) => {
      if (!user) return;
      const payload = { ...values, notes: values.notes || null, user_id: user.id, updated_at: new Date().toISOString() };
      const { error } = id ? await supabase.from('financial_items').update(payload).eq('id', id).eq('user_id', user.id) : await supabase.from('financial_items').insert(payload);
      if (error) throw error;
      await refresh();
    },
    [refresh, user],
  );

  const deleteFinancialItem = useCallback(
    async (id: string) => {
      if (!user) return;
      const { error } = await supabase.from('financial_items').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      await refresh();
    },
    [refresh, user],
  );

  const saveBudgetPocket = useCallback(
    async (values: BudgetPocketFormValues, id?: string) => {
      if (!user) return;
      const payload = {
        ...values,
        category_id: values.category_id || null,
        month: values.month || data.periodStart || selectedMonth,
        notes: values.notes || null,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };
      const { error } = id ? await supabase.from('budget_pockets').update(payload).eq('id', id).eq('user_id', user.id) : await supabase.from('budget_pockets').insert(payload);
      if (error) throw error;
      await refresh();
    },
    [data.periodStart, refresh, selectedMonth, user],
  );

  const deleteBudgetPocket = useCallback(
    async (id: string) => {
      if (!user) return;
      const { error } = await supabase
        .from('budget_pockets')
        .update({ status: 'closed', updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
      await refresh();
    },
    [refresh, user],
  );

  const markFinancialItemPaid = useCallback(
    async (item: FinancialItem) => {
      if (!user) return;
      const { error: paymentError } = await supabase.from('payments').insert({
        user_id: user.id,
        financial_item_id: item.id,
        amount: item.amount,
        paid_at: new Date().toISOString().slice(0, 10),
        original_due_date: item.due_date,
        notes: item.notes,
      });
      if (paymentError) throw paymentError;

      const update =
        item.frequency === 'one_time'
          ? { status: 'inactive', is_active: false, updated_at: new Date().toISOString() }
          : { status: 'pending', due_date: nextDueDate(item.due_date, item.frequency), updated_at: new Date().toISOString() };

      const { error: updateError } = await supabase.from('financial_items').update(update).eq('id', item.id).eq('user_id', user.id);
      if (updateError) throw updateError;
      await refresh();
    },
    [refresh, user],
  );

  const saveIncome = useCallback(
    async (values: IncomeFormValues, id?: string) => {
      if (!user) return;
      const payload = { ...values, month: values.month || data.periodStart || selectedMonth, user_id: user.id, updated_at: new Date().toISOString() };
      const { error } = id ? await supabase.from('income_sources').update(payload).eq('id', id).eq('user_id', user.id) : await supabase.from('income_sources').insert(payload);
      if (error) throw error;
      await refresh();
    },
    [data.periodStart, refresh, selectedMonth, user],
  );

  const deleteIncome = useCallback(
    async (id: string) => {
      if (!user) return;
      const { error } = await supabase.from('income_sources').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      await refresh();
    },
    [refresh, user],
  );

  const saveCreditCard = useCallback(
    async (values: CreditCardFormValues, id?: string) => {
      if (!user) return;
      const payload = { ...values, bank: values.bank || null, payment_date: values.payment_date || null, notes: values.notes || null, user_id: user.id, updated_at: new Date().toISOString() };
      const { error } = id ? await supabase.from('credit_cards').update(payload).eq('id', id).eq('user_id', user.id) : await supabase.from('credit_cards').insert(payload);
      if (error) throw error;
      await refresh();
    },
    [refresh, user],
  );

  const deleteCreditCard = useCallback(
    async (id: string) => {
      if (!user) return;
      const { error } = await supabase.from('credit_cards').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      await refresh();
    },
    [refresh, user],
  );

  const saveMonthlySetting = useCallback(
    async (values: MonthlySettingFormValues) => {
      if (!user) return;
      const { error } = await supabase.from('monthly_settings').upsert(
        {
          user_id: user.id,
          month: data.periodStart || selectedMonth,
          daily_designated_money: values.daily_designated_money,
          notes: values.notes || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,month' },
      );
      if (error) throw error;
      await refresh();
    },
    [data.periodStart, refresh, selectedMonth, user],
  );

  const revertPayment = useCallback(
    async (payment: Payment) => {
      if (!user) return;
      const { error } = await supabase.from('payments').delete().eq('id', payment.id).eq('user_id', user.id);
      if (error) throw error;
      if (payment.financial_item_id) {
        const { error: itemError } = await supabase
          .from('financial_items')
          .update({ status: 'pending', is_active: true, due_date: payment.original_due_date ?? selectedMonth, updated_at: new Date().toISOString() })
          .eq('id', payment.financial_item_id)
          .eq('user_id', user.id);
        if (itemError) throw itemError;
      }
      await refresh();
    },
    [refresh, selectedMonth, user],
  );

  const loadDemoData = useCallback(async () => {
    if (!user) return;
    await supabase.from('notification_logs').delete().eq('user_id', user.id);
    await supabase.from('payments').delete().eq('user_id', user.id);
    await supabase.from('financial_items').delete().eq('user_id', user.id);
    await supabase.from('budget_pockets').delete().eq('user_id', user.id);
    await supabase.from('income_sources').delete().eq('user_id', user.id);
    await supabase.from('credit_cards').delete().eq('user_id', user.id);
    await supabase.from('monthly_settings').delete().eq('user_id', user.id);
    await supabase.from('categories').delete().eq('user_id', user.id);

    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .insert(defaultCategories.map((category) => ({ ...category, user_id: user.id })))
      .select('*');
    if (categoriesError) throw categoriesError;

    await Promise.all([
      supabase.from('financial_items').insert(buildDemoItems(user.id, categories as Category[], selectedMonth)),
      supabase.from('budget_pockets').insert(buildDemoPockets(user.id, categories as Category[], data.periodStart || selectedMonth)),
      supabase.from('income_sources').insert(buildDemoIncomes(user.id, data.periodStart || selectedMonth)),
      supabase.from('credit_cards').insert(buildDemoCards(user.id, selectedMonth)),
      supabase
        .from('monthly_settings')
        .insert({
          user_id: user.id,
          month: data.periodStart || selectedMonth,
          daily_designated_money: 0,
          notes: 'Ahorro esperado de la hoja: $2.000.000. No se registra como ingreso porque representa saldo sobrante.',
        }),
    ]);
    await refresh();
  }, [data.periodStart, refresh, selectedMonth, user]);

  const value = useMemo<FinanceContextValue>(
    () => ({
      ...data,
      selectedMonth,
      loading,
      refresh,
      saveFinancialItem,
      deleteFinancialItem,
      markFinancialItemPaid,
      saveBudgetPocket,
      deleteBudgetPocket,
      saveIncome,
      deleteIncome,
      saveCreditCard,
      deleteCreditCard,
      saveMonthlySetting,
        revertPayment,
        createDefaultCategories,
        saveCategory,
        deleteCategory,
        loadDemoData,
    }),
    [
      data,
      selectedMonth,
      loading,
      refresh,
      saveFinancialItem,
      deleteFinancialItem,
      markFinancialItemPaid,
      saveBudgetPocket,
      deleteBudgetPocket,
      saveIncome,
      deleteIncome,
      saveCreditCard,
      deleteCreditCard,
      saveMonthlySetting,
        revertPayment,
        createDefaultCategories,
        saveCategory,
        deleteCategory,
        loadDemoData,
    ],
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const value = useContext(FinanceContext);
  if (!value) throw new Error('useFinance debe usarse dentro de FinanceProvider');
  return value;
}
