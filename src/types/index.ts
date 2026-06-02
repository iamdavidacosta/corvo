export type Frequency = 'one_time' | 'monthly' | 'yearly';
export type ItemStatus = 'pending' | 'paid' | 'overdue' | 'inactive';
export type IncomeType = 'current' | 'expected';

export type Profile = {
  id: string;
  full_name: string | null;
  currency: string;
  notification_days_before: number;
  preferred_notification_time: string;
  notifications_enabled?: boolean;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  user_id: string;
  name: string;
  type: string;
  color: string | null;
  icon: string | null;
  created_at: string;
};

export type FinancialItem = {
  id: string;
  user_id: string;
  category_id: string | null;
  description: string;
  amount: number;
  due_date: string;
  frequency: Frequency;
  status: ItemStatus;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  categories?: Category | null;
};

export type IncomeSource = {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  income_type: IncomeType;
  frequency: 'monthly' | 'one_time';
  month: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CreditCard = {
  id: string;
  user_id: string;
  name: string;
  bank: string | null;
  current_amount: number;
  payment_date: string | null;
  status: ItemStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Payment = {
  id: string;
  user_id: string;
  financial_item_id: string | null;
  amount: number;
  paid_at: string;
  original_due_date: string | null;
  notes: string | null;
  created_at: string;
  financial_items?: FinancialItem | null;
};

export type MonthlySetting = {
  id: string;
  user_id: string;
  month: string;
  daily_designated_money: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type NotificationLog = {
  id: string;
  user_id: string;
  financial_item_id: string | null;
  notification_type: string;
  scheduled_for: string;
  sent_at: string;
  status: string;
  created_at: string;
  financial_items?: FinancialItem | null;
};

export type PushSubscriptionRow = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type FinanceData = {
  categories: Category[];
  items: FinancialItem[];
  incomes: IncomeSource[];
  cards: CreditCard[];
  payments: Payment[];
  monthlySetting: MonthlySetting | null;
};
