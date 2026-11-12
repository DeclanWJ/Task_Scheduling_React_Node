import { addDays, getMonthGridDates, toDateKey } from '../utils/calendar.js'
import TaskItem from './TaskItem.jsx'
import './MonthView.css'

const weekDays = Array.from({ length: 7 }, (_, index) => {
  const date = addDays(new Date(2024, 0, 1), index)
  return new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(date)
})

function tasksForDate(tasks, date) {
  const dateKey = toDateKey(date)
  const nextDateKey = toDateKey(addDays(date, 1))
  return tasks.filter(
    (task) =>
      task.starts_at < `${nextDateKey}T00:00:00` &&
      task.ends_at > `${dateKey}T00:00:00`,
  )
}

function MonthView({ date, selectedDate, todayKey, tasks, onSelectDate, onToggle, onEdit }) {
  const dates = getMonthGridDates(date)
  const selectedDateKey = toDateKey(selectedDate)

  return (
    <div className="month-scroll" role="region" aria-label="Monthly schedule" tabIndex={0}>
      <div className="month-grid">
        {weekDays.map((weekDay) => (
          <div className="month-weekday" key={weekDay}>{weekDay}</div>
        ))}
        {dates.map((cellDate) => {
          const dateKey = toDateKey(cellDate)
          const cellTasks = tasksForDate(tasks, cellDate)
          const isCurrentMonth = cellDate.getMonth() === date.getMonth()

          return (
            <div
              className={`month-cell${isCurrentMonth ? '' : ' is-outside-month'}`}
              key={dateKey}
            >
              <button
                type="button"
                className={`month-date${dateKey === todayKey ? ' is-today' : ''}${dateKey === selectedDateKey ? ' is-selected' : ''}`}
                aria-label={new Intl.DateTimeFormat(undefined, {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                }).format(cellDate)}
                aria-pressed={dateKey === selectedDateKey}
                onClick={() => onSelectDate(cellDate)}
              >
                {cellDate.getDate()}
              </button>
              <div className="month-events">
                {cellTasks.slice(0, 3).map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    compact
                    onToggle={onToggle}
                    onEdit={onEdit}
                  />
                ))}
                {cellTasks.length > 3 && (
                  <span className="month-more">+{cellTasks.length - 3} more</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MonthView
