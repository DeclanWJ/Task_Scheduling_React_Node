require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { pool, query } = require('./database');
const {
  isValidDateOnly,
  isUuid,
  validateTaskInput,
} = require('./taskValidation');

const app = express();
const PORT = process.env.PORT || 5000;
const DEFAULT_USER_ID =
  process.env.APP_USER_ID || '00000000-0000-4000-8000-000000000001';

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
    `SELECT id, title, description, starts_at, ends_at, completed, created_at, updated_at
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

  const { title, description, startsAt, endsAt } = validation.value;
  const result = await query(
    `INSERT INTO tasks (user_id, title, description, starts_at, ends_at)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, title, description, starts_at, ends_at, completed, created_at, updated_at`,
    [DEFAULT_USER_ID, title, description, startsAt, endsAt],
  );

  res.status(201).json(result.rows[0]);
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
  const result = await query(
    `UPDATE tasks
     SET title = $3, description = $4, starts_at = $5, ends_at = $6, updated_at = NOW()
     WHERE id = $1 AND user_id = $2
     RETURNING id, title, description, starts_at, ends_at, completed, created_at, updated_at`,
    [req.params.id, DEFAULT_USER_ID, title, description, startsAt, endsAt],
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ error: 'Task not found.' });
  }

  res.json(result.rows[0]);
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
     RETURNING id, title, description, starts_at, ends_at, completed, created_at, updated_at`,
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
