import { verifyJWT } from './crypto.js';

export async function onRequestGet(context) {
  try {
    const { request, env } = context;
    
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: "Nincs bejelentkezési token megadva." }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const token = authHeader.substring(7);
    const jwtSecret = env.JWT_SECRET || "local_dev_fallback_secret_key_123456789";
    
    const payload = await verifyJWT(token, jwtSecret);
    if (!payload) {
      return new Response(
        JSON.stringify({ error: "Érvénytelen vagy lejárt bejelentkezési munkamenet." }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: payload.sub,
          email: payload.email,
          username: payload.username
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Hiba történt a munkamenet ellenőrzésekor: " + err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Support preflight CORS options if needed
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
    }
  });
}
