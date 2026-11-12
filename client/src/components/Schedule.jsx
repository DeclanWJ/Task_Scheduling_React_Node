import TaskItem from './TaskItem.jsx'
import './Schedule.css'

function formatHour(hour) {
  return `${hour % 12 || 12} ${hour < 12 ? 'AM' : 'PM'}`
}

function Schedule({ tasks, dateKey, loading, onCreate, onToggle, onEdit }) {
  if (loading) {
    return (
      <div className="schedule">
        <p className="schedule-message">Loading your schedule…</p>
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="schedule">
        <div className="empty-state">
          <span className="empty-icon" aria-hidden="true">✳</span>
          <h3>A little room to breathe.</h3>
          <p>No tasks planned for this day yet.</p>
          <button className="button button-outline" onClick={onCreate}>Plan something</button>
        </div>
      </div>
    )
  }

  const otherTasks = tasks.filter((task) => {
    const hour = Number(task.starts_at.slice(11, 13))
    return task.starts_at.slice(0, 10) !== dateKey || hour < 7 || hour >= 23
  })

  return (
    <div className="schedule">
      {Array.from({ length: 16 }, (_, index) => index + 7).map((hour) => {
        const hourTasks = tasks.filter(
          (task) =>
            task.starts_at.slice(0, 10) === dateKey &&
            Number(task.starts_at.slice(11, 13)) === hour,
        )

        return (
          <div className="time-row" key={hour}>
            <div className="time-label">{formatHour(hour)}</div>
            <div className="time-slot">
              {hourTasks.map((task) => (
                <TaskItem key={task.id} task={task} onToggle={onToggle} onEdit={onEdit} />
              ))}
            </div>
          </div>
        )
      })}
      {otherTasks.length > 0 && (
        <div className="time-row">
          <div className="time-label">Other</div>
          <div className="time-slot">
            {otherTasks.map((task) => (
              <TaskItem key={task.id} task={task} onToggle={onToggle} onEdit={onEdit} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Schedule
