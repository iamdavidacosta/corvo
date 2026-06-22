import { format, parseISO } from 'date-fns';
import { Bell, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { BrandSolo } from './BrandMark';
import { Button } from '../ui/Button';
import { useAuth } from '../../features/auth/AuthProvider';
import { monthISO, readableDate, salaryCycleForMonth } from '../../lib/dates';
import { bottomNavItems, navItems } from './navigation';

type AppLayoutProps = {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
};

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="grid gap-1">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg border-l-2 px-3 py-2.5 text-sm font-medium transition ${
              isActive
                ? 'border-accent bg-accent/10 text-textPrimary'
                : 'border-transparent text-textMuted hover:bg-white/5 hover:text-textPrimary'
            }`
          }
        >
          <item.icon className="h-4 w-4 shrink-0" />
          <span className="truncate">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export function AppLayout({ selectedMonth, onMonthChange }: AppLayoutProps) {
  const { profile, user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const monthInput = format(parseISO(selectedMonth), 'yyyy-MM');
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Usuario';
  const initials = displayName.slice(0, 2).toUpperCase();
  const period = salaryCycleForMonth(selectedMonth, profile?.salary_cycle_day ?? 1, profile?.salary_adjusts_to_business_day ?? true);

  const handleMonthChange = (value: string) => {
    onMonthChange(monthISO(parseISO(`${value}-01`)));
  };

  return (
    <div className="min-h-screen bg-background pb-28 lg:pb-0 lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-border bg-surface/95 px-4 py-5 backdrop-blur lg:block">
        <div className="mb-8 px-1">
          <BrandSolo variant="header" />
        </div>
        <NavItems />
      </aside>

      <header className="sticky top-0 z-30 hidden border-b border-border bg-background/86 backdrop-blur lg:block">
        <div className="mx-auto flex max-w-[1440px] items-center justify-end gap-3 px-8 py-3">
          <div className="grid gap-1">
            <input
              className="nexo-input h-10 w-40"
              aria-label="Periodo activo"
              type="month"
              value={monthInput}
              onChange={(event) => handleMonthChange(event.target.value)}
            />
            <p className="text-right text-[10px] font-medium text-textMuted">{readableDate(period.periodStart)} - {readableDate(period.periodEnd)}</p>
          </div>
          <NavLink
            to="/notifications"
            className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-surfaceElevated text-textSecondary transition hover:border-accent/70 hover:text-textPrimary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label="Ver notificaciones"
            title="Ver notificaciones"
          >
            <Bell className="h-4 w-4" />
          </NavLink>
          <button className="flex items-center gap-3 rounded-lg border border-border bg-surfaceElevated px-3 py-2 text-left transition hover:border-accent/60" title="Perfil">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-deepBlue text-xs font-bold text-accent">{initials}</span>
            <span>
              <span className="block max-w-36 truncate text-sm font-semibold text-textPrimary">{displayName}</span>
              <span className="block text-xs text-textMuted">Perfil</span>
            </span>
          </button>
          <Button variant="ghost" className="h-10 w-10 p-0" onClick={() => void signOut()} aria-label="Salir" title="Salir">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <header className="sticky top-0 z-30 border-b border-border bg-surface/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Button className="h-10 w-10 shrink-0 p-0" variant="secondary" onClick={() => setMobileOpen(true)} aria-label="Abrir menú">
              <Menu className="h-5 w-5" />
            </Button>
            <BrandSolo variant="mobile" />
          </div>
          <div className="grid justify-items-end gap-1">
            <input
              className="nexo-input h-10 max-w-36 px-3"
              aria-label="Periodo activo"
              type="month"
              value={monthInput}
              onChange={(event) => handleMonthChange(event.target.value)}
            />
            <p className="max-w-36 truncate text-[10px] font-medium text-textMuted">{readableDate(period.periodStart)} - {readableDate(period.periodEnd)}</p>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-background/85 p-4 backdrop-blur lg:hidden">
          <div className="nexo-card h-full overflow-auto p-4">
            <div className="mb-4 flex items-center justify-between">
              <BrandSolo variant="mobile" />
              <Button variant="ghost" className="h-10 w-10 p-0" onClick={() => setMobileOpen(false)} aria-label="Cerrar menú">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <NavItems onNavigate={() => setMobileOpen(false)} />
            <Button className="mt-5 w-full" variant="secondary" icon={<LogOut className="h-4 w-4" />} onClick={() => void signOut()}>
              Salir
            </Button>
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-4 border-t border-border bg-surface/95 px-2 py-2 backdrop-blur lg:hidden">
        {bottomNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `grid place-items-center gap-1 rounded-lg px-1 py-2 text-center text-[10px] font-medium ${
                isActive ? 'bg-accent text-background' : 'text-textMuted'
              }`
            }
          >
            <item.icon className="h-4 w-4" />
            <span className="leading-tight">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
