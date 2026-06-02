import webpush from 'web-push';
import { addDaysISO, configureWebPush, getServerSupabase, type ApiRequest, type ApiResponse } from './_shared';

type Profile = {
  id: string;
  full_name: string | null;
  notification_days_before: number;
  notifications_enabled: boolean;
};

type FinancialItem = {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  due_date: string;
};

type PushRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json({ error: 'No autorizado' });
    return;
  }

  try {
    configureWebPush();
    const supabase = getServerSupabase();
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, notification_days_before, notifications_enabled')
      .eq('notifications_enabled', true);
    if (profileError) throw profileError;

    let sent = 0;
    let skipped = 0;

    for (const profile of (profiles ?? []) as Profile[]) {
      const scheduledFor = addDaysISO(new Date(), profile.notification_days_before ?? 3);
      const { data: items, error: itemsError } = await supabase
        .from('financial_items')
        .select('id, user_id, description, amount, due_date')
        .eq('user_id', profile.id)
        .eq('due_date', scheduledFor)
        .eq('is_active', true)
        .neq('status', 'paid')
        .neq('status', 'inactive');
      if (itemsError) throw itemsError;

      for (const item of (items ?? []) as FinancialItem[]) {
        const { data: existingLog } = await supabase
          .from('notification_logs')
          .select('id')
          .eq('user_id', profile.id)
          .eq('financial_item_id', item.id)
          .eq('notification_type', 'due_reminder')
          .eq('scheduled_for', scheduledFor)
          .maybeSingle();

        if (existingLog) {
          skipped += 1;
          continue;
        }

        const { data: subscriptions, error: subError } = await supabase
          .from('push_subscriptions')
          .select('endpoint, p256dh, auth')
          .eq('user_id', profile.id)
          .eq('is_active', true);
        if (subError) throw subError;

        for (const subscription of (subscriptions ?? []) as PushRow[]) {
          const payload = JSON.stringify({
            title: 'Pago próximo en Corvo',
            body: `${item.description} vence el ${item.due_date}.`,
            url: '/calendar',
          });

          try {
            await webpush.sendNotification(
              {
                endpoint: subscription.endpoint,
                keys: { p256dh: subscription.p256dh, auth: subscription.auth },
              },
              payload,
            );
            sent += 1;
          } catch (error) {
            if (typeof error === 'object' && error && 'statusCode' in error && Number(error.statusCode) === 410) {
              await supabase.from('push_subscriptions').update({ is_active: false }).eq('endpoint', subscription.endpoint);
            }
          }
        }

        await supabase.from('notification_logs').insert({
          user_id: profile.id,
          financial_item_id: item.id,
          notification_type: 'due_reminder',
          scheduled_for: scheduledFor,
          status: subscriptions?.length ? 'sent' : 'no_subscription',
        });
      }
    }

    res.status(200).json({ ok: true, sent, skipped });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Error enviando recordatorios' });
  }
}
