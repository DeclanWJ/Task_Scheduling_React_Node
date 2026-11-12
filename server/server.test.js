const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const app = require('./server');

async function startServer(t) {
  const server = app.listen(0);
  await once(server, 'listening');
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  }));
  return `http://127.0.0.1:${server.address().port}`;
}

test('rejects invalid calendar dates without querying the database', async (t) => {
  const baseUrl = await startServer(t);
  const response = await fetch(`${baseUrl}/api/tasks?date=2026-02-30`);

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: 'A valid date (YYYY-MM-DD) is required.',
  });
});

test('rejects invalid or reversed task date ranges without querying the database', async (t) => {
  const baseUrl = await startServer(t);

  for (const range of [
    'startDate=2026-02-30&endDate=2026-03-02',
    'startDate=2026-03-02&endDate=2026-03-01',
  ]) {
    const response = await fetch(`${baseUrl}/api/tasks?${range}`);

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      error: 'A valid start and end date are required.',
    });
  }
});

test('rejects malformed task details without querying the database', async (t) => {
  const baseUrl = await startServer(t);
  const response = await fetch(`${baseUrl}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Planning' }),
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: 'A valid start and end time are required.',
  });
});
