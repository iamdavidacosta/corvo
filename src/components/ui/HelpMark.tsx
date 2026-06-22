import { HelpCircle } from 'lucide-react';

export function HelpMark({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex align-middle">
      <span
        tabIndex={0}
        className="inline-grid h-5 w-5 place-items-center rounded-full border border-border bg-surfaceElevated text-textMuted transition hover:border-accent/70 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
        aria-label={text}
        role="button"
      >
        <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      <span
        className="pointer-events-none absolute left-1/2 top-7 z-30 w-64 -translate-x-1/2 rounded-lg border border-border bg-surfaceElevated px-3 py-2 text-left text-xs font-medium normal-case leading-5 tracking-normal text-textSecondary opacity-0 shadow-xl transition group-hover:opacity-100 group-focus-within:opacity-100"
        role="tooltip"
      >
        {text}
      </span>
    </span>
  );
}
