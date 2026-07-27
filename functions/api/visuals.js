import { verifyJWT } from './auth/crypto.js';

function randomId() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 12);
}

const MAX_HTML_BYTES = 2_000_000;

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

  const origin = new URL(request.url).origin;
  return new Response(JSON.stringify({ id, url: `${origin}/v/${id}` }), {
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
