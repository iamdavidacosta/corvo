import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  isLoading?: boolean;
  icon?: ReactNode;
};

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-background shadow-button hover:bg-accentHover hover:text-background',
  secondary: 'border border-border bg-surfaceElevated text-textPrimary hover:border-accent/70 hover:bg-deepBlue hover:shadow-[0_0_0_1px_rgba(0,229,255,0.16)]',
  ghost: 'bg-transparent text-textSecondary hover:bg-white/6 hover:text-textPrimary',
  danger: 'border border-danger/45 bg-dangerSurface text-red-100 hover:border-danger hover:bg-red-500/20',
};

export function Button({ children, variant = 'primary', isLoading, icon, className = '', disabled, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-55 ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}
