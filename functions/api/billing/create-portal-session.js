import { verifyJWT } from '../auth/crypto.js';
import { getStripe, jsonResponse } from '../../lib/stripe.js';

// Lets a Pro subscriber manage or cancel their subscription via Stripe's own hosted portal,
// rather than us building account-management UI for it.
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

  try {
    const user = await env.DB.prepare('SELECT stripe_customer_id FROM users WHERE id = ? LIMIT 1')
      .bind(payload.sub)
      .first();
    if (!user || !user.stripe_customer_id) {
      return jsonResponse({ message: 'Nincs aktív előfizetésed.' }, 400);
    }

    const stripe = getStripe(env);
    const origin = new URL(request.url).origin;
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${origin}/`
    });

    return jsonResponse({ url: session.url });
  } catch (err) {
    return jsonResponse({ message: 'Hiba a fiókkezelő megnyitásakor: ' + err.message }, 500);
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
