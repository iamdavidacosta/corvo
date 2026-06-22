import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBadge } from '../../components/ui/Badge';
import { daysUntil, readableDate, statusFromDueDate, todayISO } from '../../lib/dates';
import { formatCurrency } from '../../lib/formatters';
import { useFinance } from '../../hooks/useFinance';
import type { FinancialItem, ItemStatus } from '../../types';

type VisualStatus = ItemStatus | 'soon';
type ViewMode = 'month' | 'list';

const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const statusOrder: VisualStatus[] = ['overdue', 'soon', 'pending', 'paid', 'inactive'];

const paymentCardStyles: Record<VisualStatus, string> = {
  pending: 'border-accent/35 bg-accent/10 text-cyan-50',
  paid: 'border-success/35 bg-success/10 text-green-50',
  soon: 'border-warning/35 bg-warning/10 text-yellow-50',
  overdue: 'border-danger/35 bg-danger/10 text-red-50',
  inactive: 'border-textMuted/35 bg-textMuted/10 text-textSecondary',
};

function getVisualStatus(item: FinancialItem): VisualStatus {
  const visualStatus = statusFromDueDate(item.status, item.due_date) as ItemStatus;
  const soon = visualStatus === 'pending' && daysUntil(item.due_date) <= 3 && daysUntil(item.due_date) >= 0;
  return soon ? 'soon' : visualStatus;
}

function getStatusPriority(items: FinancialItem[]): VisualStatus | null {
  if (!items.length) return null;
  const statuses = new Set(items.map(getVisualStatus));
  return statusOrder.find((status) => statuses.has(status)) ?? 'pending';
}

function groupItemsByDate(items: FinancialItem[]) {
  return items.reduce<Record<string, FinancialItem[]>>((groups, item) => {
    groups[item.due_date] = [...(groups[item.due_date] ?? []), item];
    return groups;
  }, {});
}

function formatDayLabel(date: string) {
  return format(parseISO(date), "d 'de' MMMM", { locale: es });
}

function CalendarToolbar({
  month,
  viewMode,
  onPrevious,
  onNext,
  onToday,
  onViewModeChange,
}: {
  month: Date;
  viewMode: ViewMode;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewModeChange: (mode: ViewMode) => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <Button variant="secondary" className="h-9 w-9 p-0" onClick={onPrevious} aria-label="Mes anterior">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="secondary" className="h-9 w-9 p-0" onClick={onNext} aria-label="Mes siguiente">
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" className="h-9 px-3" onClick={onToday}>
          Hoy
        </Button>
        <h2 className="ml-1 text-base font-semibold capitalize text-textPrimary">{format(month, 'MMMM yyyy', { locale: es })}</h2>
      </div>

      <div className="inline-flex w-fit rounded-lg border border-border bg-background/60 p-1" aria-label="Vista del calendario">
        <button
          type="button"
          className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${
            viewMode === 'month' ? 'bg-accent/10 text-textPrimary' : 'text-textMuted hover:text-textPrimary'
          }`}
          onClick={() => onViewModeChange('month')}
        >
          Mes
        </button>
        <button type="button" className="rounded-md px-3 py-1.5 text-sm font-semibold text-textMuted opacity-60" disabled title="Vista semanal pendiente">
          Semana
        </button>
        <button
          type="button"
          className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${
            viewMode === 'list' ? 'bg-accent/10 text-textPrimary' : 'text-textMuted hover:text-textPrimary'
          }`}
          onClick={() => onViewModeChange('list')}
        >
          Lista
        </button>
      </div>
    </div>
  );
}

