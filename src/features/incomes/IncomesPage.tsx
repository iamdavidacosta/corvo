import { zodResolver } from '@hookform/resolvers/zod';
import { Edit3, Plus, Trash2, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { Field, SelectInput, TextInput } from '../../components/ui/Form';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { useToast } from '../../components/ui/Toast';
import { formatCurrency } from '../../lib/formatters';
import { incomeSchema, type IncomeFormValues } from '../../lib/validations';
import { useFinance } from '../../hooks/useFinance';
import type { IncomeSource } from '../../types';

function IncomeForm({ income, onSubmit, onCancel }: { income: IncomeSource | null; onSubmit: (values: IncomeFormValues) => Promise<void>; onCancel: () => void }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeSchema),
    defaultValues: { name: '', amount: 0, income_type: 'current', frequency: 'monthly', month: '', is_active: true },
  });

  useEffect(() => {
    reset({
      name: income?.name ?? '',
      amount: Number(income?.amount ?? 0),
      income_type: income?.income_type ?? 'current',
      frequency: income?.frequency ?? 'monthly',
      month: income?.month ?? '',
      is_active: income?.is_active ?? true,
    });
  }, [income, reset]);

  return (
    <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Fuente" error={errors.name?.message}>
          <TextInput placeholder="Salario, extra, bono..." {...register('name')} />
        </Field>
        <Field label="Valor COP" error={errors.amount?.message}>
          <TextInput type="number" min="0" step="100" {...register('amount')} />
        </Field>
        <Field label="Tipo" error={errors.income_type?.message}>
          <SelectInput {...register('income_type')}>
            <option value="current">Actual</option>
            <option value="expected">Esperado</option>
          </SelectInput>
        </Field>
        <Field label="Frecuencia" error={errors.frequency?.message}>
          <SelectInput {...register('frequency')}>
            <option value="monthly">Mensual</option>
            <option value="one_time">Único</option>
          </SelectInput>
        </Field>
        <Field label="Mes asociado" error={errors.month?.message}>
          <TextInput type="date" {...register('month')} />
        </Field>
      </div>
      <label className="flex items-center gap-3 text-sm text-textSecondary">
        <input className="h-4 w-4 accent-accent" type="checkbox" {...register('is_active')} />
        Activo
      </label>
      <div className="flex flex-col justify-end gap-3 sm:flex-row">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" isLoading={isSubmitting}>Guardar ingreso</Button>
      </div>
    </form>
  );
}

export function IncomesPage() {
  const finance = useFinance();
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<IncomeSource | null>(null);
  const [deleting, setDeleting] = useState<IncomeSource | null>(null);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const submit = async (values: IncomeFormValues) => {
    await finance.saveIncome(values, editing?.id);
    toast.success(editing ? 'Ingreso actualizado' : 'Ingreso creado');
    setEditing(null);
    setModalOpen(false);
  };

  const remove = async () => {
    if (!deleting) return;
    await finance.deleteIncome(deleting.id);
    toast.success('Ingreso eliminado');
    setDeleting(null);
  };

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Ingresos"
        description="Registra tu salario, ingresos extra o entradas mensuales para calcular tu saldo disponible."
        action={finance.incomes.length ? <Button className="w-full sm:w-auto" icon={<Plus className="h-4 w-4" />} onClick={openCreate}>Agregar ingreso</Button> : undefined}
      />

      {finance.incomes.length ? (
        <Card>
          <div className="grid gap-3">
            {finance.incomes.map((income) => (
              <div key={income.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background/55 p-4">
                <div>
                  <p className="font-semibold text-textPrimary">{income.name}</p>
                  <p className="text-sm text-textMuted">{income.income_type === 'current' ? 'Actual' : 'Esperado'} · {income.frequency === 'monthly' ? 'Mensual' : 'Único'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-xl font-bold text-textPrimary">{formatCurrency(income.amount)}</p>
                  <Button className="h-9 w-9 p-0" variant="ghost" onClick={() => { setEditing(income); setModalOpen(true); }} aria-label="Editar ingreso">
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button className="h-9 w-9 p-0" variant="danger" onClick={() => setDeleting(income)} aria-label="Eliminar ingreso">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <EmptyState
          icon={<Wallet className="h-5 w-5" />}
          title="Aún no tienes ingresos registrados"
          description="Agrega tu salario, ingreso mensual o entrada adicional para calcular tu saldo disponible."
          action={<Button onClick={openCreate}>Agregar mi primer ingreso</Button>}
        />
      )}

      <Modal open={modalOpen} title={editing ? 'Editar ingreso' : 'Agregar ingreso'} onClose={() => setModalOpen(false)}>
        <IncomeForm income={editing} onSubmit={submit} onCancel={() => setModalOpen(false)} />
      </Modal>
      <ConfirmDialog open={Boolean(deleting)} title="Eliminar ingreso" description="Se eliminará esta fuente de ingreso." onConfirm={() => void remove()} onClose={() => setDeleting(null)} />
    </div>
  );
}
