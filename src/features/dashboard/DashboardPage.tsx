import { AlertTriangle, CheckCircle2, CreditCard, FolderPlus, ReceiptText, Sparkles, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { MetricCard } from '../../components/dashboard/MetricCard';
import { CategoryChart, IncomeDebtChart } from '../../components/charts/FinanceCharts';
import {
  getCurrentBalanceWithoutDebt,
  getCurrentIncome,
  getExpectedBalanceWithoutDebt,
  getExpectedIncome,
  getFreeBalance,
  getOverdueItems,
  getPendingTotal,
  getTotalDebt,
  getTotalPaid,
  getUpcomingItems,
} from '../../lib/calculations';
import { daysUntil, readableDate } from '../../lib/dates';
import { formatCurrency } from '../../lib/formatters';
import { useFinance } from '../../hooks/useFinance';
import { useToast } from '../../components/ui/Toast';

function MiniStat({ icon, title, value, subtitle }: { icon: React.ReactNode; title: string; value: string; subtitle: string }) {
  return (
    <div className="nexo-card flex items-center gap-4 p-4">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-accent/12 text-accent">{icon}</div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-textPrimary">{value}</p>
        <p className="text-sm text-textSecondary">{title}</p>
        <p className="text-xs text-textMuted">{subtitle}</p>
      </div>
    </div>
  );
}

function OnboardingStep({
  icon,
  step,
  title,
  text,
  action,
}: {
  icon: React.ReactNode;
  step: string;
  title: string;
  text: string;
  action: React.ReactNode;
}) {
  return (
    <div className="nexo-card flex flex-col p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent/10 text-accent">{icon}</div>
        <span className="rounded-full border border-border bg-surfaceElevated px-2.5 py-1 text-xs font-semibold text-textSecondary">{step}</span>
      </div>
      <h3 className="mt-4 text-base font-semibold text-textPrimary">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-textMuted">{text}</p>
      <div className="mt-5">{action}</div>
    </div>
  );
}

export function DashboardPage() {
  const finance = useFinance();
  const toast = useToast();
  const navigate = useNavigate();
  const { items, incomes, payments, cards, monthlySetting, loading } = finance;
  const currentIncome = getCurrentIncome(incomes);
  const expectedIncome = getExpectedIncome(incomes);
  const debtTotal = getTotalDebt(items);
  const paidTotal = getTotalPaid(payments);
  const pendingTotal = getPendingTotal(items);
  const currentBalance = getCurrentBalanceWithoutDebt(currentIncome, debtTotal);
  const expectedBalance = getExpectedBalanceWithoutDebt(expectedIncome, debtTotal);
  const designated = Number(monthlySetting?.daily_designated_money ?? 0);
  const freeCurrent = getFreeBalance(currentBalance, designated);
  const freeExpected = getFreeBalance(expectedBalance, designated);
  const overdue = getOverdueItems(items);
  const upcoming = getUpcomingItems(items, 3);
  const cardsTotal = cards.reduce((sum, card) => sum + Number(card.current_amount), 0);
  const hasFinancialData = incomes.length > 0 || items.length > 0 || cards.length > 0 || payments.length > 0;
  const hasChartData = currentIncome > 0 || expectedIncome > 0 || debtTotal > 0;

  const createCategories = async () => {
    await finance.createDefaultCategories();
    toast.success('Categorías recomendadas creadas');
  };

  if (loading) return <p className="text-textMuted">Cargando inicio...</p>;

  if (!hasFinancialData) {
    return (
      <div className="grid gap-6">
        <PageHeader
          title="Inicio"
          description="Configura la base de tu mes para que Corvo pueda calcular saldo disponible, vencimientos y reportes."
        />
        <section className="nexo-card p-5 sm:p-6">
          <div className="max-w-2xl">
            <h2 className="text-xl font-bold text-textPrimary">Configura Corvo en 3 pasos</h2>
            <p className="mt-2 text-sm leading-6 text-textMuted">
              Agrega tus ingresos, pagos y categorías para empezar a ver tu resumen financiero.
            </p>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <OnboardingStep
              step="Paso 1"
              icon={<Wallet className="h-5 w-5" />}
              title="Agrega tu ingreso mensual"
              text="Esto permite calcular tu saldo disponible."
              action={<Button className="w-full" onClick={() => navigate('/incomes')}>Agregar ingreso</Button>}
            />
            <OnboardingStep
              step="Paso 2"
              icon={<ReceiptText className="h-5 w-5" />}
              title="Registra tus pagos o deudas"
              text="Agrega servicios, préstamos, tarjetas o suscripciones."
              action={<Button className="w-full" variant="secondary" onClick={() => navigate('/credits')}>Agregar deuda o pago</Button>}
            />
            <OnboardingStep
              step="Paso 3"
              icon={<FolderPlus className="h-5 w-5" />}
              title="Crea categorías recomendadas"
              text="Organiza tus cuentas y mejora tus reportes."
              action={<Button className="w-full" variant="secondary" onClick={() => void createCategories()}>Crear categorías recomendadas</Button>}
            />
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Inicio"
        description="Resumen del mes activo con ingresos, pagos pendientes, vencimientos y saldo disponible."
        action={<Button variant="secondary" icon={<Sparkles className="h-4 w-4" />}>Generar reporte</Button>}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Ingreso actual" value={currentIncome} icon={<TrendingUp className="h-5 w-5" />} />
        <MetricCard label="Ingreso esperado" value={expectedIncome} icon={<Wallet className="h-5 w-5" />} />
        <MetricCard label="Total de deudas" value={debtTotal} tone="red" icon={<TrendingDown className="h-5 w-5" />} />
        <MetricCard label="Saldo libre actual" value={freeCurrent} tone={freeCurrent >= 0 ? 'green' : 'red'} icon={<ReceiptText className="h-5 w-5" />} />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat icon={<CheckCircle2 className="h-6 w-6" />} title="Total pagado" value={formatCurrency(paidTotal)} subtitle={`${payments.length} pagos registrados`} />
        <MiniStat icon={<AlertTriangle className="h-6 w-6" />} title="Total pendiente" value={formatCurrency(pendingTotal)} subtitle={`${upcoming.length} vencen pronto`} />
        <MiniStat icon={<CreditCard className="h-6 w-6" />} title="Tarjetas de crédito" value={formatCurrency(cardsTotal)} subtitle={`${cards.length} productos`} />
        <MiniStat icon={<Wallet className="h-6 w-6" />} title="Saldo libre esperado" value={formatCurrency(freeExpected)} subtitle={`Base ${formatCurrency(expectedBalance)}`} />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card title="Deudas por categoría" subtitle="Distribución del mes activo">
          {items.length ? (
            <CategoryChart items={items} />
          ) : (
            <EmptyState title="Sin deudas para graficar" description="Cuando registres pagos o deudas, verás su distribución por categoría." />
          )}
        </Card>
        <Card title="Ingresos vs deudas" subtitle="Comparativo actual y esperado">
          {hasChartData ? (
            <IncomeDebtChart currentIncome={currentIncome} expectedIncome={expectedIncome} debtTotal={debtTotal} />
          ) : (
            <EmptyState title="Aún no hay datos comparables" description="Agrega ingresos o deudas para generar esta gráfica." />
          )}
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <Card
          title="Próximos pagos"
          subtitle="Vencen en tres días o menos"
          action={
            <Link to="/calendar" className="text-sm font-semibold text-accent hover:text-cyan-100">
              Ver calendario
            </Link>
          }
        >
          <div className="grid gap-3">
            {upcoming.length ? (
              upcoming.slice(0, 6).map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/55 p-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-textPrimary">{item.description}</p>
                    <p className="text-sm text-textMuted">{readableDate(item.due_date)} · {daysUntil(item.due_date)} días</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-textPrimary">{formatCurrency(item.amount)}</p>
                    <StatusBadge status="soon" />
                  </div>
                </div>
              ))
            ) : (
              <EmptyState title="Sin alertas próximas" description="No hay pagos a tres días o menos." />
            )}
          </div>
        </Card>

        <Card title="Pagos vencidos" subtitle="Pendientes con fecha anterior a hoy">
          <div className="grid gap-3">
            {overdue.length ? (
              overdue.slice(0, 6).map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-danger/30 bg-dangerSurface p-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-textPrimary">{item.description}</p>
                    <p className="text-sm text-red-100/80">{readableDate(item.due_date)}</p>
                  </div>
                  <p className="font-semibold text-textPrimary">{formatCurrency(item.amount)}</p>
                </div>
              ))
            ) : (
              <EmptyState title="Nada vencido" description="No tienes pagos atrasados en este mes." />
            )}
          </div>
        </Card>

        <Card title="Resumen tarjetas" subtitle="Productos registrados">
          <div className="grid gap-3">
            {cards.length ? (
              cards.map((card) => (
                <div key={card.id} className="rounded-lg border border-border bg-background/55 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-textPrimary">{card.name}</p>
                    <StatusBadge status={card.status} />
                  </div>
                  <p className="mt-2 text-xl font-bold text-textPrimary">{formatCurrency(card.current_amount)}</p>
                  <p className="text-sm text-textMuted">{card.bank || 'Sin banco'} · {readableDate(card.payment_date)}</p>
                </div>
              ))
            ) : (
              <EmptyState title="Sin tarjetas" description="Registra tarjetas para monitorear sus pagos." />
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}
