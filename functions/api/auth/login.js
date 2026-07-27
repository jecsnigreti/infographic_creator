import { verifyPassword, signJWT } from './crypto.js';

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    
    // Check D1 database binding
    if (!env.DB) {
      return new Response(
        JSON.stringify({ error: "D1 database connection is not bound as 'DB'." }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const body = await request.json();
    const { password } = body;
    let { email } = body;
    
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Kérlek add meg a bejelentkezési adatokat." }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    email = email.trim().toLowerCase();
    
    // Fetch user
    const user = await env.DB.prepare("SELECT * FROM users WHERE email = ? LIMIT 1")
      .bind(email)
      .first();
      
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Hibás e-mail cím vagy jelszó." }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return new Response(
        JSON.stringify({ error: "Hibás e-mail cím vagy jelszó." }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Generate JWT
    const jwtSecret = env.JWT_SECRET || "local_dev_fallback_secret_key_123456789";
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    };
    
    const token = await signJWT(payload, jwtSecret);
    
    return new Response(
      JSON.stringify({
        success: true,
        token: token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Hiba történt a bejelentkezés során: " + err.message }),
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
