import type { ItemStatus } from '../../types';

const statusStyles: Record<ItemStatus | 'soon', string> = {
  paid: 'border-success/35 bg-success/10 text-green-100',
  pending: 'border-accent/35 bg-accent/10 text-cyan-100',
  soon: 'border-warning/35 bg-warning/10 text-yellow-100',
  overdue: 'border-danger/35 bg-danger/10 text-red-100',
  inactive: 'border-textMuted/35 bg-textMuted/10 text-textSecondary',
};

const labels: Record<ItemStatus | 'soon', string> = {
  paid: 'Pagado',
  pending: 'Pendiente',
  soon: 'Vence pronto',
  overdue: 'Vencido',
  inactive: 'Inactivo',
};

export function StatusBadge({ status }: { status: ItemStatus | 'soon' }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[status]}`}>{labels[status]}</span>;
}

export function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex rounded-full border border-border bg-accent/10 px-2.5 py-1 text-xs font-semibold text-cyan-100">{children}</span>;
}
