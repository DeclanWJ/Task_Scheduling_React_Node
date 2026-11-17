import './TaskItem.css'

function formatTime(dateTime) {
  const [hour, minute] = dateTime.slice(11, 16).split(':').map(Number)
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`
}

function TaskItem({
  task,
  compact = false,
  timed = false,
  showTime = true,
  timeLabel,
  style,
  onToggle,
  onEdit,
}) {
  return (
    <article
      className={`task-item${task.completed ? ' is-complete' : ''}${compact ? ' is-compact' : ''}${timed ? ' is-timed' : ''}${timed && !showTime ? ' is-short' : ''}`}
      style={{ ...style, '--task-color': task.color || '#83947b' }}
    >
      <button
        type="button"
        className="task-check"
        aria-label={task.completed ? `Mark ${task.title} incomplete` : `Complete ${task.title}`}
        aria-pressed={task.completed}
        onClick={() => onToggle(task)}
      >
        {task.completed ? '✓' : ''}
      </button>
      <button type="button" className="task-details" onClick={() => onEdit(task)}>
        <span className="task-title">{task.title}</span>
        {showTime && (
          <span className="task-time">
            {timeLabel || `${formatTime(task.starts_at)} – ${formatTime(task.ends_at)}`}
          </span>
        )}
        {task.description && <span className="task-description">{task.description}</span>}
      </button>
    </article>
  )
}

export default TaskItem