function MonthlyMiniCalendar({
  month,
  selectedDate,
  itemsByDate,
  onSelectDate,
  onPrevious,
  onNext,
}: {
  month: Date;
  selectedDate: string;
  itemsByDate: Record<string, FinancialItem[]>;
  onSelectDate: (date: string) => void;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [month]);
  const today = todayISO();

  return (
    <section className="nexo-card p-4">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold capitalize text-textPrimary">{format(month, 'MMMM yyyy', { locale: es })}</h2>
        <div className="flex gap-1">
          <Button variant="ghost" className="h-8 w-8 p-0" onClick={onPrevious} aria-label="Mes anterior">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" className="h-8 w-8 p-0" onClick={onNext} aria-label="Mes siguiente">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-textMuted">
        {weekDays.map((day) => (
          <span key={day} className="py-1">{day}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((date) => {
          const iso = format(date, 'yyyy-MM-dd');
          const dayItems = itemsByDate[iso] ?? [];
          const priority = getStatusPriority(dayItems);
          const isCurrentMonth = isSameMonth(date, month);
          const selected = selectedDate === iso;
          const isToday = today === iso;
          const overdueCount = dayItems.filter((item) => getVisualStatus(item) === 'overdue').length;
          const label = `${format(date, "d 'de' MMMM", { locale: es })}, ${dayItems.length} pagos${overdueCount ? `, ${overdueCount} vencidos` : ''}`;

          return (
            <button
              key={iso}
              type="button"
              className={`relative grid h-9 place-items-center rounded-lg text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
                selected
                  ? 'bg-accent text-background'
                  : isToday
                    ? 'border border-accent/70 text-textPrimary'
                    : isCurrentMonth
                      ? 'text-textSecondary hover:bg-white/5 hover:text-textPrimary'
                      : 'text-textMuted/40'
              }`}
              aria-label={label}
              onClick={() => onSelectDate(iso)}
            >
              {format(date, 'd')}
              {priority && (
                <span
                  className={`absolute bottom-1 h-1.5 w-1.5 rounded-full ${
                    priority === 'overdue' ? 'bg-danger' : priority === 'soon' ? 'bg-warning' : priority === 'paid' ? 'bg-success' : 'bg-accent'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function MonthSummaryCard({ month, items }: { month: Date; items: FinancialItem[] }) {
  const summary = useMemo(() => {
    return items.reduce(
      (totals, item) => {
        const amount = Number(item.amount);
        const status = getVisualStatus(item);
        totals.total += amount;
        if (status === 'paid') totals.paid += amount;
        else if (status === 'overdue') totals.overdue += amount;
        else if (status !== 'inactive') totals.pending += amount;
        return totals;
      },
      { total: 0, paid: 0, pending: 0, overdue: 0 },
    );
  }, [items]);

  const nextPayment = useMemo(() => {
    return items
      .filter((item) => ['pending', 'soon'].includes(getVisualStatus(item)))
      .sort((a, b) => a.due_date.localeCompare(b.due_date))[0];
  }, [items]);

  const rows = [
    ['Total', summary.total],
    ['Pagado', summary.paid],
    ['Pendiente', summary.pending],
    ['Vencido', summary.overdue],
  ] as const;

  return (
    <section className="nexo-card p-4">
      <h2 className="text-sm font-semibold text-textPrimary">Resumen de {format(month, 'MMMM', { locale: es })}</h2>
      <div className="mt-4 grid gap-3">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/45 px-3 py-2">
            <span className="text-sm text-textMuted">{label}</span>
            <span className="text-sm font-semibold text-textPrimary">{formatCurrency(value)}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-lg border border-border bg-surfaceElevated/55 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-textMuted">Próximo vencimiento</p>
        {nextPayment ? (
          <div className="mt-2">
            <p className="truncate text-sm font-semibold text-textPrimary">{nextPayment.description}</p>
            <p className="text-xs text-textMuted">{readableDate(nextPayment.due_date)} · {formatCurrency(nextPayment.amount)}</p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-textMuted">Sin vencimientos pendientes.</p>
        )}
      </div>
    </section>
  );
}

function UpcomingPaymentsCard({ items, onSelectDate }: { items: FinancialItem[]; onSelectDate: (date: string) => void }) {
  const upcoming = useMemo(() => {
    return items
      .filter((item) => ['pending', 'soon', 'overdue'].includes(getVisualStatus(item)))
      .sort((a, b) => a.due_date.localeCompare(b.due_date))
      .slice(0, 5);
  }, [items]);

  return (
    <section className="nexo-card p-4">
      <h2 className="text-sm font-semibold text-textPrimary">Próximos vencimientos</h2>
      <div className="mt-4 grid gap-3">
        {upcoming.length ? (
          upcoming.map((item) => {
            const status = getVisualStatus(item);
            const gap = daysUntil(item.due_date);
            const dueText = gap === 0 ? 'vence hoy' : gap < 0 ? `venció hace ${Math.abs(gap)} días` : `vence en ${gap} días`;
            return (
              <button
                key={item.id}
                type="button"
                className="rounded-lg border border-border bg-background/45 p-3 text-left transition hover:border-accent/55 hover:bg-surfaceElevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
                onClick={() => onSelectDate(item.due_date)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-textPrimary">{item.description}</p>
                    <p className="mt-1 text-xs text-textMuted">{item.categories?.name ?? 'Sin categoría'} · {dueText}</p>
                  </div>
                  <StatusBadge status={status} />
                </div>
                <p className="mt-2 text-sm font-bold text-textPrimary">{formatCurrency(item.amount)}</p>
              </button>
            );
          })
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-background/35 p-4">
            <p className="text-sm font-semibold text-textPrimary">Sin próximos vencimientos</p>
            <p className="mt-1 text-sm text-textMuted">Cuando registres pagos, aparecerán aquí.</p>
          </div>
        )}
      </div>
    </section>
  );
}

function PaymentCalendarCard({ item, compact = false }: { item: FinancialItem; compact?: boolean }) {
  const status = getVisualStatus(item);
  return (
    <div className={`rounded-md border px-2 py-1.5 ${paymentCardStyles[status]}`}>
      <div className="flex min-w-0 items-center justify-between gap-2">
        <span className="truncate text-[11px] font-semibold leading-tight">{item.description}</span>
        {!compact && <span className="shrink-0 text-[11px] font-bold">{formatCurrency(item.amount)}</span>}
      </div>
      {compact && <p className="mt-0.5 truncate text-[11px] opacity-90">{formatCurrency(item.amount)}</p>}
    </div>
  );
}

function CalendarBoard({
  month,
  itemsByDate,
  selectedDate,
  onSelectDate,
}: {
  month: Date;
  itemsByDate: Record<string, FinancialItem[]>;
  selectedDate: string;
  onSelectDate: (date: string, revealDetails?: boolean) => void;
}) {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [month]);
  const today = todayISO();

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface/70">
      <div className="hidden grid-cols-7 border-b border-border bg-background/45 text-xs font-semibold uppercase tracking-wide text-textMuted md:grid">
        {weekDays.map((day) => (
          <div key={day} className="px-3 py-2">{day}</div>
        ))}
      </div>
      <div className="hidden grid-cols-7 md:grid">
        {days.map((date) => {
          const iso = format(date, 'yyyy-MM-dd');
          const dayItems = itemsByDate[iso] ?? [];
          const selected = selectedDate === iso;
          const visibleItems = dayItems.slice(0, selected ? 5 : 3);
          const moreCount = Math.max(0, dayItems.length - visibleItems.length);
          const isToday = today === iso;
          const currentMonth = isSameMonth(date, month);
          const overdueCount = dayItems.filter((item) => getVisualStatus(item) === 'overdue').length;
          const priority = getStatusPriority(dayItems);
          const label = `${format(date, "d 'de' MMMM", { locale: es })}, ${dayItems.length} pagos${overdueCount ? `, ${overdueCount} vencidos` : ''}`;
          const counterTone =
            priority === 'overdue'
              ? 'border-danger/40 bg-danger/10 text-red-100 hover:border-danger'
              : priority === 'soon'
                ? 'border-warning/40 bg-warning/10 text-yellow-100 hover:border-warning'
                : priority === 'paid'
                  ? 'border-success/40 bg-success/10 text-green-100 hover:border-success'
                  : 'border-accent/40 bg-accent/10 text-cyan-100 hover:border-accent';

          return (
            <div
              key={iso}
              className={`flex min-h-[160px] flex-col border-b border-r border-border p-2 text-left transition ${
                selected ? 'bg-accent/10' : currentMonth ? 'bg-surface/35 hover:bg-white/5' : 'bg-background/35 text-textMuted/50'
              }`}
            >
              <div className="mb-2 flex h-8 items-start justify-between gap-2">
                <button
                  type="button"
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
                    isToday ? 'border border-accent text-accent' : selected ? 'bg-accent text-background' : 'text-textSecondary'
                  }`}
                  aria-label={label}
                  onClick={() => onSelectDate(iso)}
                >
                  {format(date, 'd')}
                </button>
                {dayItems.length > 0 && (
                  <button
                    type="button"
                    className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${counterTone}`}
                    aria-label={`Ver ${dayItems.length} pagos del ${format(date, "d 'de' MMMM", { locale: es })}`}
                    onClick={() => onSelectDate(iso, true)}
                  >
                    {dayItems.length} {dayItems.length === 1 ? 'pago' : 'pagos'}
                  </button>
                )}
              </div>

              <div className="grid flex-1 content-start gap-1.5">
                {visibleItems.map((item) => (
                  <PaymentCalendarCard key={item.id} item={item} compact />
                ))}
                {moreCount > 0 && (
                  <button
                    type="button"
                    className="mt-1 w-fit rounded-full border border-accent/45 bg-accent/10 px-2 py-1 text-xs font-semibold text-accent transition hover:border-accent hover:bg-accent/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
                    onClick={() => onSelectDate(iso, true)}
                    aria-label={`Ver ${moreCount} pagos más del ${format(date, "d 'de' MMMM", { locale: es })}`}
                  >
                    Ver {moreCount} más
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-3 p-3 md:hidden">
        {days
          .filter((date) => {
            const iso = format(date, 'yyyy-MM-dd');
            return isSameMonth(date, month) && (itemsByDate[iso]?.length ?? 0) > 0;
          })
          .map((date) => {
            const iso = format(date, 'yyyy-MM-dd');
            const dayItems = itemsByDate[iso] ?? [];
            return (
              <button
                key={iso}
                type="button"
                className={`rounded-lg border p-3 text-left transition ${
                  selectedDate === iso ? 'border-accent bg-accent/10' : 'border-border bg-background/45 hover:border-accent/55'
                }`}
                onClick={() => onSelectDate(iso, true)}
                aria-label={`${format(date, "d 'de' MMMM", { locale: es })}, ${dayItems.length} pagos`}
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="font-semibold capitalize text-textPrimary">{format(date, 'EEEE d', { locale: es })}</span>
                  <span className="rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-xs font-semibold text-cyan-100">
                    {dayItems.length} {dayItems.length === 1 ? 'pago' : 'pagos'}
                  </span>
                </div>
                <div className="grid gap-2">
                  {dayItems.slice(0, 3).map((item) => (
                    <PaymentCalendarCard key={item.id} item={item} />
                  ))}
                  {dayItems.length > 3 && <span className="text-xs font-semibold text-accent">Ver {dayItems.length - 3} más en detalle</span>}
                </div>
              </button>
            );
          })}
      </div>
    </div>
  );
}

function SelectedDayPayments({ date, items }: { date: string; items: FinancialItem[] }) {
  return (
    <section className="nexo-card border-accent/25 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-textPrimary">Pagos del {formatDayLabel(date)}</h2>
          <p className="text-sm text-textMuted">{items.length ? `Mostrando todos los ${items.length} pago(s) de este día` : 'No hay pagos para este día.'}</p>
        </div>
        {items.length > 0 && (
          <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold text-cyan-100">
            {items.length} {items.length === 1 ? 'pago' : 'pagos'}
          </span>
        )}
      </div>
      <div className="mt-4 grid gap-3">
        {items.length ? (
          items.map((item) => {
            const status = getVisualStatus(item);
            return (
              <div key={item.id} className="flex flex-col gap-3 rounded-lg border border-border bg-background/45 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-textPrimary">{item.description}</p>
                    <StatusBadge status={status} />
                  </div>
                  <p className="mt-1 text-sm text-textMuted">{item.categories?.name ?? 'Sin categoría'} · {readableDate(item.due_date)}</p>
                </div>
                <p className="text-lg font-bold text-textPrimary">{formatCurrency(item.amount)}</p>
              </div>
            );
          })
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-background/35 p-4 text-sm text-textMuted">
            Selecciona un día con pagos para ver el detalle.
          </div>
        )}
      </div>
    </section>
  );
}

function CalendarListFallback({ itemsByDate, onSelectDate }: { itemsByDate: Record<string, FinancialItem[]>; onSelectDate: (date: string) => void }) {
  const groups = Object.entries(itemsByDate).sort(([a], [b]) => a.localeCompare(b));
  return (
    <div className="grid gap-4">
      {groups.map(([date, items]) => (
        <section key={date} className="nexo-card p-4">
          <button type="button" className="text-left" onClick={() => onSelectDate(date)}>
            <h2 className="text-base font-semibold text-textPrimary">{readableDate(date)}</h2>
            <p className="mt-1 text-sm text-textMuted">{items.length} pago(s)</p>
          </button>
          <div className="mt-4 grid gap-2">
            {items.map((item) => (
              <PaymentCalendarCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function CalendarPage() {
  const finance = useFinance();
  const navigate = useNavigate();
  const detailPanelRef = useRef<HTMLDivElement | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => parseISO(finance.periodStart || finance.selectedMonth));
  const [selectedDate, setSelectedDate] = useState(() => todayISO());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const hasItems = finance.items.length > 0;
  const itemsByDate = useMemo(() => groupItemsByDate(finance.items), [finance.items]);
  const selectedItems = itemsByDate[selectedDate] ?? [];

  useEffect(() => {
    setCalendarMonth(parseISO(finance.periodStart || finance.selectedMonth));
    setSelectedDate(finance.periodStart || finance.selectedMonth);
  }, [finance.periodStart, finance.selectedMonth]);

  const selectCalendarDate = (date: string, revealDetails = false) => {
    setSelectedDate(date);
    if (revealDetails) {
      window.setTimeout(() => detailPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 0);
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCalendarMonth(today);
    setSelectedDate(todayISO());
  };

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Calendario"
        description={`Consulta tus pagos del periodo: ${finance.periodStart} a ${finance.periodEnd}.`}
        action={hasItems ? <Button className="w-full sm:w-auto" icon={<Plus className="h-4 w-4" />} onClick={() => navigate('/expenses')}>Agregar pago</Button> : undefined}
      />

      <div className="grid items-start gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="grid gap-4">
          <MonthlyMiniCalendar
            month={calendarMonth}
            selectedDate={selectedDate}
            itemsByDate={itemsByDate}
            onSelectDate={selectCalendarDate}
            onPrevious={() => setCalendarMonth((month) => subMonths(month, 1))}
            onNext={() => setCalendarMonth((month) => addMonths(month, 1))}
          />
          <MonthSummaryCard month={calendarMonth} items={finance.items} />
          <UpcomingPaymentsCard items={finance.items} onSelectDate={(date) => selectCalendarDate(date, true)} />
        </aside>

        <section className="min-w-0 overflow-hidden rounded-lg border border-border bg-surface/70">
          <CalendarToolbar
            month={calendarMonth}
            viewMode={viewMode}
            onPrevious={() => setCalendarMonth((month) => subMonths(month, 1))}
            onNext={() => setCalendarMonth((month) => addMonths(month, 1))}
            onToday={goToToday}
            onViewModeChange={setViewMode}
          />

          {hasItems ? (
            <div className="grid gap-4 p-3 sm:p-4">
              <div className="flex flex-wrap gap-2" aria-label="Leyenda de estados">
                <StatusBadge status="pending" />
                <StatusBadge status="paid" />
                <StatusBadge status="soon" />
                <StatusBadge status="overdue" />
              </div>
              {viewMode === 'month' ? (
                <CalendarBoard month={calendarMonth} itemsByDate={itemsByDate} selectedDate={selectedDate} onSelectDate={selectCalendarDate} />
              ) : (
                <CalendarListFallback itemsByDate={itemsByDate} onSelectDate={(date) => selectCalendarDate(date, true)} />
              )}
              <div ref={detailPanelRef}>
                <SelectedDayPayments date={selectedDate} items={selectedItems} />
              </div>
            </div>
          ) : (
            <div className="p-4">
              <EmptyState
                icon={<CalendarDays className="h-5 w-5" />}
                title="No hay pagos programados este mes"
                description="Cuando registres pagos, préstamos o tarjetas, aparecerán organizados por fecha."
                action={<Button onClick={() => navigate('/expenses')}>Agregar pago</Button>}
                secondaryAction={<Button variant="secondary" onClick={() => navigate('/credits')}>Ver deudas y tarjetas</Button>}
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
