export const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

export function formatCurrency(value: number | string | null | undefined) {
  return currencyFormatter.format(Number(value ?? 0));
}

export function formatPercent(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'percent',
    maximumFractionDigits: 1,
  }).format(value);
}
