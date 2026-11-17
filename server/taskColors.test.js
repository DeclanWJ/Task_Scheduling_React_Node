const test = require('node:test');
const assert = require('node:assert/strict');
const { TASK_COLORS, chooseTaskColor } = require('./taskColors');

test('preserves a task color when it does not conflict with overlapping tasks', () => {
  assert.equal(chooseTaskColor([{ color: TASK_COLORS[1] }], TASK_COLORS[0]), TASK_COLORS[0]);
});

test('assigns a different palette color when the preferred color is in use', () => {
  assert.equal(chooseTaskColor([{ color: TASK_COLORS[0] }], TASK_COLORS[0]), TASK_COLORS[1]);
});

test('reuses palette colors when tasks do not overlap', () => {
  assert.equal(chooseTaskColor([], TASK_COLORS[0]), TASK_COLORS[0]);
  assert.equal(chooseTaskColor([]), TASK_COLORS[0]);
});

test('generates another pastel color if all palette colors overlap', () => {
  const color = chooseTaskColor(TASK_COLORS);

  assert.match(color, /^hsl\(\d+, 34%, 56%\)$/);
  assert.equal(new Set([...TASK_COLORS, color]).size, TASK_COLORS.length + 1);
});
