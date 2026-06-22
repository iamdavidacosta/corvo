import { Edit3, Eye, FolderPlus, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { Field, TextInput } from '../../components/ui/Form';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBadge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import { daysUntil, readableDate, statusFromDueDate } from '../../lib/dates';
import { formatCurrency } from '../../lib/formatters';
import { useFinance } from '../../hooks/useFinance';
import type { Category, FinancialItem, ItemStatus } from '../../types';
import { FinancialItemForm } from './FinancialItemForm';
import type { FinancialItemFormValues } from '../../lib/validations';

type VisualStatus = ItemStatus | 'soon';

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

type CategoryGroup = {
  categoryId: string | null;
  name: string;
  total: number;
  items: FinancialItem[];
  counts: Record<VisualStatus, number>;
  priority: number;
};

const statusPriority: Record<VisualStatus, number> = {
  overdue: 0,
  soon: 1,
  pending: 2,
  paid: 3,
  inactive: 4,
};

const frequencyLabels: Record<FinancialItem['frequency'], string> = {
  monthly: 'Mensual',
  yearly: 'Anual',
  one_time: 'Única',
};

function getVisualStatus(item: FinancialItem): VisualStatus {
  const visualStatus = statusFromDueDate(item.status, item.due_date) as ItemStatus;
  const soon = visualStatus === 'pending' && daysUntil(item.due_date) <= 3 && daysUntil(item.due_date) >= 0;
  return soon ? 'soon' : visualStatus;
}

function statusText(status: VisualStatus) {
  const labels: Record<VisualStatus, string> = {
    overdue: 'vencidos',
    soon: 'por vencer',
    pending: 'pendientes',
    paid: 'pagados',
    inactive: 'inactivos',
  };
  return labels[status];
}

function dueText(item: FinancialItem) {
  const gap = daysUntil(item.due_date);
  if (item.status === 'paid') return 'pagado';
  if (gap === 0) return 'vence hoy';
  if (gap < 0) return `venció hace ${Math.abs(gap)} días`;
  return `vence en ${gap} días`;
}

function dueTone(item: FinancialItem) {
  const status = getVisualStatus(item);
  if (status === 'overdue') return 'text-red-200';
  if (status === 'soon') return 'text-yellow-100';
  if (status === 'paid') return 'text-green-100';
  return 'text-cyan-100';
}

function sortPayments(items: FinancialItem[]) {
  return [...items].sort((a, b) => {
    const statusDiff = statusPriority[getVisualStatus(a)] - statusPriority[getVisualStatus(b)];
    if (statusDiff !== 0) return statusDiff;
    return a.due_date.localeCompare(b.due_date);
  });
}

function buildCategoryGroups(categories: Category[], items: FinancialItem[]): CategoryGroup[] {
  const groups = categories.reduce<Record<string, CategoryGroup>>((acc, category) => {
    acc[category.id] = {
      categoryId: category.id,
      name: category.name,
      total: 0,
      items: [],
      counts: { overdue: 0, soon: 0, pending: 0, paid: 0, inactive: 0 },
      priority: statusPriority.pending,
    };
    return acc;
  }, {});

  items.forEach((item) => {
    const key = item.category_id ?? item.categories?.id ?? 'uncategorized';
    if (!groups[key]) {
      groups[key] = {
        categoryId: item.category_id,
        name: item.categories?.name ?? 'Sin categoría',
        total: 0,
        items: [],
        counts: { overdue: 0, soon: 0, pending: 0, paid: 0, inactive: 0 },
        priority: statusPriority.pending,
      };
    }
    groups[key].items.push(item);
  });

  return Object.values(groups)
    .map((group) => {
      const sorted = sortPayments(group.items);
      const counts = sorted.reduce<Record<VisualStatus, number>>(
        (acc, item) => {
          acc[getVisualStatus(item)] += 1;
          return acc;
        },
        { overdue: 0, soon: 0, pending: 0, paid: 0, inactive: 0 },
      );
      const priority = sorted.length ? Math.min(...sorted.map((item) => statusPriority[getVisualStatus(item)])) : statusPriority.pending;
      return {
        ...group,
        total: sorted.reduce((sum, item) => sum + Number(item.amount), 0),
        items: sorted,
        counts,
        priority,
      };
    })
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      if (b.total !== a.total) return b.total - a.total;
      return a.name.localeCompare(b.name);
    });
}

