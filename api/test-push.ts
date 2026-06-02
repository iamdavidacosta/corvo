import webpush from 'web-push';
import { configureWebPush, getServerSupabase, type ApiRequest, type ApiResponse } from './_shared';

type PushRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  const authorization = req.headers.authorization;
  const token = typeof authorization === 'string' ? authorization.replace('Bearer ', '') : undefined;
  if (!token) {
    res.status(401).json({ error: 'Token requerido' });
    return;
  }

  try {
    configureWebPush();
    const supabase = getServerSupabase();
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData.user) {
      res.status(401).json({ error: 'Sesión inválida' });
      return;
    }

    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', authData.user.id)
      .eq('is_active', true);
    if (error) throw error;
    if (!subscriptions?.length) {
      res.status(404).json({ error: 'No hay suscripciones activas' });
      return;
    }

    await Promise.all(
      (subscriptions as PushRow[]).map((subscription) =>
        webpush.sendNotification(
          { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
          JSON.stringify({
            title: 'Corvo activo',
            body: 'Las notificaciones push están funcionando.',
            url: '/notifications',
          }),
        ),
      ),
    );

    res.status(200).json({ ok: true, sent: subscriptions.length });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Error enviando prueba' });
  }
}
