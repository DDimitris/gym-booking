-- Add new columns to users table for billing and OAuth
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'EMAIL',
    ADD COLUMN IF NOT EXISTS oauth_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS base_cost DECIMAL(10,2),
    ADD COLUMN IF NOT EXISTS bonus_days INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'ACTIVE';

-- Remove keycloak_id NOT NULL constraint if needed (for local auth)
ALTER TABLE users ALTER COLUMN keycloak_id DROP NOT NULL;

-- Create class_types table (Pilates, CrossFit, Yoga, etc.)
CREATE TABLE IF NOT EXISTS class_types (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

-- Add class_type_id to gym_classes (refactored to class_instances)
ALTER TABLE gym_classes
    ADD COLUMN IF NOT EXISTS class_type_id BIGINT REFERENCES class_types(id);

-- Rename gym_classes to class_instances for clarity
ALTER TABLE gym_classes RENAME TO class_instances;

-- Update capacity default to 5 (per spec)
ALTER TABLE class_instances
    ALTER COLUMN capacity SET DEFAULT 5;

-- Add location and status to class_instances
ALTER TABLE class_instances
    ADD COLUMN IF NOT EXISTS location VARCHAR(255),
    ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'SCHEDULED';

-- Rename schedules to better reflect it's schedule instances (or merge with class_instances)
-- For simplicity, merge schedule into class_instances
ALTER TABLE class_instances
    ADD COLUMN IF NOT EXISTS start_time TIMESTAMP,
    ADD COLUMN IF NOT EXISTS end_time TIMESTAMP,
    ADD COLUMN IF NOT EXISTS is_cancelled BOOLEAN DEFAULT FALSE;

-- Migrate data from schedules to class_instances if needed
-- (This is a placeholder - in real migration you'd handle existing data)

-- Drop old schedules table (after data migration in production)
-- DROP TABLE IF EXISTS schedules;

-- Update bookings to reference class_instances directly
ALTER TABLE bookings
    RENAME COLUMN schedule_id TO class_instance_id;

-- Add more booking statuses
-- Status: BOOKED, COMPLETED, CANCELLED_BY_USER, CANCELLED_BY_GYM

-- Create billing_events table
CREATE TABLE IF NOT EXISTS billing_events (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    booking_id BIGINT REFERENCES bookings(id),
    amount DECIMAL(10,2) NOT NULL,
    reason VARCHAR(255) NOT NULL,
    event_date TIMESTAMP NOT NULL,
    settled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_id BIGINT REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id BIGINT,
    metadata TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_class_types_name ON class_types(name);
CREATE INDEX IF NOT EXISTS idx_class_instances_type ON class_instances(class_type_id);
CREATE INDEX IF NOT EXISTS idx_class_instances_start_time ON class_instances(start_time);
CREATE INDEX IF NOT EXISTS idx_class_instances_status ON class_instances(status);
CREATE INDEX IF NOT EXISTS idx_billing_events_user ON billing_events(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_date ON billing_events(event_date);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

-- Insert default class types
INSERT INTO class_types (name, description, is_active, created_at)
VALUES 
    ('Pilates', 'Ενδυνάμωση κορμού και προπόνηση ευλυγισίας', TRUE, CURRENT_TIMESTAMP),
    ('Cross-Training', 'Υψηλής έντασης λειτουργική προπόνηση', TRUE, CURRENT_TIMESTAMP),
    ('OpenGym', 'Ελεύθερη χρήση γυμναστηρίου', TRUE, CURRENT_TIMESTAMP)
ON CONFLICT (name) DO NOTHING;
