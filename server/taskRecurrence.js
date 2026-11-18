function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function shiftDate(dateValue, dayOffset) {
  const date = new Date(`${dateValue}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + dayOffset);
  return formatDate(date);
}

function getTaskOccurrences(task) {
  const startDate = task.startsAt.slice(0, 10);
  const endDate = task.endsAt.slice(0, 10);

  if (task.repeat === 'none') {
    return [{ startsAt: task.startsAt, endsAt: task.endsAt }];
  }

  const finalDate = task.repeatUntil;
  const lastDayOffset =
    (Date.parse(`${finalDate}T00:00:00Z`) -
      Date.parse(`${startDate}T00:00:00Z`)) /
    86400000;
  const repeatDays = new Set(task.repeatDays || []);
  const occurrences = [];

  for (let dayOffset = 0; dayOffset <= lastDayOffset; dayOffset += 1) {
    const date = shiftDate(startDate, dayOffset);
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
    const matches =
      task.repeat === 'daily' ||
      (task.repeat === 'weekdays' && weekday >= 1 && weekday <= 5) ||
      (task.repeat === 'weekly' && repeatDays.has(weekday));

    if (matches) {
      occurrences.push({
        startsAt: `${date}${task.startsAt.slice(10)}`,
        endsAt: `${shiftDate(endDate, dayOffset)}${task.endsAt.slice(10)}`,
      });
    }
  }

  return occurrences;
}

module.exports = { getTaskOccurrences };
