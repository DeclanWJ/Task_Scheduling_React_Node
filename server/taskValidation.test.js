const test = require('node:test');
const assert = require('node:assert/strict');
const {
  isValidDateOnly,
  parseDateTimeLocal,
  validateTaskInput,
} = require('./taskValidation');

test('accepts real calendar dates and rejects impossible dates', () => {
  assert.equal(isValidDateOnly('2024-02-29'), true);
  assert.equal(isValidDateOnly('2025-02-29'), false);
  assert.equal(isValidDateOnly('not-a-date'), false);
});

test('parses valid local date-times without shifting the wall clock', () => {
  assert.equal(
    parseDateTimeLocal('2026-11-11T09:30'),
    '2026-11-11T09:30:00',
  );
  assert.equal(parseDateTimeLocal('2026-02-30T09:30'), null);
});

test('validates and normalizes task input', () => {
  assert.deepEqual(
    validateTaskInput({
      title: '  Plan the week  ',
      description: '  Review priorities  ',
      startsAt: '2026-11-11T09:30',
      endsAt: '2026-11-11T10:00',
    }),
    {
      value: {
        title: 'Plan the week',
        description: 'Review priorities',
        startsAt: '2026-11-11T09:30:00',
        endsAt: '2026-11-11T10:00:00',
      },
    },
  );
});

test('rejects empty titles and invalid time ranges', () => {
  assert.match(
    validateTaskInput({
      title: ' ',
      startsAt: '2026-11-11T09:30',
      endsAt: '2026-11-11T10:00',
    }).error,
    /title/i,
  );

  assert.match(
    validateTaskInput({
      title: 'Planning',
      startsAt: '2026-11-11T10:00',
      endsAt: '2026-11-11T10:00',
    }).error,
    /after/i,
  );
});