function PaymentActions({
  item,
  onEdit,
  onDelete,
}: {
  item: FinancialItem;
  onEdit: (item: FinancialItem) => void;
  onDelete: (item: FinancialItem) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button className="h-12 w-12 p-0" variant="secondary" onClick={() => onEdit(item)} aria-label={`Editar ${item.description}`} title="Editar">
        <Edit3 className="h-6 w-6" />
      </Button>
      <Button className="h-12 w-12 p-0" variant="danger" onClick={() => onDelete(item)} aria-label={`Eliminar ${item.description}`} title="Eliminar">
        <Trash2 className="h-6 w-6" />
      </Button>
    </div>
  );
}

function PaymentItemCard({
  item,
  onEdit,
  onDelete,
}: {
  item: FinancialItem;
  onEdit: (item: FinancialItem) => void;
  onDelete: (item: FinancialItem) => void;
}) {
  const status = getVisualStatus(item);

  return (
    <article className="rounded-lg border border-border bg-background/40 px-4 py-3 transition hover:border-accent/35 hover:bg-surfaceElevated/45">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold text-textPrimary">{item.description}</h3>
            <StatusBadge status={status} />
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="font-medium text-textSecondary">{frequencyLabels[item.frequency]}</span>
            <span className="h-1 w-1 rounded-full bg-border" aria-hidden="true" />
            <span className="text-textMuted">{readableDate(item.due_date)}</span>
            <span className="h-1 w-1 rounded-full bg-border" aria-hidden="true" />
            <span className={`font-semibold ${dueTone(item)}`}>{dueText(item)}</span>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 md:justify-end">
          <p className="shrink-0 text-xl font-bold text-textPrimary">{formatCurrency(item.amount)}</p>
          <PaymentActions item={item} onEdit={onEdit} onDelete={onDelete} />
        </div>
      </div>
    </article>
  );
}

