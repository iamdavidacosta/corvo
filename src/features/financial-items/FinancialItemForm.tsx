import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../../components/ui/Button';
import { CurrencyInput } from '../../components/forms/CurrencyInput';
import { Field, SelectInput, TextAreaInput, TextInput } from '../../components/ui/Form';
import { financialItemSchema, type FinancialItemFormValues } from '../../lib/validations';
import type { Category, FinancialItem } from '../../types';
import { todayISO } from '../../lib/dates';

type FinancialItemFormProps = {
  categories: Category[];
  item?: FinancialItem | null;
  initialCategoryId?: string;
  onSubmit: (values: FinancialItemFormValues) => Promise<void>;
  onCancel: () => void;
};

export function FinancialItemForm({ categories, item, initialCategoryId, onSubmit, onCancel }: FinancialItemFormProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FinancialItemFormValues>({
    resolver: zodResolver(financialItemSchema),
    defaultValues: {
      description: '',
      category_id: initialCategoryId ?? categories[0]?.id ?? '',
      amount: 0,
      due_date: todayISO(),
      frequency: 'monthly',
      status: 'pending',
      notes: '',
      is_active: true,
    },
  });

  useEffect(() => {
    reset({
      description: item?.description ?? '',
      category_id: item?.category_id ?? initialCategoryId ?? categories[0]?.id ?? '',
      amount: Number(item?.amount ?? 0),
      due_date: item?.due_date ?? todayISO(),
      frequency: item?.frequency ?? 'monthly',
      status: item?.status ?? 'pending',
      notes: item?.notes ?? '',
      is_active: item?.is_active ?? true,
    });
  }, [categories, initialCategoryId, item, reset]);

  return (
    <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Descripción" error={errors.description?.message}>
          <TextInput placeholder="Netflix, arriendo, préstamo..." {...register('description')} />
        </Field>
        <Field label="Categoría" error={errors.category_id?.message}>
          <SelectInput {...register('category_id')}>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Valor COP" error={errors.amount?.message}>
          <CurrencyInput control={control} name="amount" />
        </Field>
        <Field label="Fecha de pago" error={errors.due_date?.message}>
          <TextInput type="date" {...register('due_date')} />
        </Field>
        <Field label="Frecuencia" error={errors.frequency?.message}>
          <SelectInput {...register('frequency')}>
            <option value="one_time">Única</option>
            <option value="monthly">Mensual</option>
            <option value="yearly">Anual</option>
          </SelectInput>
        </Field>
        <Field label="Estado" error={errors.status?.message}>
          <SelectInput {...register('status')}>
            <option value="pending">Pendiente</option>
            <option value="paid">Pagado</option>
            <option value="overdue">Vencido</option>
            <option value="inactive">Inactivo</option>
          </SelectInput>
        </Field>
      </div>
      <Field label="Notas" error={errors.notes?.message}>
        <TextAreaInput placeholder="Detalles opcionales" {...register('notes')} />
      </Field>
      <label className="flex items-center gap-3 text-sm text-textMuted">
        <input className="h-4 w-4 accent-accent" type="checkbox" {...register('is_active')} />
        Activo
      </label>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Guardar
        </Button>
      </div>
    </form>
  );
}

