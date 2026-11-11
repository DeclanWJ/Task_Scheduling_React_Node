import { useEffect, useMemo, useState } from 'react'
import './App.css'

const pad = (value) => String(value).padStart(2, '0')

function toDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function formatTime(dateTime) {
  const [hour, minute] = dateTime.slice(11, 16).split(':').map(Number)
  return `${hour % 12 || 12}:${pad(minute)} ${hour < 12 ? 'AM' : 'PM'}`
}

function formatHour(hour) {
  return `${hour % 12 || 12} ${hour < 12 ? 'AM' : 'PM'}`
}

async function request(path, options) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || 'The request could not be completed.')
  }

  return response.status === 204 ? null : response.json()
}

function App() {
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingTask, setEditingTask] = useState(null)
  const [saving, setSaving] = useState(false)

  const dateKey = toDateKey(selectedDate)
  const dateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(selectedDate),
    [selectedDate],
  )

  useEffect(() => {
    const controller = new AbortController()

    request(`/api/tasks?date=${dateKey}`, { signal: controller.signal })
      .then(setTasks)
      .catch((loadError) => {
        if (loadError.name !== 'AbortError') {
          setError(loadError.message)
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      })

    return () => controller.abort()
  }, [dateKey])

  const completedCount = tasks.filter((task) => task.completed).length

  function moveDate(days) {
    setLoading(true)
    setError('')
    setSelectedDate((current) => {
      const next = new Date(current)
      next.setDate(next.getDate() + days)
      return next
    })
  }

  function goToToday() {
    setLoading(true)
    setError('')
    setSelectedDate(new Date())
  }

  function startNewTask() {
    setEditingTask({
      title: '',
      description: '',
      startsAt: `${dateKey}T09:00`,
      endsAt: `${dateKey}T10:00`,
    })
  }

  async function reloadTasks() {
    const updatedTasks = await request(`/api/tasks?date=${dateKey}`)
    setTasks(updatedTasks)
  }

  async function saveTask(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const taskData = {
      title: formData.get('title'),
      description: formData.get('description'),
      startsAt: formData.get('startsAt'),
      endsAt: formData.get('endsAt'),
    }

    setSaving(true)
    setError('')
    try {
      await request(
        editingTask.id ? `/api/tasks/${editingTask.id}` : '/api/tasks',
        {
          method: editingTask.id ? 'PUT' : 'POST',
          body: JSON.stringify(taskData),
        },
      )
      setEditingTask(null)
      await reloadTasks()
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleTask(task) {
    setError('')
    try {
      await request(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ completed: !task.completed }),
      })
      await reloadTasks()
    } catch (updateError) {
      setError(updateError.message)
    }
  }

  async function deleteTask() {
    if (!editingTask?.id || !window.confirm('Delete this task?')) {
      return
    }

    setSaving(true)
    setError('')
    try {
      await request(`/api/tasks/${editingTask.id}`, { method: 'DELETE' })
      setEditingTask(null)
      await reloadTasks()
    } catch (deleteError) {
      setError(deleteError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Daymark home">
          <span className="brand-mark" aria-hidden="true">d</span>
          <span>daymark</span>
        </a>
        <button className="button button-primary" onClick={startNewTask}>
          <span aria-hidden="true">+</span> Add task
        </button>
      </header>

      <main className="main-content">
        <section className="welcome-row">
          <div>
            <p className="eyebrow">YOUR SCHEDULE</p>
            <h1>Make room for what matters.</h1>
          </div>
          <p className="welcome-note">One day at a time.</p>
        </section>

        <section className="calendar-card" aria-label="Daily schedule">
          <div className="calendar-toolbar">
            <div className="date-heading">
              <span className="view-label">DAY VIEW</span>
              <h2>{dateLabel}</h2>
            </div>
            <div className="date-controls" aria-label="Choose date">
              <button
                className="button button-subtle today-button"
                onClick={goToToday}
              >
                Today
              </button>
              <button
                className="icon-button"
                aria-label="Previous day"
                onClick={() => moveDate(-1)}
              >
                ‹
              </button>
              <button
                className="icon-button"
                aria-label="Next day"
                onClick={() => moveDate(1)}
              >
                ›
              </button>
            </div>
          </div>

          <div className="day-summary">
            <span>{tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} planned</span>
            <span>{completedCount} completed</span>
          </div>

          {error && <p className="notice" role="alert">{error}</p>}

          {editingTask && (
            <form className="task-form" onSubmit={saveTask}>
              <div className="form-heading">
                <div>
                  <p className="eyebrow">{editingTask.id ? 'UPDATE YOUR PLAN' : 'MAKE A PLAN'}</p>
                  <h3>{editingTask.id ? 'Edit task' : 'New task'}</h3>
                </div>
                <button
                  type="button"
                  className="icon-button close-button"
                  aria-label="Close task form"
                  onClick={() => setEditingTask(null)}
                >
                  ×
                </button>
              </div>
              <label>
                Task name
                <input name="title" required maxLength="120" defaultValue={editingTask.title} autoFocus />
              </label>
              <label>
                Notes <span className="optional-label">Optional</span>
                <textarea name="description" rows="2" maxLength="1000" defaultValue={editingTask.description} />
              </label>
              <div className="time-fields">
                <label>
                  Starts
                  <input name="startsAt" type="datetime-local" required defaultValue={editingTask.startsAt || editingTask.starts_at?.slice(0, 16)} />
                </label>
                <label>
                  Ends
                  <input name="endsAt" type="datetime-local" required defaultValue={editingTask.endsAt || editingTask.ends_at?.slice(0, 16)} />
                </label>
              </div>
              <div className="form-actions">
                {editingTask.id && (
                  <button type="button" className="button button-danger" onClick={deleteTask} disabled={saving}>
                    Delete task
                  </button>
                )}
                <button type="button" className="button button-subtle" onClick={() => setEditingTask(null)}>
                  Cancel
                </button>
                <button type="submit" className="button button-primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Save task'}
                </button>
              </div>
            </form>
          )}

          <div className="schedule">
            {loading ? (
              <p className="schedule-message">Loading your schedule…</p>
            ) : tasks.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon" aria-hidden="true">✳</span>
                <h3>A little room to breathe.</h3>
                <p>No tasks planned for this day yet.</p>
                <button className="button button-outline" onClick={startNewTask}>Plan something</button>
              </div>
            ) : (
              <>
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
                          <article className={`task-item${task.completed ? ' is-complete' : ''}`} key={task.id}>
                            <button
                              className="task-check"
                              aria-label={task.completed ? `Mark ${task.title} incomplete` : `Complete ${task.title}`}
                              aria-pressed={task.completed}
                              onClick={() => toggleTask(task)}
                            >
                              {task.completed ? '✓' : ''}
                            </button>
                            <button className="task-details" onClick={() => setEditingTask(task)}>
                              <span className="task-title">{task.title}</span>
                              <span className="task-time">{formatTime(task.starts_at)} – {formatTime(task.ends_at)}</span>
                              {task.description && <span className="task-description">{task.description}</span>}
                            </button>
                          </article>
                        ))}
                      </div>
                    </div>
                  )
                })}
                {tasks.some((task) => {
                  const hour = Number(task.starts_at.slice(11, 13))
                  return task.starts_at.slice(0, 10) !== dateKey || hour < 7 || hour >= 23
                }) && (
                  <div className="time-row">
                    <div className="time-label">Other</div>
                    <div className="time-slot">
                      {tasks
                        .filter((task) => {
                          const hour = Number(task.starts_at.slice(11, 13))
                          return task.starts_at.slice(0, 10) !== dateKey || hour < 7 || hour >= 23
                        })
                        .map((task) => (
                          <article className={`task-item${task.completed ? ' is-complete' : ''}`} key={task.id}>
                            <button
                              className="task-check"
                              aria-label={task.completed ? `Mark ${task.title} incomplete` : `Complete ${task.title}`}
                              aria-pressed={task.completed}
                              onClick={() => toggleTask(task)}
                            >
                              {task.completed ? '✓' : ''}
                            </button>
                            <button className="task-details" onClick={() => setEditingTask(task)}>
                              <span className="task-title">{task.title}</span>
                              <span className="task-time">{formatTime(task.starts_at)} – {formatTime(task.ends_at)}</span>
                              {task.description && <span className="task-description">{task.description}</span>}
                            </button>
                          </article>
                        ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
        <footer className="page-footer">Small steps make a meaningful day.</footer>
      </main>
    </div>
  )
}

export default App
