require('dotenv').config();

const { randomUUID } = require('node:crypto');
const express = require('express');
const cors = require('cors');
const { pool, query } = require('./database');
const {
  isValidDateOnly,
  isUuid,
  validateTaskInput,
} = require('./taskValidation');
const { chooseTaskColor } = require('./taskColors');
const { getTaskOccurrences } = require('./taskRecurrence');

const app = express();
const PORT = process.env.PORT || 5000;
const DEFAULT_USER_ID =
  process.env.APP_USER_ID || '00000000-0000-4000-8000-000000000001';

async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function lockUserSchedule(client) {
  await client.query('SELECT pg_advisory_xact_lock(hashtext($1)::bigint)', [
    DEFAULT_USER_ID,
  ]);
}

app.use(cors());
app.use(express.json());

app.get('/api/health', async (req, res) => {
  await query('SELECT 1');
  res.json({ status: 'ok' });
});

app.get('/api/tasks', async (req, res) => {
  const { date, startDate, endDate } = req.query;
  let rangeStart;
  let rangeEnd;

  if (typeof date !== 'undefined') {
    if (!isValidDateOnly(date)) {
      return res.status(400).json({ error: 'A valid date (YYYY-MM-DD) is required.' });
    }

    rangeStart = date;
    rangeEnd = date;
  } else if (
    isValidDateOnly(startDate) &&
    isValidDateOnly(endDate) &&
    startDate <= endDate
  ) {
    rangeStart = startDate;
    rangeEnd = endDate;
  } else {
    return res.status(400).json({
      error: 'A valid start and end date are required.',
    });
  }

  const result = await query(
    `SELECT id, title, description, starts_at, ends_at, completed, color, series_id, created_at, updated_at
     FROM tasks
     WHERE user_id = $1
       AND starts_at < $3::date + INTERVAL '1 day'
       AND ends_at > $2::date
     ORDER BY starts_at`,
    [DEFAULT_USER_ID, rangeStart, rangeEnd],
  );

  res.json(result.rows);
});

app.post('/api/tasks', async (req, res) => {
  const validation = validateTaskInput(req.body);
  if (validation.error) {
    return res.status(400).json({ error: validation.error });
  }

  const { title, description } = validation.value;
  const occurrences = getTaskOccurrences(validation.value);
  const seriesId = validation.value.repeat === 'none' ? null : randomUUID();
  const task = await withTransaction(async (client) => {
    await lockUserSchedule(client);
    let firstTask;
    for (const occurrence of occurrences) {
      const touchingTasks = await client.query(
        `SELECT color FROM tasks
         WHERE user_id = $1 AND starts_at <= $3 AND ends_at >= $2`,
        [DEFAULT_USER_ID, occurrence.startsAt, occurrence.endsAt],
      );
      const color = chooseTaskColor(touchingTasks.rows);
      const result = await client.query(
        `INSERT INTO tasks (user_id, title, description, starts_at, ends_at, color, series_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, title, description, starts_at, ends_at, completed, color, series_id, created_at, updated_at`,
        [
          DEFAULT_USER_ID,
          title,
          description,
          occurrence.startsAt,
          occurrence.endsAt,
          color,
          seriesId,
        ],
      );
      if (!firstTask) {
        firstTask = result.rows[0];
      }
    }
    return firstTask;
  });

  res.status(201).json(task);
});

app.put('/api/tasks/:id', async (req, res) => {
  if (!isUuid(req.params.id)) {
    return res.status(400).json({ error: 'A valid task ID is required.' });
  }

  const validation = validateTaskInput(req.body);
  if (validation.error) {
    return res.status(400).json({ error: validation.error });
  }

  const { title, description, startsAt, endsAt } = validation.value;
  const task = await withTransaction(async (client) => {
    await lockUserSchedule(client);
    const currentTask = await client.query(
      'SELECT color FROM tasks WHERE id = $1 AND user_id = $2 FOR UPDATE',
      [req.params.id, DEFAULT_USER_ID],
    );
    if (currentTask.rowCount === 0) {
      return null;
    }

    const overlappingTasks = await client.query(
      `SELECT color FROM tasks
       WHERE user_id = $1 AND id <> $2 AND starts_at <= $4 AND ends_at >= $3`,
      [DEFAULT_USER_ID, req.params.id, startsAt, endsAt],
    );
    const color = chooseTaskColor(
      overlappingTasks.rows,
      currentTask.rows[0].color,
    );
    const result = await client.query(
      `UPDATE tasks
       SET title = $3, description = $4, starts_at = $5, ends_at = $6,
           color = $7, updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING id, title, description, starts_at, ends_at, completed, color, series_id, created_at, updated_at`,
      [
        req.params.id,
        DEFAULT_USER_ID,
        title,
        description,
        startsAt,
        endsAt,
        color,
      ],
    );
    return result.rows[0];
  });

  if (!task) {
    return res.status(404).json({ error: 'Task not found.' });
  }

  res.json(task);
});

app.patch('/api/tasks/:id', async (req, res) => {
  if (!isUuid(req.params.id)) {
    return res.status(400).json({ error: 'A valid task ID is required.' });
  }
  if (typeof req.body?.completed !== 'boolean') {
    return res.status(400).json({ error: 'A completed boolean is required.' });
  }

  const result = await query(
    `UPDATE tasks
     SET completed = $3, updated_at = NOW()
     WHERE id = $1 AND user_id = $2
     RETURNING id, title, description, starts_at, ends_at, completed, color, series_id, created_at, updated_at`,
    [req.params.id, DEFAULT_USER_ID, req.body.completed],
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ error: 'Task not found.' });
  }

  res.json(result.rows[0]);
});

app.delete('/api/tasks/:id', async (req, res) => {
  if (!isUuid(req.params.id)) {
    return res.status(400).json({ error: 'A valid task ID is required.' });
  }

  const result = await query(
    'DELETE FROM tasks WHERE id = $1 AND user_id = $2',
    [req.params.id, DEFAULT_USER_ID],
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ error: 'Task not found.' });
  }

  res.status(204).end();
});

app.delete('/api/tasks/:id/occurrences', async (req, res) => {
  if (!isUuid(req.params.id)) {
    return res.status(400).json({ error: 'A valid task ID is required.' });
  }

  const result = await query(
    `WITH target AS (
       SELECT id, series_id
       FROM tasks
       WHERE id = $1 AND user_id = $2
     )
     DELETE FROM tasks AS occurrence
     USING target
     WHERE occurrence.user_id = $2
       AND (
         occurrence.id = target.id
         OR (
           target.series_id IS NOT NULL
           AND occurrence.series_id = target.series_id
         )
       )
     RETURNING occurrence.id`,
    [req.params.id, DEFAULT_USER_ID],
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ error: 'Task not found.' });
  }

  res.status(204).end();
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  console.error('Request failed:', error);
  res.status(500).json({ error: 'An unexpected server error occurred.' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

process.on('SIGTERM', () => pool.end());

module.exports = app;
