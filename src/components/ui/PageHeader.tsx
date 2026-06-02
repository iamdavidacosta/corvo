import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-textPrimary">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-textMuted">{description}</p>
      </div>
      {action && <div className="shrink-0 sm:pt-1">{action}</div>}
    </div>
  );
}
