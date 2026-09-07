import Stripe from 'stripe';

// Cloudflare Workers has no Node runtime, so Stripe's SDK needs its fetch-based HTTP client
// (the officially documented way to use stripe-node on Workers/edge runtimes) instead of the
// default Node http client.
export function getStripe(env) {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY nincs beállítva a szerveren.');
  }
  return new Stripe(env.STRIPE_SECRET_KEY, {
    httpClient: Stripe.createFetchHttpClient(),
    apiVersion: '2024-06-20'
  });
}

export function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}
