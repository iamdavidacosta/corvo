import { CalendarDays, CreditCard, Home, Receipt, Settings, WalletCards } from 'lucide-react';

export const navItems = [
  { label: 'Inicio', path: '/dashboard', icon: Home },
  { label: 'Pagos fijos', path: '/expenses', icon: Receipt },
  { label: 'Ingresos', path: '/incomes', icon: WalletCards },
  { label: 'Deudas y tarjetas', path: '/credits', icon: CreditCard },
  { label: 'Calendario', path: '/calendar', icon: CalendarDays },
  { label: 'Configuración', path: '/settings', icon: Settings },
];

export const bottomNavItems = navItems;
