import { CircleHelp } from 'lucide-react';
import type { ReactNode } from 'react';

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  secondaryAction?: ReactNode;
}) {
  return (
    <div className="grid min-h-[220px] place-items-center rounded-lg border border-dashed border-border bg-surface/55 px-5 py-6 text-center sm:min-h-[240px]">
      <div className="w-full max-w-[520px]">
        <div className="mx-auto grid h-11 w-11 place-items-center rounded-lg border border-accent/30 bg-accent/10 text-accent">
          {icon ?? <CircleHelp className="h-5 w-5" />}
        </div>
        <h3 className="mt-4 text-base font-semibold text-textPrimary">{title}</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-textMuted">{description}</p>
        {(action || secondaryAction) && <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">{action}{secondaryAction}</div>}
      </div>
    </div>
  );
}
