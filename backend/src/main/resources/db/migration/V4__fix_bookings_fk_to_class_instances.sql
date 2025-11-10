-- Fix bookings foreign key to reference class_instances instead of schedules
DO $$
BEGIN
  -- Drop old FK if it exists and points to schedules
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    WHERE tc.constraint_name = 'bookings_schedule_id_fkey'
      AND tc.table_name = 'bookings'
  ) THEN
    ALTER TABLE bookings DROP CONSTRAINT bookings_schedule_id_fkey;
  END IF;
END $$;

-- Ensure column is correctly named (it was renamed in V2) and create correct FK
ALTER TABLE bookings
  ADD CONSTRAINT bookings_class_instance_fk
  FOREIGN KEY (class_instance_id)
  REFERENCES class_instances(id)
  ON DELETE CASCADE;
