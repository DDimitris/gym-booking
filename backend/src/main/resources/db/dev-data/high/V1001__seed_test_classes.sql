-- Dev-only seed classes, assumes class_types from V2 exists
WITH types AS (
  SELECT id, name FROM class_types WHERE name IN ('Yoga','CrossFit','Pilates','Spin')
)
INSERT INTO class_instances (name, class_type_id, description, capacity, duration_minutes, trainer_id, start_time, end_time, location, status, created_at)
VALUES
  ('Yoga', (SELECT id FROM types WHERE name='Yoga'), 'Morning Yoga flow', 12, 60, 2, NOW() + INTERVAL '1 day' + INTERVAL '08 hour', NOW() + INTERVAL '1 day' + INTERVAL '09 hour', 'Studio A', 'SCHEDULED', CURRENT_TIMESTAMP),
  ('CrossFit', (SELECT id FROM types WHERE name='CrossFit'), 'WOD: Metcon and strength', 10, 60, 3, NOW() + INTERVAL '1 day' + INTERVAL '18 hour', NOW() + INTERVAL '1 day' + INTERVAL '19 hour', 'Box 1', 'SCHEDULED', CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;
