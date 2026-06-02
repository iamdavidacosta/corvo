-- Seeder CORVO basado en la hoja compartida.
--
-- Uso:
-- 1. Reemplaza USER_UUID por el id del usuario en auth.users.
-- 2. Ejecuta este archivo desde Supabase SQL Editor o con `supabase db reset`.
--
-- Nota tecnica:
-- financial_items.due_date es obligatorio. Las filas de la hoja sin fecha
-- o con "-" usan la fecha base 2025-05-01 y quedan marcadas en notes.

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
all_categories as (
  select id, user_id, name
  from seed_categories
),
seed_items as (
  select *
  from (
    values
      ('Servicios', 'Luz', 120000.00, null::date),
      ('Servicios', 'Acueducto y Aseo', 43000.00, null::date),
      ('Servicios', 'Gas', 35010.00, null::date),
      ('Servicios', 'Internet', 101990.00, '2025-05-21'::date),

      ('Suscripciones', 'Rappi', 29900.00, '2025-08-11'::date),
      ('Suscripciones', 'Netflix', 54800.00, '2025-05-04'::date),
      ('Suscripciones', 'Postpago Tigo', 35900.00, '2025-05-05'::date),
      ('Suscripciones', 'Postpago Claro', 39000.00, '2025-05-07'::date),
      ('Suscripciones', 'YouTube Premium', 13300.00, '2025-08-13'::date),
      ('Suscripciones', 'iCloud', 12900.00, '2025-08-18'::date),
      ('Suscripciones', 'Amazon Prime', 25000.00, null::date),

      ('Impuestos', 'Salud Premium', 53100.00, '2025-05-01'::date),

      ('Constantes', 'Arriendo', 1370000.00, null::date),
      ('Constantes', 'Salidas/Otros', 1500000.00, null::date),
      ('Constantes', 'Mercado', 600000.00, null::date),
      ('Constantes', 'Proteína', 175000.00, null::date),
      ('Constantes', 'Complemento Almuerzo', 300000.00, null::date),
      ('Constantes', 'Mesada', 1000000.00, null::date),
      ('Constantes', 'Fondo Imprevistos', 113950.00, null::date)
  ) as item(category_name, description, amount, sheet_due_date)
),
deleted_items as (
  delete from public.financial_items
  using selected_user
  where financial_items.user_id = selected_user.user_id
    and financial_items.description in (select description from seed_items)
  returning financial_items.id
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
  all_categories.user_id,
  all_categories.id,
  seed_items.description,
  seed_items.amount,
  coalesce(seed_items.sheet_due_date, '2025-05-01'::date) as due_date,
  'monthly',
  'pending',
  case
    when seed_items.sheet_due_date is null then 'Sin fecha en la hoja original'
    else null
  end,
  true
from seed_items
join all_categories on all_categories.name = seed_items.category_name;

with selected_user as (
  select 'USER_UUID'::uuid as user_id
),
deleted_incomes as (
  delete from public.income_sources
  using selected_user
  where income_sources.user_id = selected_user.user_id
    and income_sources.name in ('Contrato GBS', 'Ahorro')
  returning income_sources.id
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
select selected_user.user_id, seed.name, seed.amount, seed.income_type, 'monthly', '2025-05-01'::date, true
from selected_user
cross join (
  values
    ('Contrato GBS', 7622850.00, 'current'),
    ('Ahorro', 2000000.00, 'expected')
) as seed(name, amount, income_type);

with selected_user as (
  select 'USER_UUID'::uuid as user_id
),
deleted_cards as (
  delete from public.credit_cards
  using selected_user
  where credit_cards.user_id = selected_user.user_id
    and credit_cards.name in ('Rappi Asly', 'Tarjeta joven', 'Rappi David')
  returning credit_cards.id
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
select selected_user.user_id, seed.name, seed.bank, seed.current_amount, seed.payment_date, seed.status, seed.notes
from selected_user
cross join (
  values
    ('Rappi Asly', 'Rappi', 1227893.00, null::date, 'pending', 'Sin fecha de pago en la hoja original'),
    ('Tarjeta joven', null, 1479586.00, null::date, 'pending', 'Sin fecha de pago en la hoja original'),
    ('Rappi David', 'Rappi', 0.00, null::date, 'paid', 'Sin valor pendiente en la hoja original')
) as seed(name, bank, current_amount, payment_date, status, notes);

with selected_user as (
  select 'USER_UUID'::uuid as user_id
)
insert into public.monthly_settings (
  user_id,
  month,
  daily_designated_money,
  notes
)
select
  selected_user.user_id,
  '2025-05-01'::date,
  0,
  'Seeder hoja CORVO'
from selected_user
on conflict (user_id, month) do update
  set daily_designated_money = excluded.daily_designated_money,
      notes = excluded.notes,
      updated_at = now();

commit;
