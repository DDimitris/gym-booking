-- Rename legacy `months` column to `days` so existing data is preserved
-- in-place. This is an atomic rename on PostgreSQL and avoids copying data.
--
-- Note: this migration uses PostgreSQL syntax. If you need to support other
-- databases (MySQL, MariaDB, etc.) adjust the SQL accordingly, e.g.:
--   ALTER TABLE subscriptions CHANGE COLUMN `months` `days` INT;
--
ALTER TABLE subscriptions RENAME COLUMN months TO days;
