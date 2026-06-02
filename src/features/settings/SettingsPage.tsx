import { zodResolver } from '@hookform/resolvers/zod';
import { Download, RefreshCcw, Save, Sparkles } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Field, SelectInput, TextAreaInput, TextInput } from '../../components/ui/Form';
import { PageHeader } from '../../components/ui/PageHeader';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../../lib/supabase';
import { profileSchema, monthlySettingSchema, type MonthlySettingFormValues, type ProfileFormValues } from '../../lib/validations';
import { useFinance } from '../../hooks/useFinance';

function downloadFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeCsv(value: unknown) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

export function SettingsPage() {
  const { profile, user, refreshProfile } = useAuth();
  const finance = useFinance();
  const toast = useToast();
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: '',
      currency: 'COP',
      notification_days_before: 3,
      preferred_notification_time: '08:00',
      notifications_enabled: true,
    },
  });
  const monthlyForm = useForm<MonthlySettingFormValues>({
    resolver: zodResolver(monthlySettingSchema),
    defaultValues: { daily_designated_money: 0, notes: '' },
  });

  useEffect(() => {
    profileForm.reset({
      full_name: profile?.full_name ?? '',
      currency: profile?.currency ?? 'COP',
      notification_days_before: profile?.notification_days_before ?? 3,
      preferred_notification_time: profile?.preferred_notification_time?.slice(0, 5) ?? '08:00',
      notifications_enabled: profile?.notifications_enabled ?? true,
    });
  }, [profile, profileForm]);

  useEffect(() => {
    monthlyForm.reset({
      daily_designated_money: Number(finance.monthlySetting?.daily_designated_money ?? 0),
      notes: finance.monthlySetting?.notes ?? '',
    });
  }, [finance.monthlySetting, monthlyForm]);

  const saveProfile = (message: string) =>
    profileForm.handleSubmit(async (values) => {
      if (!user) return;
      const { error } = await supabase
        .from('profiles')
        .update({ ...values, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success(message);
    });

  const saveMonthly = monthlyForm.handleSubmit(async (values) => {
    await finance.saveMonthlySetting(values);
    toast.success('Presupuesto guardado');
  });

  const exportCsv = () => {
    const rows = [
      ['tipo', 'descripcion', 'categoria', 'valor', 'fecha', 'estado'],
      ...finance.items.map((item) => ['pago', item.description, item.categories?.name ?? '', item.amount, item.due_date, item.status]),
      ...finance.incomes.map((income) => ['ingreso', income.name, income.income_type, income.amount, income.month ?? '', income.is_active ? 'activo' : 'inactivo']),
      ...finance.cards.map((card) => ['tarjeta', card.name, card.bank ?? '', card.current_amount, card.payment_date ?? '', card.status]),
      ...finance.payments.map((payment) => ['pago registrado', payment.financial_items?.description ?? '', payment.financial_items?.categories?.name ?? '', payment.amount, payment.paid_at, 'pagado']),
    ];
    downloadFile(`corvo-${finance.selectedMonth}.csv`, rows.map((row) => row.map(escapeCsv).join(',')).join('\n'));
  };

  const loadDemo = async () => {
    await finance.loadDemoData();
    toast.success('Datos de prueba cargados');
  };

  const createCategories = async () => {
    await finance.createDefaultCategories();
    toast.success('Categorías recomendadas creadas');
  };

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Configuración"
        description="Ajusta tu perfil, recordatorios, presupuesto mensual y herramientas de mantenimiento."
      />

      <section className="grid items-start gap-6 lg:grid-cols-2">
        <Card title="Perfil">
          <form className="grid gap-4" onSubmit={saveProfile('Perfil guardado')}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre" error={profileForm.formState.errors.full_name?.message}>
                <TextInput placeholder="Tu nombre" {...profileForm.register('full_name')} />
              </Field>
              <Field label="Moneda" error={profileForm.formState.errors.currency?.message}>
                <SelectInput {...profileForm.register('currency')}>
                  <option value="COP">COP</option>
                </SelectInput>
              </Field>
            </div>
            <div className="flex justify-end">
              <Button type="submit" variant="secondary" icon={<Save className="h-4 w-4" />} isLoading={profileForm.formState.isSubmitting}>Guardar perfil</Button>
            </div>
          </form>
        </Card>

        <Card title="Recordatorios">
          <form className="grid gap-4" onSubmit={saveProfile('Recordatorios guardados')}>
            <label className="flex items-center gap-3 text-sm text-textSecondary">
              <input className="h-4 w-4 accent-accent" type="checkbox" {...profileForm.register('notifications_enabled')} />
              Activar recordatorios
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Hora para recordatorios" error={profileForm.formState.errors.preferred_notification_time?.message}>
                <TextInput type="time" {...profileForm.register('preferred_notification_time')} />
              </Field>
              <Field label="Avisar con cuántos días de anticipación" error={profileForm.formState.errors.notification_days_before?.message}>
                <TextInput type="number" min="1" max="15" {...profileForm.register('notification_days_before')} />
              </Field>
            </div>
            <div className="flex justify-end">
              <Button type="submit" variant="secondary" icon={<Save className="h-4 w-4" />} isLoading={profileForm.formState.isSubmitting}>Guardar recordatorios</Button>
            </div>
          </form>
        </Card>

        <Card title="Presupuesto mensual">
          <form className="grid gap-4" onSubmit={saveMonthly}>
            <Field label="Presupuesto diario disponible" error={monthlyForm.formState.errors.daily_designated_money?.message}>
              <TextInput type="number" min="0" step="100" {...monthlyForm.register('daily_designated_money')} />
            </Field>
            <Field label="Notas o metas del mes" error={monthlyForm.formState.errors.notes?.message}>
              <TextAreaInput placeholder="Metas, límites o recordatorios para este mes" {...monthlyForm.register('notes')} />
            </Field>
            <div className="flex justify-end">
              <Button type="submit" icon={<Save className="h-4 w-4" />} isLoading={monthlyForm.formState.isSubmitting}>Guardar presupuesto</Button>
            </div>
          </form>
        </Card>

        <Card title="Datos y mantenimiento">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button variant="secondary" icon={<Download className="h-4 w-4" />} onClick={exportCsv}>Exportar CSV</Button>
            <Button variant="secondary" icon={<Sparkles className="h-4 w-4" />} onClick={() => void createCategories()}>Crear categorías recomendadas</Button>
          </div>
        </Card>
      </section>

      <section className="rounded-lg border border-danger/35 bg-dangerSurface p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-textPrimary">Acciones peligrosas</h2>
            <p className="mt-1 text-sm text-textMuted">Estas acciones pueden modificar o borrar datos. Úsalas con cuidado.</p>
          </div>
          <Button variant="danger" icon={<RefreshCcw className="h-4 w-4" />} onClick={() => void loadDemo()}>Borrar datos de prueba</Button>
        </div>
      </section>
    </div>
  );
}
