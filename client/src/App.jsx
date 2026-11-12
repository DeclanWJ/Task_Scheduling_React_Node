import { useEffect, useMemo, useState } from 'react'
import {
  createTask,
  deleteTask as removeTask,
  getTasks,
  setTaskCompleted,
  updateTask,
} from './api/tasks.js'
import AppHeader from './components/AppHeader.jsx'
import CalendarToolbar from './components/CalendarToolbar.jsx'
import Schedule from './components/Schedule.jsx'
import TaskForm from './components/TaskForm.jsx'
import WelcomeSection from './components/WelcomeSection.jsx'
import './App.css'

const pad = (value) => String(value).padStart(2, '0')

function toDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
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

    getTasks(dateKey, { signal: controller.signal })
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
    const updatedTasks = await getTasks(dateKey)
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
      if (editingTask.id) {
        await updateTask(editingTask.id, taskData)
      } else {
        await createTask(taskData)
      }
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
      await setTaskCompleted(task.id, !task.completed)
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
      await removeTask(editingTask.id)
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
      <AppHeader onAddTask={startNewTask} />
      <main className="main-content">
        <WelcomeSection />
        <section className="calendar-card" aria-label="Daily schedule">
          <CalendarToolbar
            dateLabel={dateLabel}
            onToday={goToToday}
            onPrevious={() => moveDate(-1)}
            onNext={() => moveDate(1)}
          />
          <div className="day-summary">
            <span>{tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} planned</span>
            <span>{completedCount} completed</span>
          </div>
          {error && <p className="notice" role="alert">{error}</p>}
          {editingTask && (
            <TaskForm
              task={editingTask}
              saving={saving}
              onSubmit={saveTask}
              onDelete={deleteTask}
              onClose={() => setEditingTask(null)}
            />
          )}
          <Schedule
            tasks={tasks}
            dateKey={dateKey}
            loading={loading}
            onCreate={startNewTask}
            onToggle={toggleTask}
            onEdit={setEditingTask}
          />
        </section>
        <footer className="page-footer">Small steps make a meaningful day.</footer>
      </main>
    </div>
  )
}

export default App
