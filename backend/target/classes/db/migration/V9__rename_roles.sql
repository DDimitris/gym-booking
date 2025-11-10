-- Rename legacy roles INSTRUCTOR->TRAINER and ATHLETE->MEMBER
UPDATE users SET role = 'TRAINER' WHERE role = 'INSTRUCTOR';
UPDATE users SET role = 'MEMBER' WHERE role = 'ATHLETE';

-- (Optional) verify no legacy roles remain
-- SELECT role, count(*) FROM users GROUP BY role;