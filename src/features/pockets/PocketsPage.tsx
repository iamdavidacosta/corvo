import { zodResolver } from '@hookform/resolvers/zod';
import { FolderPlus, Plus, Trash2, Wallet } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { CurrencyInput } from '../../components/forms/CurrencyInput';
import { Field, TextAreaInput, TextInput } from '../../components/ui/Form';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { useToast } from '../../components/ui/Toast';
import { getPocketAllocatedTotal } from '../../lib/calculations';
import { formatCurrency } from '../../lib/formatters';
import { budgetPocketSchema, type BudgetPocketFormValues } from '../../lib/validations';
import { useFinance } from '../../hooks/useFinance';
import type { BudgetPocket } from '../../types';

function PocketForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (values: BudgetPocketFormValues) => Promise<void>;
  onCancel: () => void;
}) {
  const finance = useFinance();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BudgetPocketFormValues>({
    resolver: zodResolver(budgetPocketSchema),
    defaultValues: {
      name: '',
      category_id: '',
      allocated_amount: 0,
      spent_amount: 0,
      month: finance.periodStart,
      status: 'active',
      notes: '',
    },
  });

  useEffect(() => {
    reset({
      name: '',
      category_id: '',
      allocated_amount: 0,
      spent_amount: 0,
      month: finance.periodStart,
      status: 'active',
      notes: '',
    });
  }, [finance.periodStart, reset]);

  return (
    <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Bolsillo" error={errors.name?.message}>
          <TextInput placeholder="Mercado, mesada, salidas..." {...register('name')} />
        </Field>
        <Field label="Asignado este mes" error={errors.allocated_amount?.message}>
          <CurrencyInput control={control} name="allocated_amount" />
        </Field>
      </div>

      <Field label="Notas" error={errors.notes?.message}>
        <TextAreaInput placeholder="Ej: dinero separado del saldo libre del mes." {...register('notes')} />
      </Field>

      <div className="flex flex-col justify-end gap-3 sm:flex-row">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" isLoading={isSubmitting}>Guardar bolsillo</Button>
      </div>
    </form>
  );
}

function PocketCard({ pocket, onDelete }: { pocket: BudgetPocket; onDelete: (pocket: BudgetPocket) => void }) {
  const allocated = Number(pocket.allocated_amount);

  return (
    <article className="nexo-card flex min-h-[172px] flex-col justify-between p-5">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-textPrimary">{pocket.name}</h2>
            <p className="mt-1 text-sm text-textMuted">Apartado mensual</p>
          </div>
          <Wallet className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
        </div>

        <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-textMuted">Apartado del saldo libre</p>
        <p className="mt-1 text-2xl font-bold text-textPrimary">{formatCurrency(allocated)}</p>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <Button className="h-12 w-12 p-0" variant="danger" onClick={() => onDelete(pocket)} aria-label={`Eliminar ${pocket.name}`} title="Eliminar">
          <Trash2 className="h-6 w-6" />
        </Button>
      </div>
    </article>
  );
}

export function PocketsPage() {
  const finance = useFinance();
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<BudgetPocket | null>(null);

  const totals = useMemo(() => {
    return {
      allocated: getPocketAllocatedTotal(finance.pockets),
      count: finance.pockets.length,
    };
  }, [finance.pockets]);

  const openCreate = () => {
    setModalOpen(true);
  };

  const submit = async (values: BudgetPocketFormValues) => {
    await finance.saveBudgetPocket({ ...values, spent_amount: 0, status: 'active' });
    toast.success('Bolsillo creado');
    setModalOpen(false);
  };

  const remove = async () => {
    if (!deleting) return;
    await finance.deleteBudgetPocket(deleting.id);
    toast.success('Bolsillo eliminado');
    setDeleting(null);
  };

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Bolsillos"
        description="Aparta dinero del mes para mercado, mesada, salidas o fondos. CORVO lo descuenta del saldo libre."
        action={<Button className="w-full sm:w-auto" icon={<Plus className="h-4 w-4" />} onClick={openCreate}>Agregar bolsillo</Button>}
      />

      <section className="grid gap-4 md:grid-cols-2">
        <div className="nexo-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-textMuted">Apartado del mes</p>
          <p className="mt-2 text-xl font-bold text-textPrimary">{formatCurrency(totals.allocated)}</p>
        </div>
        <div className="nexo-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-textMuted">Bolsillos del mes</p>
          <p className="mt-2 text-xl font-bold text-textPrimary">{totals.count}</p>
        </div>
      </section>

      {finance.pockets.length ? (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {finance.pockets.map((pocket) => (
            <PocketCard
              key={pocket.id}
              pocket={pocket}
              onDelete={setDeleting}
            />
          ))}
        </section>
      ) : (
        <EmptyState
          icon={<FolderPlus className="h-5 w-5" />}
          title="Aún no tienes bolsillos"
          description="Crea apartados para dinero que reservas, pero que no es una cuenta con fecha de pago."
          action={<Button icon={<Wallet className="h-4 w-4" />} onClick={openCreate}>Crear primer bolsillo</Button>}
        />
      )}

      <Modal open={modalOpen} title="Agregar bolsillo" onClose={() => setModalOpen(false)}>
        <PocketForm onSubmit={submit} onCancel={() => setModalOpen(false)} />
      </Modal>
      <ConfirmDialog open={Boolean(deleting)} title="Eliminar bolsillo" description="Se eliminará este apartado del mes. No afecta pagos fijos ni calendario." onConfirm={() => void remove()} onClose={() => setDeleting(null)} />
    </div>
  );
}


