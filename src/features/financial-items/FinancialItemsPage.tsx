import { Check, Edit3, FolderPlus, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { SelectInput, TextInput } from '../../components/ui/Form';
import { StatusBadge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import { daysUntil, readableDate, statusFromDueDate } from '../../lib/dates';
import { formatCurrency } from '../../lib/formatters';
import { useFinance } from '../../hooks/useFinance';
import type { FinancialItem, ItemStatus } from '../../types';
import { FinancialItemForm } from './FinancialItemForm';
import type { FinancialItemFormValues } from '../../lib/validations';

type FinancialItemsPageProps = {
  title?: string;
  categoryName?: string;
  description?: string;
  primaryActionLabel?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  noCategoriesDescription?: string;
  showHeader?: boolean;
  createRequestId?: number;
};

export function FinancialItemsPage({
  title = 'Pagos fijos',
  categoryName,
  description = 'Registra servicios, suscripciones, impuestos y pagos recurrentes del mes.',
  primaryActionLabel = 'Agregar pago fijo',
  emptyTitle = 'Aún no tienes pagos registrados',
  emptyDescription = 'Agrega servicios, suscripciones o impuestos para verlos en tu calendario mensual.',
  emptyActionLabel = 'Agregar primer pago',
  noCategoriesDescription = 'Corvo necesita categorías para organizar tus pagos, deudas y gráficas.',
  showHeader = true,
  createRequestId = 0,
}: FinancialItemsPageProps) {
  const finance = useFinance();
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FinancialItem | null>(null);
  const [deleting, setDeleting] = useState<FinancialItem | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState(categoryName ?? 'all');
  const hasCategories = finance.categories.length > 0;

  const filtered = useMemo(() => {
    return finance.items.filter((item) => {
      const categoryLabel = item.categories?.name ?? '';
      const visualStatus = statusFromDueDate(item.status, item.due_date);
      return (
        (!categoryName || categoryLabel === categoryName) &&
        (category === 'all' || categoryLabel === category) &&
        (status === 'all' || visualStatus === status) &&
        item.description.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [category, categoryName, finance.items, search, status]);

  const openCreate = () => {
    if (!hasCategories) return;
    setEditing(null);
    setModalOpen(true);
  };

  useEffect(() => {
    if (createRequestId > 0 && hasCategories) {
      setEditing(null);
      setModalOpen(true);
    }
  }, [createRequestId, hasCategories]);

  const submit = async (values: FinancialItemFormValues) => {
    await finance.saveFinancialItem(values, editing?.id);
    toast.success(editing ? 'Pago actualizado' : 'Pago creado');
    setModalOpen(false);
    setEditing(null);
  };

  const createCategories = async () => {
    await finance.createDefaultCategories();
    toast.success('Categorías recomendadas creadas');
  };

  const markPaid = async (item: FinancialItem) => {
    await finance.markFinancialItemPaid(item);
    toast.success('Pago registrado en historial');
  };

  const remove = async () => {
    if (!deleting) return;
    await finance.deleteFinancialItem(deleting.id);
    toast.success('Pago eliminado');
    setDeleting(null);
  };

  const openEdit = (item: FinancialItem) => {
    setEditing(item);
    setModalOpen(true);
  };

  return (
    <div className="grid gap-6">
      {showHeader && (
        <PageHeader
          title={title}
          description={description}
          action={
            hasCategories ? (
              <Button className="w-full sm:w-auto" icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
                {primaryActionLabel}
              </Button>
            ) : undefined
          }
        />
      )}

      {!hasCategories ? (
        <EmptyState
          icon={<FolderPlus className="h-5 w-5" />}
          title="Primero crea tus categorías"
          description={noCategoriesDescription}
          action={<Button onClick={() => void createCategories()}>Crear categorías recomendadas</Button>}
        />
      ) : (
        <>
          <Card>
            <div className="grid gap-3 md:grid-cols-[1fr_180px_200px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-textMuted" />
                <TextInput className="nexo-input pl-11" placeholder="Buscar por descripción" value={search} onChange={(event) => setSearch(event.target.value)} />
              </div>
              <SelectInput value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="all">Todos los estados</option>
                <option value="pending">Pendientes</option>
                <option value="overdue">Vencidos</option>
                <option value="inactive">Inactivos</option>
              </SelectInput>
              <SelectInput value={category} onChange={(event) => setCategory(event.target.value)} disabled={Boolean(categoryName)}>
                <option value="all">Todas las categorías</option>
                {finance.categories.map((itemCategory) => (
                  <option key={itemCategory.id} value={itemCategory.name}>
                    {itemCategory.name}
                  </option>
                ))}
              </SelectInput>
            </div>
          </Card>

          {filtered.length ? (
            <Card>
              <div className="hidden overflow-x-auto md:block">
                <table className="nexo-table">
                  <thead>
                    <tr>
                      <th>Descripción</th>
                      <th>Categoría</th>
                      <th>Valor</th>
                      <th>Fecha</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((item) => {
                      const visualStatus = statusFromDueDate(item.status, item.due_date) as ItemStatus;
                      const soon = visualStatus === 'pending' && daysUntil(item.due_date) <= 3 && daysUntil(item.due_date) >= 0;
                      return (
                        <tr key={item.id}>
                          <td>
                            <div className="font-medium">{item.description}</div>
                            <div className="text-xs text-textMuted">{item.frequency}</div>
                          </td>
                          <td>{item.categories?.name ?? 'Sin categoría'}</td>
                          <td>{formatCurrency(item.amount)}</td>
                          <td>{readableDate(item.due_date)}</td>
                          <td><StatusBadge status={soon ? 'soon' : visualStatus} /></td>
                          <td>
                            <div className="flex gap-2">
                              <Button className="h-9 w-9 p-0" variant="secondary" onClick={() => void markPaid(item)} aria-label="Marcar como pagado">
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button className="h-9 w-9 p-0" variant="ghost" onClick={() => openEdit(item)} aria-label="Editar pago">
                                <Edit3 className="h-4 w-4" />
                              </Button>
                              <Button className="h-9 w-9 p-0" variant="danger" onClick={() => setDeleting(item)} aria-label="Eliminar pago">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="grid gap-3 md:hidden">
                {filtered.map((item) => {
                  const visualStatus = statusFromDueDate(item.status, item.due_date) as ItemStatus;
                  const soon = visualStatus === 'pending' && daysUntil(item.due_date) <= 3 && daysUntil(item.due_date) >= 0;
                  return (
                    <div key={item.id} className="rounded-lg border border-border bg-background/55 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-textPrimary">{item.description}</p>
                          <p className="text-sm text-textMuted">{item.categories?.name ?? 'Sin categoría'} · {readableDate(item.due_date)}</p>
                        </div>
                        <StatusBadge status={soon ? 'soon' : visualStatus} />
                      </div>
                      <p className="mt-3 text-xl font-bold text-textPrimary">{formatCurrency(item.amount)}</p>
                      <div className="mt-4 grid grid-cols-3 gap-2">
                        <Button variant="secondary" onClick={() => void markPaid(item)} aria-label="Marcar como pagado"><Check className="h-4 w-4" /></Button>
                        <Button variant="ghost" onClick={() => openEdit(item)} aria-label="Editar pago"><Edit3 className="h-4 w-4" /></Button>
                        <Button variant="danger" onClick={() => setDeleting(item)} aria-label="Eliminar pago"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ) : (
            <EmptyState title={emptyTitle} description={emptyDescription} action={<Button onClick={openCreate}>{emptyActionLabel}</Button>} />
          )}
        </>
      )}

      <Modal open={modalOpen} title={editing ? 'Editar pago' : primaryActionLabel} onClose={() => setModalOpen(false)}>
        <FinancialItemForm categories={finance.categories} item={editing} onSubmit={submit} onCancel={() => setModalOpen(false)} />
      </Modal>
      <ConfirmDialog open={Boolean(deleting)} title="Eliminar pago" description="Esta acción elimina el pago seleccionado. El historial de pagos existente no se borra." onConfirm={() => void remove()} onClose={() => setDeleting(null)} />
    </div>
  );
}
