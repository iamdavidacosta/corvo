import type { ReactNode } from 'react';
import { formatCurrency } from '../../lib/formatters';

export function MetricCard({ label, value, tone = 'blue', icon }: { label: string; value: number; tone?: 'blue' | 'green' | 'yellow' | 'red'; icon?: ReactNode }) {
  const tones = {
    blue: 'text-accent',
    green: 'text-success',
    yellow: 'text-warning',
    red: 'text-danger',
  };
  const barTone = tone === 'red' ? 'bg-danger' : tone === 'yellow' ? 'bg-warning' : tone === 'green' ? 'bg-success' : 'bg-accent';

  return (
    <div className="nexo-card overflow-hidden p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-textMuted">{label}</p>
        <div className={`grid h-9 w-9 place-items-center rounded-lg bg-deepBlue/80 ${tones[tone]}`}>{icon}</div>
      </div>
      <p className="mt-4 text-2xl font-bold text-textPrimary">{formatCurrency(value)}</p>
      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-deepBlue">
        <div className={`h-full rounded-full ${barTone}`} style={{ width: `${Math.min(100, Math.max(8, Math.abs(value) / 100000))}%` }} />
      </div>
    </div>
  );
}
