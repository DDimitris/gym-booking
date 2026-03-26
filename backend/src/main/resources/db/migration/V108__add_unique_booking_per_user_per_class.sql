-- Enforce that a user can have at most one active (BOOKED) booking
-- for a given class instance. This prevents duplicate bookings
-- caused by rapid repeated submissions or race conditions.
CREATE UNIQUE INDEX IF NOT EXISTS bookings_user_class_booked_uniq
  ON bookings(user_id, class_instance_id)
  WHERE status = 'BOOKED';
