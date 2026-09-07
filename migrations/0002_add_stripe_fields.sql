-- Adds Stripe customer/subscription linkage so webhook events can find and update the right user.
-- Run once against the live DB with:
--   npx wrangler d1 execute web-infografika-db --remote --file=migrations/0002_add_stripe_fields.sql

ALTER TABLE users ADD COLUMN stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN stripe_subscription_id TEXT;
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);
