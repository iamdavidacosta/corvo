create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  currency text default 'COP',
  notification_days_before integer default 3,
  preferred_notification_time time default '08:00',
  notifications_enabled boolean default true,
  salary_cycle_day integer default 1 check (salary_cycle_day between 1 and 31),
  salary_adjusts_to_business_day boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null,
  color text,
  icon text,
  created_at timestamptz default now(),
  unique (user_id, name)
);

create table if not exists public.financial_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  description text not null,
  amount numeric(14,2) not null,
  due_date date not null,
  frequency text not null check (frequency in ('one_time','monthly','yearly')),
  status text not null default 'pending' check (status in ('pending','paid','overdue','inactive')),
  notes text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.income_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric(14,2) not null,
  income_type text not null check (income_type in ('current','expected')),
  frequency text not null default 'monthly' check (frequency in ('monthly','one_time')),
  month date,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.budget_pockets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  allocated_amount numeric(14,2) not null,
  spent_amount numeric(14,2) default 0,
  month date not null,
  status text not null default 'active' check (status in ('active','paused','closed')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, name, month)
);

create table if not exists public.credit_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  bank text,
  current_amount numeric(14,2) default 0,
  payment_date date,
  status text default 'pending' check (status in ('pending','paid','overdue','inactive')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  financial_item_id uuid references public.financial_items(id) on delete set null,
  amount numeric(14,2) not null,
  paid_at date not null default current_date,
  original_due_date date,
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.monthly_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month date not null,
  daily_designated_money numeric(14,2) default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, month)
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  financial_item_id uuid references public.financial_items(id) on delete cascade,
  notification_type text not null,
  scheduled_for date not null,
  sent_at timestamptz default now(),
  status text default 'sent',
  created_at timestamptz default now(),
  unique (user_id, financial_item_id, notification_type, scheduled_for)
);

create index if not exists financial_items_user_due_idx on public.financial_items(user_id, due_date);
create index if not exists budget_pockets_user_month_idx on public.budget_pockets(user_id, month);
create index if not exists payments_user_paid_idx on public.payments(user_id, paid_at);
create index if not exists notification_logs_dedupe_idx on public.notification_logs(user_id, financial_item_id, notification_type, scheduled_for);

create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger set_financial_items_updated_at before update on public.financial_items for each row execute function public.set_updated_at();
create trigger set_income_sources_updated_at before update on public.income_sources for each row execute function public.set_updated_at();
create trigger set_budget_pockets_updated_at before update on public.budget_pockets for each row execute function public.set_updated_at();
create trigger set_credit_cards_updated_at before update on public.credit_cards for each row execute function public.set_updated_at();
create trigger set_monthly_settings_updated_at before update on public.monthly_settings for each row execute function public.set_updated_at();
create trigger set_push_subscriptions_updated_at before update on public.push_subscriptions for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.financial_items enable row level security;
alter table public.income_sources enable row level security;
alter table public.budget_pockets enable row level security;
alter table public.credit_cards enable row level security;
alter table public.payments enable row level security;
alter table public.monthly_settings enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.notification_logs enable row level security;

create policy "profiles_select_own" on public.profiles for select using (id = auth.uid());
create policy "profiles_update_own" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles_insert_own" on public.profiles for insert with check (id = auth.uid());

create policy "categories_select_own" on public.categories for select using (user_id = auth.uid());
create policy "categories_insert_own" on public.categories for insert with check (user_id = auth.uid());
create policy "categories_update_own" on public.categories for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "categories_delete_own" on public.categories for delete using (user_id = auth.uid());

create policy "financial_items_select_own" on public.financial_items for select using (user_id = auth.uid());
create policy "financial_items_insert_own" on public.financial_items for insert with check (user_id = auth.uid());
create policy "financial_items_update_own" on public.financial_items for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "financial_items_delete_own" on public.financial_items for delete using (user_id = auth.uid());

create policy "income_sources_select_own" on public.income_sources for select using (user_id = auth.uid());
create policy "income_sources_insert_own" on public.income_sources for insert with check (user_id = auth.uid());
create policy "income_sources_update_own" on public.income_sources for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "income_sources_delete_own" on public.income_sources for delete using (user_id = auth.uid());

create policy "budget_pockets_select_own" on public.budget_pockets for select using (user_id = auth.uid());
create policy "budget_pockets_insert_own" on public.budget_pockets for insert with check (user_id = auth.uid());
create policy "budget_pockets_update_own" on public.budget_pockets for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "budget_pockets_delete_own" on public.budget_pockets for delete using (user_id = auth.uid());

create policy "credit_cards_select_own" on public.credit_cards for select using (user_id = auth.uid());
create policy "credit_cards_insert_own" on public.credit_cards for insert with check (user_id = auth.uid());
create policy "credit_cards_update_own" on public.credit_cards for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "credit_cards_delete_own" on public.credit_cards for delete using (user_id = auth.uid());

create policy "payments_select_own" on public.payments for select using (user_id = auth.uid());
create policy "payments_insert_own" on public.payments for insert with check (user_id = auth.uid());
create policy "payments_update_own" on public.payments for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "payments_delete_own" on public.payments for delete using (user_id = auth.uid());

create policy "monthly_settings_select_own" on public.monthly_settings for select using (user_id = auth.uid());
create policy "monthly_settings_insert_own" on public.monthly_settings for insert with check (user_id = auth.uid());
create policy "monthly_settings_update_own" on public.monthly_settings for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "monthly_settings_delete_own" on public.monthly_settings for delete using (user_id = auth.uid());

create policy "push_subscriptions_select_own" on public.push_subscriptions for select using (user_id = auth.uid());
create policy "push_subscriptions_insert_own" on public.push_subscriptions for insert with check (user_id = auth.uid());
create policy "push_subscriptions_update_own" on public.push_subscriptions for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "push_subscriptions_delete_own" on public.push_subscriptions for delete using (user_id = auth.uid());

create policy "notification_logs_select_own" on public.notification_logs for select using (user_id = auth.uid());
create policy "notification_logs_insert_own" on public.notification_logs for insert with check (user_id = auth.uid());
create policy "notification_logs_update_own" on public.notification_logs for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notification_logs_delete_own" on public.notification_logs for delete using (user_id = auth.uid());
