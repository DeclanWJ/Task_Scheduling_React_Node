CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO users (id, email, display_name)
VALUES (
  '00000000-0000-4000-8000-000000000001',
  'local@taskscheduler.dev',
  'Local User'
)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(120) NOT NULL,
  description VARCHAR(1000) NOT NULL DEFAULT '',
  starts_at TIMESTAMP NOT NULL,
  ends_at TIMESTAMP NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT tasks_valid_time_range CHECK (ends_at > starts_at)
);

CREATE INDEX tasks_user_schedule_idx ON tasks (user_id, starts_at, ends_at);
