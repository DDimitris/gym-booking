-- Add a color column to class_types for calendar/event coloring
ALTER TABLE class_types
  ADD COLUMN IF NOT EXISTS color VARCHAR(7) NOT NULL DEFAULT '#3788d8';

-- Update existing seeded rows to have explicit colors (optional mapping)
UPDATE class_types
SET color = '#9c27b0'
WHERE name = 'Pilates';
UPDATE class_types
SET color = '#f44336'
WHERE name = 'CrossFit';
UPDATE class_types
SET color = '#4caf50'
WHERE name = 'Yoga';
UPDATE class_types
SET color = '#ff9800'
WHERE name = 'Spin';
UPDATE class_types
SET color = '#795548'
WHERE name = 'Boxing';
UPDATE class_types
SET color = '#e91e63'
WHERE name = 'HIIT';
