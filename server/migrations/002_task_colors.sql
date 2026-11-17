ALTER TABLE tasks ADD COLUMN color TEXT;

DO $$
DECLARE
  task_record RECORD;
  palette_color TEXT;
  candidate_color TEXT;
  hue INTEGER;
  palette TEXT[] := ARRAY[
    '#83947b',
    '#789eb5',
    '#be8293',
    '#b19872',
    '#9887b8',
    '#c18468',
    '#6e9a89',
    '#b39b51'
  ];
BEGIN
  FOR task_record IN
    SELECT id, user_id, starts_at, ends_at
    FROM tasks
    ORDER BY user_id, starts_at, ends_at, id
  LOOP
    candidate_color := NULL;

    FOREACH palette_color IN ARRAY palette LOOP
      PERFORM 1
      FROM tasks AS existing
      WHERE existing.user_id = task_record.user_id
        AND existing.color = palette_color
        AND existing.starts_at < task_record.ends_at
        AND existing.ends_at > task_record.starts_at
      LIMIT 1;

      IF NOT FOUND THEN
        candidate_color := palette_color;
        EXIT;
      END IF;
    END LOOP;

    IF candidate_color IS NULL THEN
      FOR hue IN 0..359 LOOP
        candidate_color := format('hsl(%s, 34%%, 56%%)', hue);

        PERFORM 1
        FROM tasks AS existing
        WHERE existing.user_id = task_record.user_id
          AND existing.color = candidate_color
          AND existing.starts_at < task_record.ends_at
          AND existing.ends_at > task_record.starts_at
        LIMIT 1;

        IF NOT FOUND THEN
          EXIT;
        END IF;

        candidate_color := NULL;
      END LOOP;
    END IF;

    IF candidate_color IS NULL THEN
      RAISE EXCEPTION 'Unable to assign a distinct color to task %', task_record.id;
    END IF;

    UPDATE tasks
    SET color = candidate_color
    WHERE id = task_record.id;
  END LOOP;
END $$;

ALTER TABLE tasks ALTER COLUMN color SET NOT NULL;
