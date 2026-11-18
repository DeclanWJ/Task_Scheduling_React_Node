const { getTaskOccurrences } = require('./taskRecurrence');

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATE_TIME_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

function isValidDateOnly(value) {
  if (typeof value !== 'string') {
    return false;
  }

  const match = DATE_PATTERN.exec(value);
  if (!match) {
    return false;
  }

  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function parseDateTimeLocal(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const match = DATE_TIME_PATTERN.exec(value);
  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute, second = 0] = match.map(
    (part) => (part === undefined ? undefined : Number(part)),
  );

  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day ||
    date.getUTCHours() !== hour ||
    date.getUTCMinutes() !== minute ||
    date.getUTCSeconds() !== second
  ) {
    return null;
  }

  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
}

function validateTaskInput(body) {
  const input = body && typeof body === 'object' ? body : {};
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  const description =
    typeof input.description === 'string' ? input.description.trim() : '';
  const startsAt = parseDateTimeLocal(input.startsAt);
  const endsAt = parseDateTimeLocal(input.endsAt);

  if (!title) {
    return { error: 'A task title is required.' };
  }
  if (title.length > 120) {
    return { error: 'Task titles must be 120 characters or fewer.' };
  }
  if (
    typeof input.description !== 'undefined' &&
    typeof input.description !== 'string'
  ) {
    return { error: 'Task descriptions must be text.' };
  }
  if (description.length > 1000) {
    return { error: 'Task descriptions must be 1000 characters or fewer.' };
  }
  if (!startsAt || !endsAt) {
    return { error: 'A valid start and end time are required.' };
  }
  if (endsAt <= startsAt) {
    return { error: 'The end time must be after the start time.' };
  }

  const repeat = input.repeat ?? 'none';
  if (!['none', 'daily', 'weekdays', 'weekly'].includes(repeat)) {
    return { error: 'Choose a valid repeat schedule.' };
  }

  const value = { title, description, startsAt, endsAt, repeat };
  if (repeat !== 'none') {
    const repeatUntil = input.repeatUntil;
    if (!isValidDateOnly(repeatUntil)) {
      return { error: 'A valid repeat-until date is required.' };
    }

    const startDate = startsAt.slice(0, 10);
    const dayDifference =
      (Date.parse(`${repeatUntil}T00:00:00Z`) -
        Date.parse(`${startDate}T00:00:00Z`)) /
      86400000;
    if (dayDifference < 0) {
      return { error: 'The repeat-until date must be on or after the task date.' };
    }
    if (dayDifference > 365) {
      return { error: 'Tasks can repeat for up to one year.' };
    }

    value.repeatUntil = repeatUntil;
    if (repeat === 'weekly') {
      const repeatDays = input.repeatDays;
      if (
        !Array.isArray(repeatDays) ||
        repeatDays.length === 0 ||
        repeatDays.some(
          (day) => !Number.isInteger(day) || day < 0 || day > 6,
        ) ||
        new Set(repeatDays).size !== repeatDays.length
      ) {
        return { error: 'Choose at least one valid day of the week.' };
      }
      value.repeatDays = repeatDays;
    }
    if (getTaskOccurrences(value).length === 0) {
      return { error: 'The repeat schedule has no dates before the end date.' };
    }
  }

  return { value };
}

module.exports = {
  isValidDateOnly,
  parseDateTimeLocal,
  validateTaskInput,
  isUuid: (value) => typeof value === 'string' && UUID_PATTERN.test(value),
};
