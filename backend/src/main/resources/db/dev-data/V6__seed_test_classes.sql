-- DEV-ONLY: This content moved to version 1001 to avoid collision with main migrations.
-- Assumes users seeded in V5: admin id=1, instructors id=2,3
-- Uses existing class_types seeded in V2

-- Helper to select class type ids
WITH types AS (
  SELECT id, name FROM class_types WHERE name IN ('Yoga','CrossFit','Pilates','Spin')
)
INSERT INTO class_instances (name, class_type_id, description, capacity, duration_minutes, trainer_id, start_time, end_time, location, status, created_at)
VALUES
  ('Yoga', (SELECT id FROM types WHERE name='Yoga'), 'Morning Yoga flow', 12, 60, 2, NOW() + INTERVAL '1 day' + INTERVAL '08 hour', NOW() + INTERVAL '1 day' + INTERVAL '09 hour', 'Studio A', 'SCHEDULED', CURRENT_TIMESTAMP),
  ('CrossFit', (SELECT id FROM types WHERE name='CrossFit'), 'WOD: Metcon and strength', 10, 60, 3, NOW() + INTERVAL '1 day' + INTERVAL '18 hour', NOW() + INTERVAL '1 day' + INTERVAL '19 hour', 'Box 1', 'SCHEDULED', CURRENT_TIMESTAMP),
  ('Pilates', (SELECT id FROM types WHERE name='Pilates'), 'Core & mobility', 8, 45, 2, NOW() + INTERVAL '2 day' + INTERVAL '07 hour' + INTERVAL '30 minute', NOW() + INTERVAL '2 day' + INTERVAL '08 hour' + INTERVAL '15 minute', 'Studio B', 'SCHEDULED', CURRENT_TIMESTAMP),
  ('Spin', (SELECT id FROM types WHERE name='Spin'), 'Evening spin cardio', 15, 50, 3, NOW() + INTERVAL '2 day' + INTERVAL '19 hour', NOW() + INTERVAL '2 day' + INTERVAL '19 hour' + INTERVAL '50 minute', 'Spin Room', 'SCHEDULED', CURRENT_TIMESTAMP),
  ('Yoga', (SELECT id FROM types WHERE name='Yoga'), 'Lunchtime Yoga', 12, 60, 2, NOW() + INTERVAL '3 day' + INTERVAL '12 hour', NOW() + INTERVAL '3 day' + INTERVAL '13 hour', 'Studio A', 'SCHEDULED', CURRENT_TIMESTAMP),
  ('CrossFit', (SELECT id FROM types WHERE name='CrossFit'), 'Morning CrossFit', 10, 60, 3, NOW() + INTERVAL '3 day' + INTERVAL '06 hour', NOW() + INTERVAL '3 day' + INTERVAL '07 hour', 'Box 1', 'SCHEDULED', CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;