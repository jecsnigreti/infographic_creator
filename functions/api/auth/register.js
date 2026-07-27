import { hashPassword } from './crypto.js';

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
    const { username, password } = body;
    let { email } = body;
    
    if (!email || !username || !password) {
      return new Response(
        JSON.stringify({ error: "Kérlek töltsd ki az összes mezőt (email, felhasználónév, jelszó)." }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    email = email.trim().toLowerCase();
    
    // Check if email already exists
    const existingUser = await env.DB.prepare("SELECT id FROM users WHERE email = ? LIMIT 1")
      .bind(email)
      .first();
      
    if (existingUser) {
      return new Response(
        JSON.stringify({ error: "Ez az e-mail cím már regisztrálva van." }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Hash password
    const passwordHash = await hashPassword(password);
    const userId = crypto.randomUUID();
    
    // Insert new user
    await env.DB.prepare("INSERT INTO users (id, email, username, password_hash) VALUES (?, ?, ?, ?)")
      .bind(userId, email, username.trim(), passwordHash)
      .run();
      
    return new Response(
      JSON.stringify({ success: true, message: "Sikeres regisztráció! Most már bejelentkezhetsz." }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Hiba történt a regisztráció során: " + err.message }),
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
