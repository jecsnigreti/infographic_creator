import { verifyJWT } from '../auth/crypto.js';
import { getStripe, jsonResponse } from '../../lib/stripe.js';

export async function onRequestPost({ request, env }) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonResponse({ message: 'Nincs bejelentkezési token megadva.' }, 401);
  }
  const jwtSecret = env.JWT_SECRET || 'local_dev_fallback_secret_key_123456789';
  const payload = await verifyJWT(authHeader.substring(7), jwtSecret);
  if (!payload) {
    return jsonResponse({ message: 'Érvénytelen vagy lejárt bejelentkezési munkamenet.' }, 401);
  }

  if (!env.STRIPE_PRICE_ID_PRO) {
    return jsonResponse({ message: 'A fizetés még nincs beállítva a szerveren (hiányzó STRIPE_PRICE_ID_PRO).' }, 500);
  }

  try {
    const user = await env.DB.prepare('SELECT id, email, stripe_customer_id FROM users WHERE id = ? LIMIT 1')
      .bind(payload.sub)
      .first();
    if (!user) return jsonResponse({ message: 'Felhasználó nem található.' }, 404);

    const stripe = getStripe(env);
    const origin = new URL(request.url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: env.STRIPE_PRICE_ID_PRO, quantity: 1 }],
      customer: user.stripe_customer_id || undefined,
      customer_email: user.stripe_customer_id ? undefined : user.email,
      client_reference_id: user.id,
      subscription_data: { metadata: { userId: user.id } },
      success_url: `${origin}/?upgraded=1`,
      cancel_url: `${origin}/`
    });

    return jsonResponse({ url: session.url });
  } catch (err) {
    return jsonResponse({ message: 'Hiba a fizetés indításakor: ' + err.message }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    }
  });
}
