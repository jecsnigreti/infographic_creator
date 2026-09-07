import { getStripe } from '../../lib/stripe.js';

// Stripe webhook - NOT protected by our own JWT auth. Trust comes entirely from verifying the
// Stripe-Signature header against STRIPE_WEBHOOK_SECRET, which requires the exact raw request
// body (hence reading it as text before anything else touches it).
export async function onRequestPost({ request, env }) {
  const signature = request.headers.get('stripe-signature');
  if (!signature || !env.STRIPE_WEBHOOK_SECRET) {
    return new Response('Missing signature or webhook secret', { status: 400 });
  }

  const rawBody = await request.text();
  const stripe = getStripe(env);

  let event;
  try {
    // constructEventAsync (not the sync constructEvent) is required on Workers, which only has
    // the async Web Crypto API available for the signature check.
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return new Response(`Webhook signature verification failed: ${err.message}`, { status: 400 });
  }

  const nowIso = new Date().toISOString();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.client_reference_id;
        if (userId) {
          await env.DB.prepare(
            'UPDATE users SET plan = ?, plan_updated_at = ?, stripe_customer_id = ?, stripe_subscription_id = ? WHERE id = ?'
          ).bind('pro', nowIso, session.customer, session.subscription, userId).run();
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const isActive = sub.status === 'active' || sub.status === 'trialing';
        await env.DB.prepare(
          'UPDATE users SET plan = ?, plan_updated_at = ?, stripe_subscription_id = ? WHERE stripe_customer_id = ?'
        ).bind(isActive ? 'pro' : 'free', nowIso, sub.id, sub.customer).run();
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        await env.DB.prepare(
          'UPDATE users SET plan = ?, plan_updated_at = ? WHERE stripe_customer_id = ?'
        ).bind('free', nowIso, sub.customer).run();
        break;
      }
      default:
        break;
    }
  } catch (err) {
    return new Response(`Webhook handler error: ${err.message}`, { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
