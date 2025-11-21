-- Add updated_at column to wallet_transactions to match BaseEntity
ALTER TABLE wallet_transactions
    ADD COLUMN updated_at TIMESTAMP;

-- Ensure index exists for queries by user and maybe recent tx
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_created ON wallet_transactions(user_id, created_at DESC);
