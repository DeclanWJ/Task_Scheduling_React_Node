const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { once } = require('node:events');
const app = require('./server');
const { pool } = require('./database');

const DEFAULT_USER_ID =
  process.env.APP_USER_ID || '00000000-0000-4000-8000-000000000001';

test.after(() => pool.end());

async function startServer(t) {
  const server = app.listen(0);
  await once(server, 'listening');
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  }));
  return `http://127.0.0.1:${server.address().port}`;
}

test('health and date-range task queries reach PostgreSQL', async (t) => {
  const baseUrl = await startServer(t);
  const ids = Array.from({ length: 4 }, () => randomUUID());
  const tasks = [
    [ids[0], 'Starts before the range', '2099-12-27T23:30:00', '2099-12-28T01:00:00', '#83947b'],
    [ids[1], 'Inside the range', '2099-12-30T09:00:00', '2099-12-30T10:00:00', '#789eb5'],
    [ids[2], 'Ends at range start', '2099-12-27T22:00:00', '2099-12-28T00:00:00', '#be8293'],
    [ids[3], 'Starts after the range', '2100-01-01T00:00:00', '2100-01-01T01:00:00', '#b19872'],
  ];

  t.after(async () => {
    await pool.query('DELETE FROM tasks WHERE id = ANY($1::uuid[])', [ids]);
  });

  await pool.query(
    `INSERT INTO tasks (id, user_id, title, starts_at, ends_at, color)
     VALUES ($1, $2, $3, $4, $5, $6), ($7, $8, $9, $10, $11, $12),
            ($13, $14, $15, $16, $17, $18), ($19, $20, $21, $22, $23, $24)`,
    tasks.flatMap(([id, title, startsAt, endsAt, color]) => [
      id,
      DEFAULT_USER_ID,
      title,
      startsAt,
      endsAt,
      color,
    ]),
  );

  const healthResponse = await fetch(`${baseUrl}/api/health`);
  assert.equal(healthResponse.status, 200);
  assert.deepEqual(await healthResponse.json(), { status: 'ok' });

  const response = await fetch(
    `${baseUrl}/api/tasks?startDate=2099-12-28&endDate=2099-12-31`,
  );
  assert.equal(response.status, 200);

  const returnedIds = (await response.json())
    .map((task) => task.id)
    .filter((id) => ids.includes(id))
    .sort();
  assert.deepEqual(returnedIds, [ids[0], ids[1]].sort());
});

test('creates and reschedules tasks with distinct stored colors for overlaps', async (t) => {
  const baseUrl = await startServer(t);
  const ids = [];

  t.after(async () => {
    if (ids.length > 0) {
      await pool.query('DELETE FROM tasks WHERE id = ANY($1::uuid[])', [ids]);
    }
  });

  async function saveTask(path, task, method = 'POST') {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
    assert.equal(response.status, method === 'POST' ? 201 : 200);
    const result = await response.json();
    ids.push(result.id);
    return result;
  }

  const first = await saveTask('/api/tasks', {
    title: 'First task',
    startsAt: '2098-01-02T09:00',
    endsAt: '2098-01-02T10:00',
  });
  const second = await saveTask('/api/tasks', {
    title: 'Second task',
    startsAt: '2098-01-02T10:00',
    endsAt: '2098-01-02T11:00',
  });
  assert.equal(second.color, first.color);

  const rescheduled = await saveTask(`/api/tasks/${second.id}`, {
    title: 'Second task',
    startsAt: '2098-01-02T09:00',
    endsAt: '2098-01-02T10:00',
  }, 'PUT');
  assert.notEqual(rescheduled.color, first.color);

  const response = await fetch(
    `${baseUrl}/api/tasks?date=2098-01-02`,
  );
  const savedTasks = await response.json();
  assert.equal(
    savedTasks.find((task) => task.id === rescheduled.id).color,
    rescheduled.color,
  );

  const simultaneousTasks = await Promise.all([
    saveTask('/api/tasks', {
      title: 'Concurrent task one',
      startsAt: '2098-01-03T09:00',
      endsAt: '2098-01-03T10:00',
    }),
    saveTask('/api/tasks', {
      title: 'Concurrent task two',
      startsAt: '2098-01-03T09:00',
      endsAt: '2098-01-03T10:00',
    }),
  ]);
  assert.notEqual(simultaneousTasks[0].color, simultaneousTasks[1].color);
});

