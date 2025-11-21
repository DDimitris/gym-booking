-- Add wallet balance to users and create wallet_transactions table
ALTER TABLE users
    ADD COLUMN wallet_balance NUMERIC(10,2) DEFAULT 0 NOT NULL;

CREATE TABLE wallet_transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    amount NUMERIC(10,2) NOT NULL,
    type VARCHAR(50) NOT NULL,
    reference VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wallet_transactions_user ON wallet_transactions(user_id);
