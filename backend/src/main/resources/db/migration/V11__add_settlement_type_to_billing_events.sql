-- Add settlement_type column to billing_events for payment vs bonus tracking
ALTER TABLE billing_events
    ADD COLUMN IF NOT EXISTS settlement_type VARCHAR(20) NOT NULL DEFAULT 'NONE';
