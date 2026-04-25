-- Add telegram_chat_id to users table for staff password reset via Telegram
ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT;
CREATE INDEX IF NOT EXISTS idx_users_telegram_chat_id ON users(telegram_chat_id);
