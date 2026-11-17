const TASK_COLORS = Object.freeze([
  '#83947b',
  '#789eb5',
  '#be8293',
  '#b19872',
  '#9887b8',
  '#c18468',
  '#6e9a89',
  '#b39b51',
]);

function chooseTaskColor(overlappingTasks, preferredColor) {
  const usedColors = new Set(
    overlappingTasks
      .map((task) => (typeof task === 'string' ? task : task.color))
      .filter(Boolean),
  );

  if (preferredColor && !usedColors.has(preferredColor)) {
    return preferredColor;
  }

  const paletteColor = TASK_COLORS.find((color) => !usedColors.has(color));
  if (paletteColor) {
    return paletteColor;
  }

  for (let hue = 0; hue < 360; hue += 1) {
    const color = `hsl(${hue}, 34%, 56%)`;
    if (!usedColors.has(color)) {
      return color;
    }
  }

  throw new Error('No distinct task color is available for this schedule.');
}

module.exports = { TASK_COLORS, chooseTaskColor };
