import { Bell, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/PageHeader';
import { useToast } from '../../components/ui/Toast';
import { getOverdueItems, getUpcomingItems } from '../../lib/calculations';
import { getPushSupport, sendTestPush, subscribeToPush } from '../../lib/push';
import { readableDate } from '../../lib/dates';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import { useFinance } from '../../hooks/useFinance';
import type { NotificationLog } from '../../types';

export function NotificationsPage() {
  const { user, session, profile } = useAuth();
  const finance = useFinance();
  const toast = useToast();
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [permission, setPermission] = useState(() => ('Notification' in window ? Notification.permission : 'unsupported'));
  const support = getPushSupport();
  const upcoming = getUpcomingItems(finance.items, profile?.notification_days_before ?? 3);
  const overdue = getOverdueItems(finance.items);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('notification_logs')
      .select('*, financial_items(*)')
      .eq('user_id', user.id)
      .order('sent_at', { ascending: false })
      .limit(20)
      .then(({ data }) => setLogs((data ?? []) as NotificationLog[]));
  }, [user, finance.items]);

  const activate = async () => {
    if (!user) return;
    try {
      await subscribeToPush(user.id);
      setPermission(Notification.permission);
      toast.success('Notificaciones activadas');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudieron activar');
    }
  };

  const test = async () => {
    if (!session) return;
    try {
      await sendTestPush(session.access_token);
      toast.success('Notificación de prueba enviada');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo probar');
    }
  };

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Centro de notificaciones"
        description="Recordatorios push y respaldo interno para pagos próximos o vencidos."
      />
      <Card title="Estado push">
        <div className="grid gap-4 md:grid-cols-[1fr_auto_auto] md:items-center">
          <div>
            <p className="font-semibold text-textPrimary">{support.supported ? `Permiso: ${permission}` : 'Push no soportado por este navegador'}</p>
            <p className="mt-1 text-sm text-textMuted">
              Service Worker: {support.serviceWorker ? 'sí' : 'no'} · Push API: {support.pushManager ? 'sí' : 'no'} · Notification: {support.notification ? 'sí' : 'no'}
            </p>
          </div>
          <Button onClick={activate} icon={<Bell className="h-4 w-4" />} disabled={!support.supported}>Activar notificaciones</Button>
          <Button variant="secondary" onClick={test} icon={<Send className="h-4 w-4" />} disabled={!support.supported}>Probar notificación</Button>
        </div>
      </Card>
      <section className="grid gap-6 xl:grid-cols-3">
        <Card title="Recordatorios próximos">
          <div className="grid gap-3">
            {upcoming.length ? upcoming.map((item) => <p key={item.id} className="rounded-lg border border-warning/25 bg-warning/10 p-3 text-sm">{item.description} · {readableDate(item.due_date)}</p>) : <EmptyState title="Sin próximos" description="No hay recordatorios próximos." />}
          </div>
        </Card>
        <Card title="Pagos vencidos">
          <div className="grid gap-3">
            {overdue.length ? overdue.map((item) => <p key={item.id} className="rounded-lg border border-danger/25 bg-danger/10 p-3 text-sm">{item.description} · {readableDate(item.due_date)}</p>) : <EmptyState title="Sin vencidos" description="No tienes pagos vencidos." />}
          </div>
        </Card>
        <Card title="Notificaciones enviadas">
          <div className="grid gap-3">
            {logs.length ? logs.map((log) => <p key={log.id} className="rounded-lg border border-border bg-background/55 p-3 text-sm">{log.financial_items?.description ?? log.notification_type} · {readableDate(log.scheduled_for)}</p>) : <EmptyState title="Sin registros" description="Los envíos aparecerán aquí." />}
          </div>
        </Card>
      </section>
    </div>
  );
}
