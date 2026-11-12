import { addDays, toDateKey } from '../utils/calendar.js'
import TaskItem from './TaskItem.jsx'
import './WeekView.css'

function dayName(date) {
  return new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(date)
}

function dayTasks(tasks, date) {
  const dateKey = toDateKey(date)
  const nextDateKey = toDateKey(addDays(date, 1))
  return tasks.filter(
    (task) =>
      task.starts_at < `${nextDateKey}T00:00:00` &&
      task.ends_at > `${dateKey}T00:00:00`,
  )
}

function WeekView({ dates, tasks, selectedDate, onSelectDate, onToggle, onEdit }) {
  const hours = Array.from({ length: 16 }, (_, index) => index + 7)

  return (
    <div className="week-scroll" role="region" aria-label="Weekly schedule" tabIndex={0}>
      <div className="week-grid">
        <div className="week-corner" />
        {dates.map((date) => {
          const dateKey = toDateKey(date)
          return (
            <button
              type="button"
              className={`week-date${dateKey === toDateKey(selectedDate) ? ' is-selected' : ''}`}
              key={dateKey}
              onClick={() => onSelectDate(date)}
            >
              <span>{dayName(date)}</span>
              <strong>{date.getDate()}</strong>
            </button>
          )
        })}
        {hours.map((hour) => (
          <div className="week-row" key={hour}>
            <div className="week-hour">{`${hour % 12 || 12} ${hour < 12 ? 'AM' : 'PM'}`}</div>
            {dates.map((date) => {
              const dateKey = toDateKey(date)
              const hourTasks = tasks.filter(
                (task) =>
                  task.starts_at.slice(0, 10) === dateKey &&
                  Number(task.starts_at.slice(11, 13)) === hour,
              )
              return (
                <div className="week-slot" key={dateKey}>
                  {hourTasks.map((task) => (
                    <TaskItem key={task.id} task={task} onToggle={onToggle} onEdit={onEdit} />
                  ))}
                </div>
              )
            })}
          </div>
        ))}
        <div className="week-row" key="other">
          <div className="week-hour">Other</div>
          {dates.map((date) => {
            const dateKey = toDateKey(date)
            const otherTasks = dayTasks(tasks, date).filter((task) => {
              const startDate = task.starts_at.slice(0, 10)
              const hour = Number(task.starts_at.slice(11, 13))
              return startDate !== dateKey || hour < 7 || hour >= 23
            })
            return (
              <div className="week-slot" key={dateKey}>
                {otherTasks.map((task) => (
                  <TaskItem key={task.id} task={task} onToggle={onToggle} onEdit={onEdit} />
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default WeekView