function CategoryPaymentCard({
  group,
  onOpen,
  onAdd,
  onDelete,
}: {
  group: CategoryGroup;
  onOpen: (group: CategoryGroup) => void;
  onAdd: (group: CategoryGroup) => void;
  onDelete: (categoryId: string) => void;
}) {
  const statusBadges = (['overdue', 'soon', 'pending', 'paid'] as VisualStatus[]).filter((status) => group.counts[status] > 0);

  return (
    <article className="nexo-card flex min-h-[188px] flex-col justify-between overflow-hidden p-5 transition hover:border-accent/45 hover:bg-surfaceElevated/60">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-textPrimary">{group.name}</h2>
            <p className="mt-1 text-sm text-textMuted">
              {group.items.length} {group.items.length === 1 ? 'registro' : 'registros'}
            </p>
          </div>
          <Eye className="mt-1 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
        </div>

        <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-textMuted">Total categoría</p>
        <p className="mt-1 text-2xl font-bold text-textPrimary">{formatCurrency(group.total)}</p>
      </div>

      <div>
        {statusBadges.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {statusBadges.map((status) => (
              <span key={status} className="rounded-full border border-border bg-background/60 px-2.5 py-1 text-xs font-semibold text-textSecondary">
                {group.counts[status]} {statusText(status)}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-textMuted">Sin pagos fijos dentro de esta categoría.</p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button className="min-h-9 px-3 py-1.5" icon={<Plus className="h-4 w-4" />} onClick={() => onAdd(group)} disabled={!group.categoryId}>
            Agregar pago
          </Button>
          <Button className="min-h-9 px-3 py-1.5" variant="secondary" icon={<Eye className="h-4 w-4" />} onClick={() => onOpen(group)} disabled={!group.items.length}>
            Ver detalle
          </Button>
          {group.categoryId && (
            <Button className="min-h-9 px-3 py-1.5" variant="danger" icon={<Trash2 className="h-4 w-4" />} onClick={() => onDelete(group.categoryId!)}>
              Eliminar
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

function CategoryDetailModal({
  group,
  onClose,
  onEdit,
  onDelete,
}: {
  group: CategoryGroup | null;
  onClose: () => void;
  onEdit: (item: FinancialItem) => void;
  onDelete: (item: FinancialItem) => void;
}) {
  return (
    <Modal open={Boolean(group)} title={group ? `Detalle de ${group.name}` : 'Detalle'} onClose={onClose}>
      {group && (
        <div className="grid gap-4">
          <div className="grid gap-3 rounded-lg border border-border bg-background/35 p-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-textMuted">Total categoría</p>
              <p className="mt-1 text-xl font-bold text-textPrimary">{formatCurrency(group.total)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-textMuted">Registros</p>
              <p className="mt-1 text-xl font-bold text-textPrimary">{group.items.length}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-textMuted">Vencidos</p>
              <p className="mt-1 text-xl font-bold text-textPrimary">{group.counts.overdue}</p>
            </div>
          </div>

          <div className="grid gap-3">
            {group.items.map((item) => (
              <PaymentItemCard key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}

function CategoryFormModal({
  open,
  defaultName,
  onClose,
  onSubmit,
}: {
  open: boolean;
  defaultName?: string;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) setName(defaultName ?? '');
  }, [defaultName, open]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanName = name.trim();
    if (cleanName.length < 2) return;
    setIsSubmitting(true);
    try {
      await onSubmit(cleanName);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={open} title="Nueva categoría de pago fijo" onClose={onClose}>
      <form className="grid gap-4" onSubmit={submit}>
        <Field label="Nombre de la categoría">
          <TextInput value={name} placeholder="Servicios, Suscripciones, Arriendo..." onChange={(event) => setName(event.target.value)} autoFocus />
        </Field>
        <p className="text-sm text-textMuted">Primero crea la categoría. Después podrás agregarle nombre del pago, valor y fecha.</p>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSubmitting} disabled={name.trim().length < 2}>
            Guardar categoría
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function FinancialItemsPage({
  title = 'Pagos fijos',
  categoryName,
  description = 'Registra servicios, suscripciones, impuestos y pagos recurrentes del mes.',
  primaryActionLabel = 'Agregar pago fijo',
  emptyTitle = 'Aún no tienes pagos fijos registrados',
  emptyDescription = 'Agrega servicios, suscripciones, impuestos o pagos recurrentes para verlos organizados por categoría.',
  emptyActionLabel = 'Agregar primer pago fijo',
  noCategoriesDescription = 'Corvo necesita categorías para organizar tus pagos, deudas y gráficas.',
  showHeader = true,
  createRequestId = 0,
}: FinancialItemsPageProps) {
  const finance = useFinance();
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [initialCategoryId, setInitialCategoryId] = useState<string | undefined>();
  const [editing, setEditing] = useState<FinancialItem | null>(null);
  const [deleting, setDeleting] = useState<FinancialItem | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const visibleCategories = useMemo(() => {
    return finance.categories.filter((category) => !categoryName || category.name === categoryName);
  }, [categoryName, finance.categories]);
  const hasCategories = visibleCategories.length > 0;

  const filtered = useMemo(() => {
    return finance.items.filter((item) => {
      const categoryLabel = item.categories?.name ?? '';
      return !categoryName || categoryLabel === categoryName;
    });
  }, [categoryName, finance.items]);

  const grouped = useMemo(() => buildCategoryGroups(visibleCategories, filtered), [filtered, visibleCategories]);
  const selectedGroup = selectedCategoryName ? grouped.find((group) => group.name === selectedCategoryName) ?? null : null;

  const totals = useMemo(() => {
    const totalAmount = grouped.reduce((sum, group) => sum + group.total, 0);
    const itemCount = filtered.length;
    
    // Calcular total pagado sumando items con status 'paid'
    const totalPaid = filtered
      .filter((item) => item.status === 'paid')
      .reduce((sum, item) => sum + Number(item.amount), 0);
    
    return {
      amount: totalAmount,
      count: itemCount,
      paid: totalPaid,
    };
  }, [grouped, filtered]);

  const openCreate = () => {
    if (!hasCategories) return;
    setEditing(null);
    setInitialCategoryId(visibleCategories[0]?.id);
    setModalOpen(true);
  };

  const openCreateForCategory = (group: CategoryGroup) => {
    if (!group.categoryId) return;
    setEditing(null);
    setInitialCategoryId(group.categoryId);
    setModalOpen(true);
  };

  useEffect(() => {
    if (createRequestId > 0 && hasCategories) {
      setEditing(null);
      setInitialCategoryId(visibleCategories[0]?.id);
      setModalOpen(true);
    }
  }, [createRequestId, hasCategories, visibleCategories]);

  const submit = async (values: FinancialItemFormValues) => {
    await finance.saveFinancialItem(values, editing?.id);
    toast.success(editing ? 'Pago actualizado' : 'Pago creado');
    setModalOpen(false);
    setEditing(null);
  };

  const createCategory = async (name: string) => {
    await finance.saveCategory({ name, type: 'fixed', color: '#00E5FF', icon: 'receipt' });
    toast.success('Categoría creada');
  };

  const createCategories = async () => {
    await finance.createDefaultCategories();
    toast.success('Categorías recomendadas creadas');
  };

  const remove = async () => {
    if (!deleting) return;
    await finance.deleteFinancialItem(deleting.id);
    toast.success('Pago eliminado');
    setDeleting(null);
  };

  const deleteCategory = async () => {
    if (!deletingCategory) return;
    await finance.deleteCategory(deletingCategory.id);
    toast.success('Categoría eliminada');
    setDeletingCategory(null);
  };

  const openEdit = (item: FinancialItem) => {
    setSelectedCategoryName(null);
    setEditing(item);
    setInitialCategoryId(undefined);
    setModalOpen(true);
  };

  const openDelete = (item: FinancialItem) => {
    setSelectedCategoryName(null);
    setDeleting(item);
  };

  const openDeleteCategory = (categoryId: string) => {
    const category = finance.categories.find((cat) => cat.id === categoryId);
    if (category) {
      setDeletingCategory(category);
    }
  };

  return (
    <div className="grid gap-6">
      {showHeader && (
        <PageHeader
          title={title}
          description={description}
          action={
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Button className="w-full sm:w-auto" variant="secondary" icon={<FolderPlus className="h-4 w-4" />} onClick={() => setCategoryModalOpen(true)}>
                Nueva categoría
              </Button>
              {hasCategories && (
                <Button className="w-full sm:w-auto" icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
                  {primaryActionLabel}
                </Button>
              )}
            </div>
          }
        />
      )}

      {hasCategories && (
        <section className="grid gap-4 md:grid-cols-3">
          <div className="nexo-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-textMuted">Total pagado</p>
            <p className="mt-2 text-xl font-bold text-textPrimary">{formatCurrency(totals.paid)}</p>
          </div>
          <div className="nexo-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-textMuted">Total pagos</p>
            <p className="mt-2 text-xl font-bold text-textPrimary">{formatCurrency(totals.amount)}</p>
          </div>
          <div className="nexo-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-textMuted">Registros</p>
            <p className="mt-2 text-xl font-bold text-textPrimary">{totals.count}</p>
          </div>
        </section>
      )}

      {!hasCategories ? (
        <EmptyState
          icon={<FolderPlus className="h-5 w-5" />}
          title={categoryName ? `Crea la categoría ${categoryName}` : 'Primero crea tus categorías'}
          description={noCategoriesDescription}
          action={<Button icon={<FolderPlus className="h-4 w-4" />} onClick={() => setCategoryModalOpen(true)}>Crear categoría</Button>}
          secondaryAction={!categoryName ? <Button variant="secondary" onClick={() => void createCategories()}>Usar categorías recomendadas</Button> : undefined}
        />
      ) : (
        <>
          {grouped.length ? (
            <div className="grid gap-5 md:grid-cols-2">
              {grouped.map((group) => (
                <CategoryPaymentCard
                  key={group.categoryId ?? group.name}
                  group={group}
                  onAdd={openCreateForCategory}
                  onOpen={(selectedGroup) => setSelectedCategoryName(selectedGroup.name)}
                  onDelete={openDeleteCategory}
                />
              ))}
            </div>
          ) : (
            <EmptyState title={emptyTitle} description={emptyDescription} action={<Button onClick={openCreate}>{emptyActionLabel}</Button>} />
          )}
        </>
      )}

      <Modal open={modalOpen} title={editing ? 'Editar pago' : primaryActionLabel} onClose={() => setModalOpen(false)}>
        <FinancialItemForm categories={hasCategories ? visibleCategories : finance.categories} item={editing} initialCategoryId={initialCategoryId} onSubmit={submit} onCancel={() => setModalOpen(false)} />
      </Modal>
      <CategoryFormModal
        open={categoryModalOpen}
        defaultName={categoryName}
        onClose={() => setCategoryModalOpen(false)}
        onSubmit={createCategory}
      />
      <CategoryDetailModal
        group={selectedGroup}
        onClose={() => setSelectedCategoryName(null)}
        onEdit={openEdit}
        onDelete={openDelete}
      />
      <ConfirmDialog open={Boolean(deleting)} title="Eliminar pago" description="Esta acción elimina el pago seleccionado. El historial de pagos existente no se borra." onConfirm={() => void remove()} onClose={() => setDeleting(null)} />
      <ConfirmDialog open={Boolean(deletingCategory)} title="Eliminar categoría" description={`¿Estás seguro de que deseas eliminar la categoría "${deletingCategory?.name}"? Los pagos asociados pasarán a "Sin categoría" pero no se eliminarán.`} onConfirm={() => void deleteCategory()} onClose={() => setDeletingCategory(null)} />
    </div>
  );
}

