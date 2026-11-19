import './TaskDetails.css'

function formatSchedule(task) {
  const startsAt = new Date(task.starts_at)
  const endsAt = new Date(task.ends_at)
  const dateFormatter = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  const timeFormatter = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
  const startDate = dateFormatter.format(startsAt)
  const startTime = timeFormatter.format(startsAt)
  const endTime = timeFormatter.format(endsAt)

  if (startsAt.toDateString() === endsAt.toDateString()) {
    return `${startDate} · ${startTime} – ${endTime}`
  }

  return `${startDate}, ${startTime} – ${dateFormatter.format(endsAt)}, ${endTime}`
}

function TaskDetails({ task, onEdit, onToggle, onClose }) {
  return (
    <section className="task-detail-panel" aria-label="Task details">
      <div className="task-detail-heading">
        <div>
          <p className="eyebrow">TASK DETAILS</p>
          <h3>{task.title}</h3>
        </div>
        <button type="button" className="button button-subtle" onClick={onClose}>
          Close
        </button>
      </div>
      <p className="task-detail-time">{formatSchedule(task)}</p>
      <p className="task-detail-description">
        {task.description || 'No description added.'}
      </p>
      <div className="task-detail-actions">
        <span className="task-detail-status">
          {task.completed ? 'Completed' : 'Not completed'}
        </span>
        <div className="task-detail-buttons">
          <button
            type="button"
            className="button button-subtle"
            onClick={() => onToggle(task)}
          >
            {task.completed ? 'Mark incomplete' : 'Mark complete'}
          </button>
          <button type="button" className="button button-primary" onClick={onEdit}>
            Edit task
          </button>
        </div>
      </div>
    </section>
  )
}

export default TaskDetails
