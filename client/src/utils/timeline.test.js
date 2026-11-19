import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getEventPositionStyle,
  getVisibleTaskInterval,
  layoutOverlappingEvents,
} from './timeline.js'

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

test('week overlaps offset only the shorter task vertically without changing its duration', () => {
  const layout = layoutOverlappingEvents([
    { task: { id: 'short' }, start: 600, end: 660, duration: 60 },
    { task: { id: 'long' }, start: 540, end: 720, duration: 180 },
  ], 'stack')
  const byId = Object.fromEntries(layout.map((event) => [event.task.id, event]))

  assert.equal(byId.long.zIndex, 1)
  assert.equal(byId.short.zIndex, 2)
  assert.equal(byId.long.stackOffsetPx, 0)
  assert.equal(byId.short.stackOffsetPx, 18)
  assert.equal(byId.short.start, 600)
  assert.equal(byId.short.end, 660)
  assert.deepEqual(getEventPositionStyle(byId.short, 'stack'), {
    top: '210px',
    height: '64px',
    zIndex: 2,
    left: '0px',
    width: '100%',
  })
})

test('stack offsets reveal only tasks that overlap, with no horizontal offset or gaps', () => {
  const layout = layoutOverlappingEvents([
    { task: { id: 'race-day' }, start: 540, end: 1020, duration: 480 },
    { task: { id: 'autograph' }, start: 600, end: 660, duration: 60 },
    { task: { id: 'gt-super' }, start: 660, end: 840, duration: 180 },
    { task: { id: 'lunch' }, start: 660, end: 720, duration: 60 },
  ], 'stack')
  const byId = Object.fromEntries(layout.map((event) => [event.task.id, event]))

  assert.deepEqual(
    Object.fromEntries(
      Object.entries(byId).map(([id, event]) => [id, [event.start, event.end]]),
    ),
    {
      'race-day': [540, 1020],
      autograph: [600, 660],
      'gt-super': [660, 840],
      lunch: [660, 720],
    },
  )
  assert.deepEqual(Object.fromEntries(
    Object.entries(byId).map(([id, event]) => [id, event.stackOffsetPx]),
  ), {
    'race-day': 0,
    autograph: 18,
    'gt-super': 18,
    lunch: 36,
  })
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(byId).map(([id, event]) => {
        const { top, height } = getEventPositionStyle(event, 'stack')
        return [id, [top, height]]
      }),
    ),
    {
      'race-day': ['128px', '512px'],
      autograph: ['210px', '64px'],
      'gt-super': ['274px', '192px'],
      lunch: ['292px', '64px'],
    },
  )
  assert.deepEqual(
    Object.values(byId).map((event) => {
      const { left, width } = getEventPositionStyle(event, 'stack')
      return [left, width]
    }),
    Array(4).fill(['0px', '100%']),
  )
})

test('short stacked tasks keep their full duration and use the minimum vertical reveal', () => {
  const layout = layoutOverlappingEvents([
    { task: { id: 'long' }, start: 540, end: 720, duration: 180 },
    { task: { id: 'short' }, start: 600, end: 620, duration: 20 },
  ], 'stack')
  const short = layout.find((event) => event.task.id === 'short')

  assert.equal(short.stackOffsetPx, 18)
  assert.deepEqual(getEventPositionStyle(short, 'stack'), {
    top: '210px',
    height: '21.333333333333332px',
    zIndex: 2,
    left: '0px',
    width: '100%',
  })
})
