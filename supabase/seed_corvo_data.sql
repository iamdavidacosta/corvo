-- CORVO - Seed de datos de la hoja compartida.
--
-- Uso:
-- 1. Reemplaza 8152f6f9-f6f8-4db7-ab0f-b11170b5678d por el id real del usuario en auth.users.
-- 2. Ejecuta primero supabase/clear_user_data.sql si quieres empezar limpio.
-- 3. Ejecuta todo este archivo en Supabase SQL Editor.
--
-- Importante:
-- - Los pagos con fecha se crean en el mes actual para que aparezcan en calendario.
-- - Mercado, mesada, proteína y similares se crean como bolsillos, no como pagos vencibles.
-- - "Ahorro" NO se crea como ingreso; se guarda como nota del mes.

begin;

with selected_user as (
  select '8152f6f9-f6f8-4db7-ab0f-b11170b5678d'::uuid as user_id
),
seed_categories as (
  insert into public.categories (user_id, name, type, color, icon)
  select selected_user.user_id, seed.name, seed.type, seed.color, seed.icon
  from selected_user
  cross join (
    values
      ('ADDI', 'debt', '#F8FAFC', 'layers'),
      ('Servicios', 'service', '#D1D5DB', 'receipt'),
      ('Suscripciones', 'subscription', '#A3A3A3', 'repeat'),
      ('Préstamos', 'loan', '#737373', 'landmark'),
      ('Impuestos', 'tax', '#FBBF24', 'file'),
      ('Constantes', 'fixed', '#22C55E', 'wallet'),
      ('Tarjetas de Crédito', 'credit_card', '#525252', 'credit-card'),
      ('Otros', 'other', '#94A3B8', 'circle')
  ) as seed(name, type, color, icon)
  on conflict (user_id, name) do update
    set type = excluded.type,
        color = excluded.color,
        icon = excluded.icon
  returning id, user_id, name
),
seed_month as (
  select date_trunc('month', current_date)::date as month_start
),
seed_items as (
  select *
  from (
    values
      ('Servicios', 'Luz', 120000.00, 1, false),
      ('Servicios', 'Acueducto y Aseo', 43000.00, 1, false),
      ('Servicios', 'Gas', 35010.00, 1, false),
      ('Servicios', 'Internet', 101990.00, 21, true),

      ('Suscripciones', 'Rappi', 29900.00, 11, true),
      ('Suscripciones', 'Netflix', 54800.00, 4, true),
      ('Suscripciones', 'Postpago Tigo', 35900.00, 5, true),
      ('Suscripciones', 'Postpago Claro', 39000.00, 7, true),
      ('Suscripciones', 'YouTube Premium', 13300.00, 13, true),
      ('Suscripciones', 'iCloud', 12900.00, 18, true),
      ('Suscripciones', 'Amazon Prime', 25000.00, 1, false),

      ('Impuestos', 'Salud Premium', 53100.00, 1, true),
      ('Constantes', 'Arriendo', 1370000.00, 1, false)
  ) as item(category_name, description, amount, due_day, had_date_in_sheet)
)
insert into public.financial_items (
  user_id,
  category_id,
  description,
  amount,
  due_date,
  frequency,
  status,
  notes,
  is_active
)
select
  seed_categories.user_id,
  seed_categories.id,
  seed_items.description,
  seed_items.amount,
  seed_month.month_start + (seed_items.due_day - 1),
  'monthly',
  'pending',
  case
    when seed_items.had_date_in_sheet then null
    else 'Sin fecha en la hoja original'
  end,
  true
from seed_items
join seed_categories on seed_categories.name = seed_items.category_name
cross join seed_month;

with selected_user as (
  select '8152f6f9-f6f8-4db7-ab0f-b11170b5678d'::uuid as user_id
),
seed_month as (
  select date_trunc('month', current_date)::date as month_start
),
constant_category as (
  select categories.id, categories.user_id
  from public.categories
  join selected_user on selected_user.user_id = categories.user_id
  where categories.name = 'Constantes'
)
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
  constant_category.user_id,
  constant_category.id,
  seed.name,
  seed.allocated_amount,
  0,
  seed_month.month_start,
  'active',
  'Apartado mensual de la hoja original'
from constant_category
cross join seed_month
cross join (
  values
    ('Salidas/Otros', 1500000.00),
    ('Mercado', 600000.00),
    ('Proteína', 175000.00),
    ('Complemento Almuerzo', 300000.00),
    ('Mesada', 1000000.00),
    ('Fondo Imprevistos', 113950.00)
) as seed(name, allocated_amount)
on conflict (user_id, name, month) do update
  set allocated_amount = excluded.allocated_amount,
      category_id = excluded.category_id,
      notes = excluded.notes,
      updated_at = now();

with selected_user as (
  select '8152f6f9-f6f8-4db7-ab0f-b11170b5678d'::uuid as user_id
),
seed_month as (
  select date_trunc('month', current_date)::date as month_start
)
insert into public.income_sources (
  user_id,
  name,
  amount,
  income_type,
  frequency,
  month,
  is_active
)
select
  selected_user.user_id,
  'Contrato GBS',
  7622850.00,
  'current',
  'monthly',
  seed_month.month_start,
  true
from selected_user
cross join seed_month;

with selected_user as (
  select '8152f6f9-f6f8-4db7-ab0f-b11170b5678d'::uuid as user_id
),
seed_month as (
  select date_trunc('month', current_date)::date as month_start
)
insert into public.credit_cards (
  user_id,
  name,
  bank,
  current_amount,
  payment_date,
  status,
  notes
)
select selected_user.user_id, seed.name, seed.bank, seed.current_amount, seed_month.month_start, seed.status, seed.notes
from selected_user
cross join seed_month
cross join (
  values
    ('Rappi Asly', 'Rappi', 1227893.00, 'pending', 'Tarjeta de la hoja original'),
    ('Tarjeta joven', null, 1479586.00, 'pending', 'Tarjeta de la hoja original'),
    ('Rappi David', 'Rappi', 0.00, 'paid', 'Sin valor pendiente en la hoja original')
) as seed(name, bank, current_amount, status, notes);

with selected_user as (
  select '8152f6f9-f6f8-4db7-ab0f-b11170b5678d'::uuid as user_id
),
seed_month as (
  select date_trunc('month', current_date)::date as month_start
)
insert into public.monthly_settings (
  user_id,
  month,
  daily_designated_money,
  notes
)
select
  selected_user.user_id,
  seed_month.month_start,
  0,
  'Ahorro esperado de la hoja: $2.000.000. No se registra como ingreso porque representa saldo sobrante.'
from selected_user
cross join seed_month
on conflict (user_id, month) do update
  set daily_designated_money = excluded.daily_designated_money,
      notes = excluded.notes,
      updated_at = now();

commit;

select 'categories' as table_name, count(*) as rows
from public.categories
where user_id = '8152f6f9-f6f8-4db7-ab0f-b11170b5678d'::uuid
union all
select 'financial_items', count(*)
from public.financial_items
where user_id = '8152f6f9-f6f8-4db7-ab0f-b11170b5678d'::uuid
union all
select 'budget_pockets', count(*)
from public.budget_pockets
where user_id = '8152f6f9-f6f8-4db7-ab0f-b11170b5678d'::uuid
union all
select 'income_sources', count(*)
from public.income_sources
where user_id = '8152f6f9-f6f8-4db7-ab0f-b11170b5678d'::uuid
union all
select 'credit_cards', count(*)
from public.credit_cards
where user_id = '8152f6f9-f6f8-4db7-ab0f-b11170b5678d'::uuid;
