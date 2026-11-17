import test from 'node:test'
import assert from 'node:assert/strict'
import { getVisibleTaskInterval, layoutOverlappingEvents } from './timeline.js'

function task(startsAt, endsAt) {
  return {
    id: `${startsAt}-${endsAt}`,
    starts_at: startsAt,
    ends_at: endsAt,
  }
}

test('clips overnight tasks to the visible part of each day', () => {
  const interval = getVisibleTaskInterval(
    task('2026-11-11T22:00:00', '2026-11-12T09:00:00'),
    '2026-11-12',
  )

  assert.deepEqual(
    { start: interval.start, end: interval.end, duration: interval.duration },
    { start: 420, end: 540, duration: 120 },
  )
  assert.equal(
    getVisibleTaskInterval(task('2026-11-12T01:00:00', '2026-11-12T06:00:00'), '2026-11-12'),
    null,
  )
  assert.equal(
    getVisibleTaskInterval(task('2026-11-11T22:00:00', '2026-11-12T00:00:00'), '2026-11-12'),
    null,
  )
})

test('daily overlaps receive separate lanes while non-overlapping tasks reuse lanes', () => {
  const events = [
    { task: { id: 'long' }, start: 540, end: 720, duration: 180 },
    { task: { id: 'short' }, start: 600, end: 660, duration: 60 },
    { task: { id: 'later' }, start: 720, end: 780, duration: 60 },
  ]

  const layout = layoutOverlappingEvents(events, 'columns')
  const byId = Object.fromEntries(layout.map((event) => [event.task.id, event]))

  assert.equal(byId.long.laneCount, 2)
  assert.equal(byId.short.laneCount, 2)
  assert.notEqual(byId.long.lane, byId.short.lane)
  assert.equal(byId.later.laneCount, 1)
  assert.equal(byId.later.lane, byId.long.lane)
})

test('week overlaps layer the longest task beneath shorter tasks', () => {
  const layout = layoutOverlappingEvents([
    { task: { id: 'short' }, start: 600, end: 660, duration: 60 },
    { task: { id: 'long' }, start: 540, end: 720, duration: 180 },
  ], 'stack')
  const byId = Object.fromEntries(layout.map((event) => [event.task.id, event]))

  assert.equal(byId.long.zIndex, 1)
  assert.equal(byId.short.zIndex, 2)
  assert.equal(byId.long.stackOffsetMinutes, 0)
  assert.equal(byId.short.stackOffsetMinutes, 30)
  assert.equal(byId.short.start, 600)
  assert.equal(byId.short.end, 660)
})

test('stack offsets preserve enough visible height for short tasks', () => {
  const layout = layoutOverlappingEvents([
    { task: { id: 'long' }, start: 540, end: 720, duration: 180 },
    { task: { id: 'short' }, start: 600, end: 620, duration: 20 },
  ], 'stack')
  const short = layout.find((event) => event.task.id === 'short')

  assert.equal(short.stackOffsetMinutes, 0)
})
