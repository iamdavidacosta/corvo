import { z } from 'zod';

const amountSchema = z.coerce.number({ invalid_type_error: 'Ingresa un valor válido' }).min(0, 'El valor no puede ser negativo');

export const authSchema = z.object({
  email: z.string().email('Ingresa un email válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const financialItemSchema = z.object({
  description: z.string().min(2, 'La descripción es obligatoria'),
  category_id: z.string().min(1, 'Selecciona una categoría'),
  amount: amountSchema.min(1, 'El valor debe ser mayor a cero'),
  due_date: z.string().min(1, 'Selecciona una fecha'),
  frequency: z.enum(['one_time', 'monthly', 'yearly']),
  status: z.enum(['pending', 'paid', 'overdue', 'inactive']).default('pending'),
  notes: z.string().optional(),
  is_active: z.boolean().default(true),
});

export const incomeSchema = z.object({
  name: z.string().min(2, 'El nombre es obligatorio'),
  amount: amountSchema.min(1, 'El valor debe ser mayor a cero'),
  income_type: z.enum(['current', 'expected']),
  frequency: z.enum(['monthly', 'one_time']),
  month: z.string().optional(),
  is_active: z.boolean().default(true),
});

export const budgetPocketSchema = z.object({
  name: z.string().min(2, 'El nombre es obligatorio'),
  category_id: z.string().optional(),
  allocated_amount: amountSchema.min(1, 'El valor asignado debe ser mayor a cero'),
  spent_amount: amountSchema.default(0),
  month: z.string().optional(),
  status: z.enum(['active', 'paused', 'closed']).default('active'),
  notes: z.string().optional(),
});

export const creditCardSchema = z.object({
  name: z.string().min(2, 'El nombre de la tarjeta es obligatorio'),
  bank: z.string().optional(),
  current_amount: amountSchema,
  payment_date: z.string().optional(),
  status: z.enum(['pending', 'paid', 'overdue', 'inactive']),
  notes: z.string().optional(),
});

export const profileSchema = z.object({
  full_name: z.string().optional(),
  currency: z.string().default('COP'),
  notification_days_before: z.coerce.number().int().min(1).max(15),
  preferred_notification_time: z.string().min(1),
  notifications_enabled: z.boolean().default(true),
  salary_cycle_day: z.coerce.number().int().min(1).max(31).default(1),
  salary_adjusts_to_business_day: z.boolean().default(true),
});

export const monthlySettingSchema = z.object({
  daily_designated_money: amountSchema,
  notes: z.string().optional(),
});

export const categorySchema = z.object({
  name: z.string().min(2, 'El nombre es obligatorio'),
  type: z.string().min(2, 'El tipo es obligatorio'),
  color: z.string().optional(),
  icon: z.string().optional(),
});

export type FinancialItemFormValues = z.infer<typeof financialItemSchema>;
export type IncomeFormValues = z.infer<typeof incomeSchema>;
export type BudgetPocketFormValues = z.infer<typeof budgetPocketSchema>;
export type CreditCardFormValues = z.infer<typeof creditCardSchema>;
export type ProfileFormValues = z.infer<typeof profileSchema>;
export type MonthlySettingFormValues = z.infer<typeof monthlySettingSchema>;
export type CategoryFormValues = z.infer<typeof categorySchema>;




