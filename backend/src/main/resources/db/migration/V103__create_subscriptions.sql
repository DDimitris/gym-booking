-- Create subscriptions table and history; add booking_blocked to users
CREATE TABLE IF NOT EXISTS subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  initial_payment numeric(10,2) NOT NULL,
  months integer NOT NULL,
  start_date date,
  end_date date,
  late_cancellations integer DEFAULT 0,
  status varchar(20) NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  canceled_at timestamp without time zone,
  updated_at timestamp without time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscription_history (
  id BIGSERIAL PRIMARY KEY,
  subscription_id bigint NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  event_type varchar(50) NOT NULL,
  event_data text,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now()
);

-- Add booking_blocked flag to users (default false)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='users' and column_name='booking_blocked'
  ) THEN
    ALTER TABLE users ADD COLUMN booking_blocked boolean DEFAULT false;
  END IF;
END$$;
