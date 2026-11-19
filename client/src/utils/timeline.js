import { addDays, toDateKey } from './calendar.js'

export const GRID_START_MINUTE = 7 * 60
export const GRID_END_MINUTE = 23 * 60
const HOUR_HEIGHT = 64
const STACK_REVEAL_PX = 18

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
        stackOffsetPx:
          longestFirst
            .slice(0, stackIndex)
            .filter(
              (lowerEvent) =>
                lowerEvent.start < event.end && event.start < lowerEvent.end,
            ).length * STACK_REVEAL_PX,
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

export function getEventPositionStyle(event, mode) {
  const style = {
    top: `${((event.start - GRID_START_MINUTE) * HOUR_HEIGHT) / 60 + (event.stackOffsetPx || 0)}px`,
    height: `${(event.duration * HOUR_HEIGHT) / 60}px`,
    zIndex: event.zIndex,
  }

  if (mode === 'columns') {
    const laneWidth = 100 / event.laneCount
    style.left = `calc(${event.lane * laneWidth}% + 2px)`
    style.width = `calc(${laneWidth}% - 4px)`
  } else {
    style.left = '0px'
    style.width = '100%'
  }

  return style
}
