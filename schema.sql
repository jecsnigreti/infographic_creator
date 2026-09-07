CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  plan_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);

-- One row per metered action (e.g. "hosted_link_created"). Monthly usage is derived by counting
-- rows since the start of the current month, rather than a running counter column, so it resets
-- automatically without a cron job and stays auditable.
CREATE TABLE IF NOT EXISTS usage_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_usage_events_user_action_time ON usage_events(user_id, action, created_at);
