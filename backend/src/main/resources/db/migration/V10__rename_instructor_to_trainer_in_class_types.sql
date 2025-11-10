-- Rename instructor_id to trainer_id in class_types and update index name
DO $$
BEGIN
    -- Rename column if exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='class_types' AND column_name='instructor_id'
    ) THEN
        ALTER TABLE class_types RENAME COLUMN instructor_id TO trainer_id;
    END IF;

    -- Drop old index if exists
    IF EXISTS (
        SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relkind = 'i' AND c.relname = 'idx_class_types_instructor'
    ) THEN
        DROP INDEX idx_class_types_instructor;
    END IF;

    -- Create new index if not exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relkind = 'i' AND c.relname = 'idx_class_types_trainer'
    ) THEN
        CREATE INDEX idx_class_types_trainer ON class_types(trainer_id);
    END IF;
END $$;
