-- Add class kind to class_instances and per-kind base costs to users

-- 1) class_instances.kind
ALTER TABLE class_instances
    ADD COLUMN IF NOT EXISTS kind VARCHAR(32) NOT NULL DEFAULT 'GROUP';

-- 2) per-kind base costs on users
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS group_base_cost DECIMAL(10,2),
    ADD COLUMN IF NOT EXISTS small_group_base_cost DECIMAL(10,2),
    ADD COLUMN IF NOT EXISTS personal_base_cost DECIMAL(10,2),
    ADD COLUMN IF NOT EXISTS open_gym_base_cost DECIMAL(10,2);
