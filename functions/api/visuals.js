import { verifyJWT } from './auth/crypto.js';
import { getUserPlan, getPlanLimits, countMonthlyUsage, logUsage } from '../lib/planLimits.js';

function randomId() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 12);
}

const MAX_HTML_BYTES = 2_000_000;
const USAGE_ACTION = 'hosted_link_created';

export async function onRequestPost({ request, env }) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ message: 'Nincs bejelentkezési token megadva.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  const jwtSecret = env.JWT_SECRET || 'local_dev_fallback_secret_key_123456789';
  const payload = await verifyJWT(authHeader.substring(7), jwtSecret);
  if (!payload) {
    return new Response(JSON.stringify({ message: 'Érvénytelen vagy lejárt bejelentkezési munkamenet.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const plan = await getUserPlan(env, payload.sub);
  const limits = getPlanLimits(plan);
  const used = await countMonthlyUsage(env, payload.sub, USAGE_ACTION);
  if (used >= limits.hostedLinksPerMonth) {
    return new Response(JSON.stringify({
      message: `Elérted a(z) "${limits.label}" csomag havi limitjét (${limits.hostedLinksPerMonth} hosztolt link). Válts Pro csomagra a folytatáshoz.`,
      plan,
      used,
      limit: limits.hostedLinksPerMonth
    }), {
      status: 402,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let body;
  try {
    body = await request.json();
  } catch (err) {
    return new Response(JSON.stringify({ message: 'Érvénytelen kérés.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const html = body && body.html;
  if (!html || typeof html !== 'string' || html.length > MAX_HTML_BYTES) {
    return new Response(JSON.stringify({ message: 'Hiányzó vagy túl nagy tartalom.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const id = randomId();
  await env.VISUALS_KV.put(id, html, { metadata: { ownerId: payload.sub, createdAt: Date.now() } });
  await logUsage(env, payload.sub, USAGE_ACTION);

  const origin = new URL(request.url).origin;
  return new Response(JSON.stringify({ id, url: `${origin}/v/${id}`, plan, used: used + 1, limit: limits.hostedLinksPerMonth }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' }
  });
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
