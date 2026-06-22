import { Navigate, Route, Routes } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { LoginPage, RegisterPage } from '../features/auth/AuthPages';
import { useAuth } from '../features/auth/AuthProvider';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { FinancialItemsPage } from '../features/financial-items/FinancialItemsPage';
import { CalendarPage } from '../features/financial-items/CalendarPage';
import { CreditCardsPage } from '../features/credit-cards/CreditCardsPage';
import { IncomesPage } from '../features/incomes/IncomesPage';
import { PocketsPage } from '../features/pockets/PocketsPage';
import { PaidPage } from '../features/payments/PaidPage';
import { NotificationsPage } from '../features/notifications/NotificationsPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { FinanceProvider } from '../hooks/useFinance';
import { activeSalaryCycleMonth, monthISO } from '../lib/dates';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center text-textMuted">Cargando Corvo...</div>;
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

export function App() {
  const { profile } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(monthISO());
  const [userSelectedPeriod, setUserSelectedPeriod] = useState(false);

  useEffect(() => {
    if (userSelectedPeriod) return;
    const activeMonth = activeSalaryCycleMonth(new Date(), profile?.salary_cycle_day ?? 1, profile?.salary_adjusts_to_business_day ?? true);
    setSelectedMonth(activeMonth);
  }, [profile?.salary_adjusts_to_business_day, profile?.salary_cycle_day, userSelectedPeriod]);

  const handleMonthChange = (month: string) => {
    setUserSelectedPeriod(true);
    setSelectedMonth(month);
  };

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        element={
          <ProtectedRoute>
            <FinanceProvider selectedMonth={selectedMonth}>
              <AppLayout selectedMonth={selectedMonth} onMonthChange={handleMonthChange} />
            </FinanceProvider>
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route
          path="/expenses"
          element={
            <FinancialItemsPage
              title="Pagos fijos"
              description="Registra servicios, suscripciones, impuestos y pagos recurrentes del mes."
              primaryActionLabel="Agregar pago fijo"
              emptyTitle="Aún no tienes pagos registrados"
              emptyDescription="Agrega servicios, suscripciones o impuestos para verlos en tu calendario mensual."
              emptyActionLabel="Agregar primer pago"
            />
          }
        />
        <Route path="/incomes" element={<IncomesPage />} />
        <Route path="/pockets" element={<PocketsPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/settings" element={<SettingsPage />} />

        <Route path="/accounts" element={<Navigate to="/expenses" replace />} />
        <Route path="/services" element={<Navigate to="/expenses" replace />} />
        <Route path="/subscriptions" element={<Navigate to="/expenses" replace />} />
        <Route path="/taxes" element={<Navigate to="/expenses" replace />} />
        <Route path="/fixed-costs" element={<Navigate to="/expenses" replace />} />
        <Route path="/credit-cards" element={<CreditCardsPage />} />
        <Route path="/paid" element={<PaidPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
