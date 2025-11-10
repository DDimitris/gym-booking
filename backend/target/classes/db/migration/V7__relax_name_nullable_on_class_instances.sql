-- Make legacy name column nullable since name is derived from class type
ALTER TABLE class_instances ALTER COLUMN name DROP NOT NULL;