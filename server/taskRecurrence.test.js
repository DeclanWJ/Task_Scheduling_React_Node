const test = require('node:test');
const assert = require('node:assert/strict');
const { getTaskOccurrences } = require('./taskRecurrence');

test('creates weekly copies on selected weekdays through the inclusive end date', () => {
  const occurrences = getTaskOccurrences({
    startsAt: '2026-11-11T09:00:00',
    endsAt: '2026-11-11T10:00:00',
    repeat: 'weekly',
    repeatUntil: '2026-11-23',
    repeatDays: [1, 3],
  });

  assert.deepEqual(
    occurrences.map(({ startsAt, endsAt }) => [startsAt, endsAt]),
    [
      ['2026-11-11T09:00:00', '2026-11-11T10:00:00'],
      ['2026-11-16T09:00:00', '2026-11-16T10:00:00'],
      ['2026-11-18T09:00:00', '2026-11-18T10:00:00'],
      ['2026-11-23T09:00:00', '2026-11-23T10:00:00'],
    ],
  );
});

test('repeats weekday tasks and preserves a task that crosses midnight', () => {
  const occurrences = getTaskOccurrences({
    startsAt: '2026-11-13T23:00:00',
    endsAt: '2026-11-14T01:00:00',
    repeat: 'weekdays',
    repeatUntil: '2026-11-17',
  });

  assert.deepEqual(
    occurrences.map(({ startsAt, endsAt }) => [startsAt, endsAt]),
    [
      ['2026-11-13T23:00:00', '2026-11-14T01:00:00'],
      ['2026-11-16T23:00:00', '2026-11-17T01:00:00'],
      ['2026-11-17T23:00:00', '2026-11-18T01:00:00'],
    ],
  );
});
