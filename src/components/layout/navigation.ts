import { CalendarDays, Home, PiggyBank, Receipt, Settings, WalletCards } from 'lucide-react';

export const navItems = [
  { label: 'Inicio', path: '/dashboard', icon: Home },
  { label: 'Pagos fijos', path: '/expenses', icon: Receipt },
  { label: 'Bolsillos', path: '/pockets', icon: PiggyBank },
  { label: 'Ingresos', path: '/incomes', icon: WalletCards },
  { label: 'Calendario', path: '/calendar', icon: CalendarDays },
  { label: 'Configuración', path: '/settings', icon: Settings },
];

export const bottomNavItems = navItems;
