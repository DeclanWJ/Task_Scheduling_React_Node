import { addDays, toDateKey } from './calendar.js'

export const GRID_START_MINUTE = 7 * 60
export const GRID_END_MINUTE = 23 * 60
const STACK_START_OFFSET_MINUTES = 30
const MIN_STACKED_DURATION_MINUTES = 30

function minuteOfDay(dateTime) {
  const [hour, minute, second = 0] = dateTime.slice(11, 19).split(':').map(Number)
  return hour * 60 + minute + second / 60
}

export function getVisibleTaskInterval(task, dateKey) {
  const dayStart = `${dateKey}T00:00:00`
  const nextDateKey = toDateKey(addDays(new Date(`${dateKey}T00:00:00`), 1))
  const dayEnd = `${nextDateKey}T00:00:00`

  if (task.starts_at >= dayEnd || task.ends_at <= dayStart) {
    return null
  }

  const start = task.starts_at < dayStart ? 0 : minuteOfDay(task.starts_at)
  const end = task.ends_at >= dayEnd ? 24 * 60 : minuteOfDay(task.ends_at)
  const visibleStart = Math.max(start, GRID_START_MINUTE)
  const visibleEnd = Math.min(end, GRID_END_MINUTE)

  if (visibleEnd <= visibleStart) {
    return null
  }

  return {
    task,
    start: visibleStart,
    end: visibleEnd,
    duration: visibleEnd - visibleStart,
  }
}

function overlappingGroups(events) {
  const sortedEvents = [...events].sort(
    (first, second) => first.start - second.start || second.end - first.end,
  )
  const groups = []

  for (const event of sortedEvents) {
    const currentGroup = groups[groups.length - 1]
    if (!currentGroup || event.start >= currentGroup.end) {
      groups.push({ end: event.end, events: [event] })
      continue
    }

    currentGroup.events.push(event)
    currentGroup.end = Math.max(currentGroup.end, event.end)
  }

  return groups
}

export function layoutOverlappingEvents(events, mode) {
  return overlappingGroups(events).flatMap(({ events: group }) => {
    if (mode === 'stack') {
      const longestFirst = [...group].sort(
        (first, second) =>
          second.duration - first.duration || first.start - second.start,
      )

      return longestFirst.map((event, stackIndex) => ({
        ...event,
        stackIndex,
        stackOffsetMinutes: Math.min(
          stackIndex * STACK_START_OFFSET_MINUTES,
          Math.max(0, event.duration - MIN_STACKED_DURATION_MINUTES),
        ),
        zIndex: stackIndex + 1,
      }))
    }

    const laneEnds = []
    const assigned = group.map((event) => {
      let lane = laneEnds.findIndex((laneEnd) => laneEnd <= event.start)
      if (lane === -1) {
        lane = laneEnds.length
      }
      laneEnds[lane] = event.end
      return { ...event, lane }
    })

    return assigned.map((event) => ({
      ...event,
      laneCount: laneEnds.length,
      zIndex: 1,
    }))
  })
}
