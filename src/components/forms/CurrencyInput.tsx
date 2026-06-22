import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import { useController } from 'react-hook-form';

type CurrencyInputProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  placeholder?: string;
};

function parseCurrency(value: string) {
  const digits = value.replace(/\D/g, '');
  return digits ? Number(digits) : 0;
}

function formatCurrencyInput(value: unknown) {
  const amount = Number(value ?? 0);
  if (!amount) return '';

  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace(/\s/g, '');
}

export function CurrencyInput<T extends FieldValues>({ control, name, placeholder = '$0' }: CurrencyInputProps<T>) {
  const { field } = useController({ control, name });

  return (
    <input
      className="nexo-input"
      inputMode="numeric"
      placeholder={placeholder}
      value={formatCurrencyInput(field.value)}
      onBlur={field.onBlur}
      onChange={(event) => field.onChange(parseCurrency(event.target.value))}
      name={field.name}
      ref={field.ref}
      type="text"
    />
  );
}
