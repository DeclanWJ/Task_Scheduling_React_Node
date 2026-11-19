ALTER TABLE tasks ADD COLUMN series_id UUID;

-- Prior repeat copies were inserted in one transaction with a shared schedule signature.
WITH possible_series AS (
  SELECT
    id,
    first_value(id) OVER (
      PARTITION BY
        user_id,
        title,
        description,
        created_at,
        starts_at::time,
        ends_at::time,
        ends_at - starts_at
      ORDER BY starts_at, id
    ) AS series_id,
    COUNT(*) OVER (
      PARTITION BY
        user_id,
        title,
        description,
        created_at,
        starts_at::time,
        ends_at::time,
        ends_at - starts_at
    ) AS occurrence_count
  FROM tasks
)
UPDATE tasks AS task
SET series_id = possible_series.series_id
FROM possible_series
WHERE task.id = possible_series.id
  AND possible_series.occurrence_count > 1;

CREATE INDEX tasks_user_series_idx
  ON tasks (user_id, series_id)
  WHERE series_id IS NOT NULL;
