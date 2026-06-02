import { zodResolver } from '@hookform/resolvers/zod';
import { CreditCard as CreditCardIcon, Edit3, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { Field, SelectInput, TextAreaInput, TextInput } from '../../components/ui/Form';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBadge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import { readableDate } from '../../lib/dates';
import { formatCurrency } from '../../lib/formatters';
import { creditCardSchema, type CreditCardFormValues } from '../../lib/validations';
import { useFinance } from '../../hooks/useFinance';
import type { CreditCard } from '../../types';

type CreditCardsPageProps = {
  showHeader?: boolean;
  createRequestId?: number;
};

function CardForm({ card, onSubmit, onCancel }: { card: CreditCard | null; onSubmit: (values: CreditCardFormValues) => Promise<void>; onCancel: () => void }) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CreditCardFormValues>({
    resolver: zodResolver(creditCardSchema),
    defaultValues: { name: '', bank: '', current_amount: 0, payment_date: '', status: 'pending', notes: '' },
  });

  useEffect(() => {
    reset({
      name: card?.name ?? '',
      bank: card?.bank ?? '',
      current_amount: Number(card?.current_amount ?? 0),
      payment_date: card?.payment_date ?? '',
      status: card?.status ?? 'pending',
      notes: card?.notes ?? '',
    });
  }, [card, reset]);

  return (
    <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre" error={errors.name?.message}><TextInput placeholder="Tarjeta principal, compras..." {...register('name')} /></Field>
        <Field label="Banco" error={errors.bank?.message}><TextInput placeholder="Opcional" {...register('bank')} /></Field>
        <Field label="Valor actual" error={errors.current_amount?.message}><TextInput type="number" min="0" step="100" {...register('current_amount')} /></Field>
        <Field label="Fecha de pago" error={errors.payment_date?.message}><TextInput type="date" {...register('payment_date')} /></Field>
        <Field label="Estado" error={errors.status?.message}>
          <SelectInput {...register('status')}>
            <option value="pending">Pendiente</option>
            <option value="paid">Pagado</option>
            <option value="overdue">Vencido</option>
            <option value="inactive">Inactivo</option>
          </SelectInput>
        </Field>
      </div>
      <Field label="Notas" error={errors.notes?.message}><TextAreaInput placeholder="Detalles opcionales" {...register('notes')} /></Field>
      <div className="flex flex-col justify-end gap-3 sm:flex-row">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" isLoading={isSubmitting}>Guardar tarjeta</Button>
      </div>
    </form>
  );
}

export function CreditCardsPage({ showHeader = true, createRequestId = 0 }: CreditCardsPageProps) {
  const finance = useFinance();
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CreditCard | null>(null);
  const [deleting, setDeleting] = useState<CreditCard | null>(null);
  const total = finance.cards.reduce((sum, card) => sum + Number(card.current_amount), 0);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  useEffect(() => {
    if (createRequestId > 0) {
      setEditing(null);
      setModalOpen(true);
    }
  }, [createRequestId]);

  const submit = async (values: CreditCardFormValues) => {
    await finance.saveCreditCard(values, editing?.id);
    toast.success(editing ? 'Tarjeta actualizada' : 'Tarjeta creada');
    setEditing(null);
    setModalOpen(false);
  };

  const remove = async () => {
    if (!deleting) return;
    await finance.deleteCreditCard(deleting.id);
    toast.success('Tarjeta eliminada');
    setDeleting(null);
  };

  return (
    <div className="grid gap-6">
      {showHeader && (
        <PageHeader
          title="Tarjetas de crédito"
          description="Registra tarjetas y obligaciones con fecha de pago para monitorear tu deuda mensual."
          action={<Button className="w-full sm:w-auto" icon={<Plus className="h-4 w-4" />} onClick={openCreate}>Agregar tarjeta</Button>}
        />
      )}

      {finance.cards.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {finance.cards.map((card) => (
            <Card key={card.id} className="p-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-textPrimary">{card.name}</p>
                  <p className="text-sm text-textMuted">{card.bank || 'Sin banco'} · {readableDate(card.payment_date)}</p>
                </div>
                <StatusBadge status={card.status} />
              </div>
              <p className="mt-4 text-3xl font-bold text-textPrimary">{formatCurrency(card.current_amount)}</p>
              <p className="mt-1 text-sm text-textMuted">Total de tarjetas: {formatCurrency(total)}</p>
              {card.notes && <p className="mt-2 text-sm text-textMuted">{card.notes}</p>}
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <Button variant="secondary" onClick={() => { setEditing(card); setModalOpen(true); }} icon={<Edit3 className="h-4 w-4" />}>Editar</Button>
                <Button variant="danger" onClick={() => setDeleting(card)} icon={<Trash2 className="h-4 w-4" />}>Eliminar</Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<CreditCardIcon className="h-5 w-5" />}
          title="Aún no tienes tarjetas registradas"
          description="Agrega una tarjeta de crédito para ver su saldo y fecha de pago en tu calendario financiero."
          action={<Button onClick={openCreate}>Agregar primera tarjeta</Button>}
        />
      )}

      <Modal open={modalOpen} title={editing ? 'Editar tarjeta' : 'Agregar tarjeta'} onClose={() => setModalOpen(false)}>
        <CardForm card={editing} onSubmit={submit} onCancel={() => setModalOpen(false)} />
      </Modal>
      <ConfirmDialog open={Boolean(deleting)} title="Eliminar tarjeta" description="Se eliminará este producto de crédito." onConfirm={() => void remove()} onClose={() => setDeleting(null)} />
    </div>
  );
}
