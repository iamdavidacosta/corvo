import { CalendarDays, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { SelectInput } from '../../components/ui/Form';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBadge } from '../../components/ui/Badge';
import { daysUntil, readableDate, statusFromDueDate } from '../../lib/dates';
import { groupByDueDate } from '../../lib/calculations';
import { formatCurrency } from '../../lib/formatters';
import { useFinance } from '../../hooks/useFinance';
import type { ItemStatus } from '../../types';

function LegendItem({ status }: { status: ItemStatus | 'soon' }) {
  return (
    <div className="flex items-center gap-2">
      <StatusBadge status={status} />
    </div>
  );
}

export function CalendarPage() {
  const finance = useFinance();
  const navigate = useNavigate();
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const hasItems = finance.items.length > 0;
  const grouped = useMemo(() => {
    const filtered = finance.items.filter((item) => {
      const categoryName = item.categories?.name ?? '';
      const visualStatus = statusFromDueDate(item.status, item.due_date);
      return (category === 'all' || categoryName === category) && (status === 'all' || visualStatus === status);
    });
    return Object.entries(groupByDueDate(filtered)).sort(([a], [b]) => a.localeCompare(b));
  }, [category, finance.items, status]);

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Calendario"
        description="Consulta tus pagos del mes organizados por fecha de vencimiento."
        action={hasItems ? <Button className="w-full sm:w-auto" icon={<Plus className="h-4 w-4" />} onClick={() => navigate('/expenses')}>Agregar pago</Button> : undefined}
      />

      {hasItems && (
        <Card>
          <div className="grid gap-4">
            <div className="flex flex-wrap gap-2" aria-label="Leyenda de estados">
              <LegendItem status="pending" />
              <LegendItem status="paid" />
              <LegendItem status="soon" />
              <LegendItem status="overdue" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <SelectInput value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="all">Todas las categorías</option>
                {finance.categories.map((item) => (
                  <option key={item.id} value={item.name}>{item.name}</option>
                ))}
              </SelectInput>
              <SelectInput value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="all">Todos los estados</option>
                <option value="pending">Pendientes</option>
                <option value="overdue">Vencidos</option>
                <option value="inactive">Inactivos</option>
              </SelectInput>
            </div>
          </div>
        </Card>
      )}

      {grouped.length ? (
        <div className="grid gap-4">
          {grouped.map(([date, items]) => (
            <Card key={date} title={readableDate(date)} subtitle={`${items.length} pago(s)`}>
              <div className="grid gap-3">
                {items.map((item) => {
                  const visualStatus = statusFromDueDate(item.status, item.due_date) as ItemStatus;
                  const soon = visualStatus === 'pending' && daysUntil(item.due_date) <= 3 && daysUntil(item.due_date) >= 0;
                  return (
                    <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background/55 p-4">
                      <div>
                        <p className="font-semibold text-textPrimary">{item.description}</p>
                        <p className="text-sm text-textMuted">{item.categories?.name ?? 'Sin categoría'} · {daysUntil(item.due_date)} días</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-bold text-textPrimary">{formatCurrency(item.amount)}</p>
                        <StatusBadge status={soon ? 'soon' : visualStatus} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<CalendarDays className="h-5 w-5" />}
          title="No hay pagos programados para este mes"
          description="Cuando registres pagos, préstamos o tarjetas, aparecerán aquí organizados por fecha."
          action={<Button onClick={() => navigate('/expenses')}>Agregar pago</Button>}
          secondaryAction={<Button variant="secondary" onClick={() => navigate('/credits')}>Ver deudas y tarjetas</Button>}
        />
      )}
    </div>
  );
}
