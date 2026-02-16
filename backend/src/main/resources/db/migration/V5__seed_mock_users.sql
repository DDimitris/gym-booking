-- -- Seed mock users: 1 admin, 2 trainers, 20 athletes
-- -- Safe to re-run via Flyway in empty DBs; will conflict on unique email if already present

-- INSERT INTO users (id, name, email, role, auth_provider, status, created_at)
-- VALUES (1, 'Admin User', 'admin@gym.com', 'ADMIN', 'EMAIL', 'ACTIVE', CURRENT_TIMESTAMP)
-- ON CONFLICT (id) DO NOTHING;

-- INSERT INTO users (id, name, email, role, auth_provider, status, created_at)
-- VALUES (2, 'Instructor Smith', 'instructor1@gym.com', 'INSTRUCTOR', 'EMAIL', 'ACTIVE', CURRENT_TIMESTAMP)
-- ON CONFLICT (id) DO NOTHING;

-- INSERT INTO users (id, name, email, role, auth_provider, status, created_at)
-- VALUES (3, 'Instructor Doe', 'instructor2@gym.com', 'INSTRUCTOR', 'EMAIL', 'ACTIVE', CURRENT_TIMESTAMP)
-- ON CONFLICT (id) DO NOTHING;

-- -- Ensure the users.id sequence is advanced beyond any explicitly inserted IDs
-- SELECT setval(
--   pg_get_serial_sequence('users','id'),
--   GREATEST(COALESCE((SELECT MAX(id) FROM users), 1), 3),
--   true
-- );

-- DO $$
-- DECLARE i int;
-- BEGIN
--   FOR i IN 1..20 LOOP
--   INSERT INTO users (id, name, email, role, auth_provider, status, created_at)
--   VALUES (
--     nextval(pg_get_serial_sequence('users','id')),
--     format('Athlete %s', i),
--     format('athlete%1$s@gym.com', i),
--     'ATHLETE', 'EMAIL', 'ACTIVE', CURRENT_TIMESTAMP)
--     ON CONFLICT (email) DO NOTHING;
--   END LOOP;
-- END $$;

-- -- Set some base costs for athletes for billing calculations
-- UPDATE users SET base_cost = 20.00 WHERE role = 'ATHLETE' AND base_cost IS NULL;