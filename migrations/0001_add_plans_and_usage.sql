-- Adds plan tracking to existing users and a usage-events table for metering.
-- Run once against the live DB with:
--   npx wrangler d1 execute web-infografika-db --remote --file=migrations/0001_add_plans_and_usage.sql

ALTER TABLE users ADD COLUMN plan TEXT NOT NULL DEFAULT 'free';
-- SQLite's ADD COLUMN only allows constant defaults, not CURRENT_TIMESTAMP - this stays NULL for
-- existing rows and is only meaningful once a plan actually changes.
ALTER TABLE users ADD COLUMN plan_updated_at DATETIME;

CREATE TABLE IF NOT EXISTS usage_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_usage_events_user_action_time ON usage_events(user_id, action, created_at);
