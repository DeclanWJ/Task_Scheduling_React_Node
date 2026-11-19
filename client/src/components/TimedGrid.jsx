import { addDays, toDateKey } from '../utils/calendar.js'
import {
  getEventPositionStyle,
  getVisibleTaskInterval,
  layoutOverlappingEvents,
} from '../utils/timeline.js'
import TaskItem from './TaskItem.jsx'
import './TimedGrid.css'

const hours = Array.from({ length: 16 }, (_, index) => index + 7)
const pad = (value) => String(value).padStart(2, '0')

function formatHour(hour) {
  return `${hour % 12 || 12} ${hour < 12 ? 'AM' : 'PM'}`
}

function formatMinute(minute) {
  const roundedMinute = Math.round(minute)
  const hour = Math.floor(roundedMinute / 60)
  const minuteWithinHour = roundedMinute % 60
  return `${hour % 12 || 12}:${pad(minuteWithinHour)} ${hour < 12 ? 'AM' : 'PM'}`
}

function overlapsDate(task, dateKey) {
  const dayStart = `${dateKey}T00:00:00`
  const nextDateKey = toDateKey(addDays(new Date(`${dateKey}T00:00:00`), 1))
  const dayEnd = `${nextDateKey}T00:00:00`
  return task.starts_at < dayEnd && task.ends_at > dayStart
}

function getDayLayout(date, tasks, mode) {
  const dateKey = toDateKey(date)
  const dayTasks = tasks.filter((task) => overlapsDate(task, dateKey))
  const events = layoutOverlappingEvents(
    dayTasks
      .map((task) => getVisibleTaskInterval(task, dateKey))
      .filter(Boolean),
    mode,
  )
  const visibleTaskIds = new Set(events.map((event) => event.task.id))

  return {
    date,
    dateKey,
    events,
    otherTasks: dayTasks.filter((task) => !visibleTaskIds.has(task.id)),
  }
}

function TimedGrid({
  dates,
  tasks,
  mode,
  showDateHeaders = false,
  selectedDate,
  onSelectDate,
  onToggle,
  onView,
}) {
  const dayLayouts = dates.map((date) => getDayLayout(date, tasks, mode))
  const hasOtherTasks = dayLayouts.some((day) => day.otherTasks.length > 0)
  const isWeek = dates.length > 1

  return (
    <div className={`timed-grid${isWeek ? ' is-week' : ' is-day'}`}>
      {showDateHeaders && (
        <div className="timed-grid-header">
          <div className="timed-axis-corner" />
          {dayLayouts.map(({ date, dateKey }) => (
            <button
              type="button"
              className={`timed-date${selectedDate && dateKey === toDateKey(selectedDate) ? ' is-selected' : ''}`}
              key={dateKey}
              onClick={() => onSelectDate(date)}
            >
              <span>{new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(date)}</span>
              <strong>{date.getDate()}</strong>
            </button>
          ))}
        </div>
      )}
      <div className="timed-grid-body">
        <div className="timed-time-axis">
          {hours.map((hour) => (
            <div className="timed-hour-label" key={hour}>{formatHour(hour)}</div>
          ))}
        </div>
        {dayLayouts.map(({ dateKey, events }) => (
          <div className="timed-day" key={dateKey}>
            {hours.map((hour) => <div className="timed-hour-line" key={hour} />)}
            {events.map((event) => {
              const timeLabel = `${formatMinute(event.start)} – ${formatMinute(event.end)}`
              return (
                <TaskItem
                  key={event.task.id}
                  task={event.task}
                  timed
                  showTime={event.duration >= 36}
                  timeLabel={timeLabel}
                  style={getEventPositionStyle(event, mode)}
                  onToggle={onToggle}
                  onView={onView}
                />
              )
            })}
          </div>
        ))}
      </div>
      {hasOtherTasks && (
        <div className="timed-other-row">
          <div className="timed-other-label">Other</div>
          {dayLayouts.map(({ dateKey, otherTasks }) => (
            <div className="timed-other-slot" key={dateKey}>
              {otherTasks.map((task) => (
                <TaskItem key={task.id} task={task} onToggle={onToggle} onView={onView} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default TimedGrid
