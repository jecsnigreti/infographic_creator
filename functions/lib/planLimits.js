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
  const row = await env.DB.prepare('SELECT plan FROM users WHERE id = ? LIMIT 1').bind(userId).first();
  return (row && row.plan) || 'free';
}
