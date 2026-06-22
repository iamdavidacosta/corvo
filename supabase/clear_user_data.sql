-- CORVO - Borrar data de un usuario sin eliminar su cuenta.
--
-- Uso:
-- 1. Reemplaza 8152f6f9-f6f8-4db7-ab0f-b11170b5678d por el id real del usuario en auth.users.
-- 2. Ejecuta todo este archivo en Supabase SQL Editor.
--
-- Esto borra:
-- - categorias
-- - pagos fijos/deudas
-- - bolsillos/apartados
-- - ingresos
-- - tarjetas
-- - pagos registrados
-- - configuracion mensual
-- - logs/suscripciones push
--
-- No borra:
-- - auth.users
-- - profiles

begin;

with selected_user as (
  select '8152f6f9-f6f8-4db7-ab0f-b11170b5678d'::uuid as user_id
)
delete from public.notification_logs
using selected_user
where notification_logs.user_id = selected_user.user_id;

with selected_user as (
  select '8152f6f9-f6f8-4db7-ab0f-b11170b5678d'::uuid as user_id
)
delete from public.push_subscriptions
using selected_user
where push_subscriptions.user_id = selected_user.user_id;

with selected_user as (
  select '8152f6f9-f6f8-4db7-ab0f-b11170b5678d'::uuid as user_id
)
delete from public.payments
using selected_user
where payments.user_id = selected_user.user_id;

with selected_user as (
  select '8152f6f9-f6f8-4db7-ab0f-b11170b5678d'::uuid as user_id
)
delete from public.financial_items
using selected_user
where financial_items.user_id = selected_user.user_id;

with selected_user as (
  select '8152f6f9-f6f8-4db7-ab0f-b11170b5678d'::uuid as user_id
)
delete from public.budget_pockets
using selected_user
where budget_pockets.user_id = selected_user.user_id;

with selected_user as (
  select '8152f6f9-f6f8-4db7-ab0f-b11170b5678d'::uuid as user_id
)
delete from public.income_sources
using selected_user
where income_sources.user_id = selected_user.user_id;

with selected_user as (
  select '8152f6f9-f6f8-4db7-ab0f-b11170b5678d'::uuid as user_id
)
delete from public.credit_cards
using selected_user
where credit_cards.user_id = selected_user.user_id;

with selected_user as (
  select '8152f6f9-f6f8-4db7-ab0f-b11170b5678d'::uuid as user_id
)
delete from public.monthly_settings
using selected_user
where monthly_settings.user_id = selected_user.user_id;

with selected_user as (
  select '8152f6f9-f6f8-4db7-ab0f-b11170b5678d'::uuid as user_id
)
delete from public.categories
using selected_user
where categories.user_id = selected_user.user_id;

commit;

select 'Data borrada para 8152f6f9-f6f8-4db7-ab0f-b11170b5678d' as result;
