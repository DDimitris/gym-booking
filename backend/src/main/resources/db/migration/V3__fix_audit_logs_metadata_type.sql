-- Fix metadata column type from JSONB to TEXT
ALTER TABLE audit_logs ALTER COLUMN metadata TYPE TEXT;
