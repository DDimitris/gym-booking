-- Dev-only seed users (admin, trainers, athletes)
INSERT INTO users (id, name, email, role, auth_provider, status, created_at)
VALUES (1, 'Admin User', 'admin@gym.com', 'ADMIN', 'EMAIL', 'ACTIVE', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;
INSERT INTO users (id, name, email, role, auth_provider, status, created_at)
VALUES (2, 'Trainer Smith', 'trainer1@gym.com', 'TRAINER', 'EMAIL', 'ACTIVE', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;
INSERT INTO users (id, name, email, role, auth_provider, status, created_at)
VALUES (3, 'Trainer Doe', 'trainer2@gym.com', 'TRAINER', 'EMAIL', 'ACTIVE', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;
SELECT setval(
  pg_get_serial_sequence('users','id'),
  GREATEST(COALESCE((SELECT MAX(id) FROM users), 1), 3),
  true
);
DO $$
DECLARE i int;
BEGIN
  FOR i IN 1..10 LOOP
    INSERT INTO users (id, name, email, role, auth_provider, status, created_at)
    VALUES (nextval(pg_get_serial_sequence('users','id')), format('Member %s', i), format('member%1$s@gym.com', i), 'MEMBER', 'EMAIL', 'ACTIVE', CURRENT_TIMESTAMP)
    ON CONFLICT (email) DO NOTHING;
  END LOOP;
END $$;
