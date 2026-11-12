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
    [ids[0], 'Starts before the range', '2099-12-27T23:30:00', '2099-12-28T01:00:00'],
    [ids[1], 'Inside the range', '2099-12-30T09:00:00', '2099-12-30T10:00:00'],
    [ids[2], 'Ends at range start', '2099-12-27T22:00:00', '2099-12-28T00:00:00'],
    [ids[3], 'Starts after the range', '2100-01-01T00:00:00', '2100-01-01T01:00:00'],
  ];

  t.after(async () => {
    await pool.query('DELETE FROM tasks WHERE id = ANY($1::uuid[])', [ids]);
  });

  await pool.query(
    `INSERT INTO tasks (id, user_id, title, starts_at, ends_at)
     VALUES ($1, $5, $6, $7, $8), ($2, $5, $9, $10, $11),
            ($3, $5, $12, $13, $14), ($4, $5, $15, $16, $17)`,
    [
      ...ids,
      DEFAULT_USER_ID,
      ...tasks.flatMap(([, title, startsAt, endsAt]) => [title, startsAt, endsAt]),
    ],
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
