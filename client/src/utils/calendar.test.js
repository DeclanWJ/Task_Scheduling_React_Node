import test from 'node:test'
import assert from 'node:assert/strict'
import { addMonths, getMonthGridDates, getWeekDates, toDateKey } from './calendar.js'

test('weeks start on Monday and include seven consecutive dates', () => {
  const dates = getWeekDates(new Date(2026, 0, 1))

  assert.deepEqual(dates.map(toDateKey), [
    '2025-12-29',
    '2025-12-30',
    '2025-12-31',
    '2026-01-01',
    '2026-01-02',
    '2026-01-03',
    '2026-01-04',
  ])
})

test('month grids cover the complete month in five or six Monday-first weeks', () => {
  const february = getMonthGridDates(new Date(2026, 1, 1))
  const august = getMonthGridDates(new Date(2026, 7, 1))

  assert.equal(february.length, 35)
  assert.equal(february[0].getDay(), 1)
  assert.equal(february.at(-1).getDay(), 0)
  assert.equal(august.length, 42)
})

test('month navigation clamps dates to the target month', () => {
  assert.equal(toDateKey(addMonths(new Date(2025, 0, 31), 1)), '2025-02-28')
})
