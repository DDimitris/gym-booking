-- Migration kept as no-op because class_types no longer has instructor_id/trainer_id
DO $$
BEGIN
    -- Intentionally left blank to preserve migration history without applying changes
    NULL;
END $$;
