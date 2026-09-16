// Shared plan definitions and usage-metering helpers. This file exports no onRequest* handler,
// so Cloudflare Pages Functions never routes it - it's just an importable module.

export const PLAN_LIMITS = {
  free: {
    label: 'Ingyenes',
    hostedLinksPerMonth: 3
  },
  pro: {
    label: 'Pro',
    hostedLinksPerMonth: Infinity
  }
};

export function getPlanLimits(plan) {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
}

// Accounts that always get Pro access regardless of what's stored in D1 or what Stripe reports -
// this is a permanent, code-level override (not a one-time DB edit), so it survives any future
// plan/webhook changes to these rows.
const FREE_ACCESS_EMAILS = new Set([
  'jecsni.greta@gmx.com',
  'jecsni.greti@gmail.com'
]);

export function resolvePlan(email, storedPlan) {
  if (email && FREE_ACCESS_EMAILS.has(String(email).toLowerCase())) return 'pro';
  return storedPlan || 'free';
}

function startOfCurrentMonthIso() {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function countMonthlyUsage(env, userId, action) {
  const row = await env.DB.prepare(
    'SELECT COUNT(*) as count FROM usage_events WHERE user_id = ? AND action = ? AND created_at >= ?'
  ).bind(userId, action, startOfCurrentMonthIso()).first();
  return row ? Number(row.count) : 0;
}

export async function logUsage(env, userId, action) {
  await env.DB.prepare('INSERT INTO usage_events (id, user_id, action) VALUES (?, ?, ?)')
    .bind(crypto.randomUUID(), userId, action)
    .run();
}

export async function getUserPlan(env, userId) {
  const row = await env.DB.prepare('SELECT plan, email FROM users WHERE id = ? LIMIT 1').bind(userId).first();
  if (!row) return 'free';
  return resolvePlan(row.email, row.plan);
}
