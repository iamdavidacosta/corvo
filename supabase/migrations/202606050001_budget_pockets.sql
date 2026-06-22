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

create index if not exists budget_pockets_user_month_idx on public.budget_pockets(user_id, month);

drop trigger if exists set_budget_pockets_updated_at on public.budget_pockets;
create trigger set_budget_pockets_updated_at before update on public.budget_pockets for each row execute function public.set_updated_at();

alter table public.budget_pockets enable row level security;

drop policy if exists "budget_pockets_select_own" on public.budget_pockets;
drop policy if exists "budget_pockets_insert_own" on public.budget_pockets;
drop policy if exists "budget_pockets_update_own" on public.budget_pockets;
drop policy if exists "budget_pockets_delete_own" on public.budget_pockets;

create policy "budget_pockets_select_own" on public.budget_pockets for select using (user_id = auth.uid());
create policy "budget_pockets_insert_own" on public.budget_pockets for insert with check (user_id = auth.uid());
create policy "budget_pockets_update_own" on public.budget_pockets for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "budget_pockets_delete_own" on public.budget_pockets for delete using (user_id = auth.uid());

with pocket_candidates as (
  select
    financial_items.id,
    financial_items.user_id,
    financial_items.category_id,
    financial_items.description,
    financial_items.amount,
    date_trunc('month', financial_items.due_date)::date as month,
    financial_items.notes
  from public.financial_items
  join public.categories on categories.id = financial_items.category_id
  where categories.name = 'Constantes'
    and financial_items.description in (
      'Salidas/Otros',
      'Mercado',
      'Proteína',
      'ProteÃ­na',
      'Complemento Almuerzo',
      'Mesada',
      'Fondo Imprevistos'
    )
),
inserted as (
  insert into public.budget_pockets (
    user_id,
    category_id,
    name,
    allocated_amount,
    spent_amount,
    month,
    status,
    notes
  )
  select
    user_id,
    category_id,
    replace(description, 'ProteÃ­na', 'Proteína'),
    amount,
    0,
    month,
    'active',
    coalesce(notes, 'Migrado desde pagos fijos como bolsillo mensual')
  from pocket_candidates
  on conflict (user_id, name, month) do update
    set allocated_amount = excluded.allocated_amount,
        category_id = excluded.category_id,
        notes = excluded.notes,
        updated_at = now()
  returning user_id, name, month
)
delete from public.financial_items
using pocket_candidates
where financial_items.id = pocket_candidates.id;
