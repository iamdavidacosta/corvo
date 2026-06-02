import { RotateCcw } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/PageHeader';
import { useToast } from '../../components/ui/Toast';
import { readableDate } from '../../lib/dates';
import { formatCurrency } from '../../lib/formatters';
import { useFinance } from '../../hooks/useFinance';

export function PaidPage() {
  const finance = useFinance();
  const toast = useToast();

  const revert = async (paymentId: string) => {
    const payment = finance.payments.find((item) => item.id === paymentId);
    if (!payment) return;
    await finance.revertPayment(payment);
    toast.success('Pago revertido');
  };

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Pagos registrados"
        description="Histórico mensual de pagos realizados y opción de reversión."
      />
      {finance.payments.length ? (
        <Card>
          <div className="hidden overflow-x-auto md:block">
            <table className="nexo-table">
              <thead>
                <tr>
                  <th>Descripción</th>
                  <th>Categoría</th>
                  <th>Fecha de pago</th>
                  <th>Fecha real</th>
                  <th>Valor</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {finance.payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{payment.financial_items?.description ?? 'Pago'}</td>
                    <td>{payment.financial_items?.categories?.name ?? 'Sin categoría'}</td>
                    <td>{readableDate(payment.original_due_date)}</td>
                    <td>{readableDate(payment.paid_at)}</td>
                    <td>{formatCurrency(payment.amount)}</td>
                    <td>
                      <Button variant="secondary" onClick={() => void revert(payment.id)} icon={<RotateCcw className="h-4 w-4" />}>Revertir</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 md:hidden">
            {finance.payments.map((payment) => (
              <div key={payment.id} className="rounded-lg border border-border bg-background/55 p-4">
                <p className="font-semibold text-textPrimary">{payment.financial_items?.description ?? 'Pago'}</p>
                <p className="text-sm text-textMuted">{payment.financial_items?.categories?.name ?? 'Sin categoría'} · {readableDate(payment.paid_at)}</p>
                <p className="mt-3 text-xl font-bold text-textPrimary">{formatCurrency(payment.amount)}</p>
                <Button className="mt-4 w-full" variant="secondary" onClick={() => void revert(payment.id)} icon={<RotateCcw className="h-4 w-4" />}>Revertir</Button>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <EmptyState title="Sin pagos registrados" description="Cuando marques un pago como pagado aparecerá aquí." />
      )}
    </div>
  );
}
