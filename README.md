# Corvo

Corvo es una PWA financiera personal para gestionar cuentas, deudas, ingresos, tarjetas de crédito, pagos realizados y recordatorios push 3 días antes del vencimiento. Está construida con React, TypeScript, Vite, TailwindCSS, Supabase y Vercel Functions.

## Stack

- React + TypeScript + Vite
- TailwindCSS
- React Router
- React Hook Form + Zod
- Lucide React
- Recharts
- date-fns
- Supabase Auth, PostgreSQL y Row Level Security
- Vercel Serverless Functions + Vercel Cron
- Web Push Notifications + Service Worker

## Instalación local

```bash
npm install
cp .env.example .env
npm run dev
```

Configura `.env` con las credenciales de Supabase y VAPID:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_VAPID_PUBLIC_KEY=
SUPABASE_SERVICE_ROLE_KEY=
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@corvo.app
CRON_SECRET=
```

Nunca expongas `SUPABASE_SERVICE_ROLE_KEY` ni `VAPID_PRIVATE_KEY` en el frontend. En Vercel deben quedar como variables de entorno privadas.

## Supabase

1. Crea un proyecto en Supabase.
2. Copia `Project URL` en `VITE_SUPABASE_URL`.
3. Copia `anon public` en `VITE_SUPABASE_ANON_KEY`.
4. Copia `service_role` en `SUPABASE_SERVICE_ROLE_KEY` solo para Vercel Functions.
5. Ejecuta la migración SQL de `supabase/migrations/202605260001_initial_schema.sql` desde SQL Editor o Supabase CLI.

La migración crea:

- `profiles`
- `categories`
- `financial_items`
- `income_sources`
- `credit_cards`
- `payments`
- `monthly_settings`
- `push_subscriptions`
- `notification_logs`
- RLS por usuario en todas las tablas
- Trigger automático para crear `profiles` al registrar usuarios

El archivo `supabase/seed.sql` es opcional. También puedes cargar los datos demo desde la app en `Configuración`.

## Web Push

Genera llaves VAPID:

```bash
npx web-push generate-vapid-keys
```

Usa la llave pública en:

```bash
VITE_VAPID_PUBLIC_KEY=
VAPID_PUBLIC_KEY=
```

Usa la llave privada solo en:

```bash
VAPID_PRIVATE_KEY=
```

La app registra `/sw.js`, solicita permiso desde `Centro de notificaciones`, guarda la suscripción en Supabase y usa `/api/send-due-reminders` para enviar recordatorios.

## Vercel

1. Importa el repositorio en Vercel.
2. Agrega todas las variables de entorno.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. `vercel.json` ejecuta el cron diario:

```json
{
  "path": "/api/send-due-reminders",
  "schedule": "0 13 * * *"
}
```

La hora `13:00 UTC` corresponde a una ejecución matutina razonable para Colombia.

## Funcionalidades

- Registro, login y recuperación de contraseña con Supabase Auth.
- Dashboard con ingresos, deudas, pagado, pendiente, saldos y gráficas.
- CRUD de cuentas/deudas por categoría.
- Vistas filtradas: servicios, suscripciones, préstamos, impuestos y gastos constantes.
- CRUD de ingresos.
- CRUD de tarjetas de crédito.
- Historial de pagos y reversión.
- Calendario mensual por fecha.
- Centro de notificaciones push con fallback interno.
- Configuración de moneda COP, días de anticipación, hora preferida, recordatorios y dinero designado.
- Exportación CSV.
- Datos demo basados en el Excel descrito.

## Comandos

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## Verificación

```bash
npm run build
npm audit --omit=dev
```

Ambos deben terminar correctamente antes de desplegar.