test('creates and deletes every occurrence in a weekly repeat schedule', async (t) => {
  const baseUrl = await startServer(t);
  const title = `Weekly repeat ${randomUUID()}`;
  t.after(async () => {
    await pool.query('DELETE FROM tasks WHERE user_id = $1 AND title = $2', [
      DEFAULT_USER_ID,
      title,
    ]);
  });

  const response = await fetch(`${baseUrl}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title,
      startsAt: '2099-12-28T09:00',
      endsAt: '2099-12-28T10:00',
      repeat: 'weekly',
      repeatUntil: '2100-01-05',
      repeatDays: [1, 3],
    }),
  });
  assert.equal(response.status, 201);
  const createdTask = await response.json();
  assert.ok(createdTask.series_id);

  const result = await pool.query(
    `SELECT starts_at::text AS starts_at, ends_at::text AS ends_at, color, series_id
     FROM tasks WHERE user_id = $1 AND title = $2 ORDER BY starts_at`,
    [DEFAULT_USER_ID, title],
  );
  assert.deepEqual(
    result.rows.map(({ starts_at, ends_at }) => [starts_at, ends_at]),
    [
      ['2099-12-28 09:00:00', '2099-12-28 10:00:00'],
      ['2099-12-30 09:00:00', '2099-12-30 10:00:00'],
      ['2100-01-04 09:00:00', '2100-01-04 10:00:00'],
    ],
  );
  assert.equal(new Set(result.rows.map(({ color }) => color)).size, 1);
  assert.deepEqual(
    new Set(result.rows.map(({ series_id }) => series_id)),
    new Set([createdTask.series_id]),
  );

  const deleteResponse = await fetch(
    `${baseUrl}/api/tasks/${createdTask.id}/occurrences`,
    { method: 'DELETE' },
  );
  assert.equal(deleteResponse.status, 204);
  const remainingTasks = await pool.query(
    'SELECT id FROM tasks WHERE user_id = $1 AND title = $2',
    [DEFAULT_USER_ID, title],
  );
  assert.equal(remainingTasks.rowCount, 0);
});

test('deletes past and future occurrences from any task in a daily series', async (t) => {
  const baseUrl = await startServer(t);
  const title = `Daily repeat ${randomUUID()}`;
  const today = new Date();
  const todayKey = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');
  const dateWithOffset = (offset) => {
    const date = new Date(today);
    date.setDate(date.getDate() + offset);
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');
  };
  const startsOn = dateWithOffset(-2);
  const endsOn = dateWithOffset(2);

  t.after(async () => {
    await pool.query('DELETE FROM tasks WHERE user_id = $1 AND title = $2', [
      DEFAULT_USER_ID,
      title,
    ]);
  });

  const createResponse = await fetch(`${baseUrl}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title,
      startsAt: `${startsOn}T09:00`,
      endsAt: `${startsOn}T10:00`,
      repeat: 'daily',
      repeatUntil: endsOn,
    }),
  });
  assert.equal(createResponse.status, 201);
  const createdTask = await createResponse.json();

  const occurrences = await pool.query(
    `SELECT starts_at::date::text AS task_date
     FROM tasks WHERE user_id = $1 AND title = $2`,
    [DEFAULT_USER_ID, title],
  );
  assert.equal(occurrences.rowCount, 5);
  assert.ok(occurrences.rows.some(({ task_date }) => task_date < todayKey));
  assert.ok(occurrences.rows.some(({ task_date }) => task_date > todayKey));

  const deleteResponse = await fetch(
    `${baseUrl}/api/tasks/${createdTask.id}/occurrences`,
    { method: 'DELETE' },
  );
  assert.equal(deleteResponse.status, 204);
  const remainingTasks = await pool.query(
    'SELECT id FROM tasks WHERE user_id = $1 AND title = $2',
    [DEFAULT_USER_ID, title],
  );
  assert.equal(remainingTasks.rowCount, 0);
});
