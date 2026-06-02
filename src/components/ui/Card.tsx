import type { HTMLAttributes, ReactNode } from 'react';

type CardProps = HTMLAttributes<HTMLDivElement> & {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
};

export function Card({ title, subtitle, action, children, className = '', ...props }: CardProps) {
  return (
    <section className={`nexo-card ${className}`} {...props}>
      {(title || subtitle || action) && (
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            {title && <h2 className="text-base font-semibold text-textPrimary">{title}</h2>}
            {subtitle && <p className="mt-1 text-sm text-textMuted">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}
