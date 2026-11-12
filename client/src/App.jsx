import { useEffect, useMemo, useState } from 'react'
import {
  createTask,
  deleteTask as removeTask,
  getTasks,
  getTasksInRange,
  setTaskCompleted,
  updateTask,
} from './api/tasks.js'
import AppHeader from './components/AppHeader.jsx'
import CalendarToolbar from './components/CalendarToolbar.jsx'
import MonthView from './components/MonthView.jsx'
import Schedule from './components/Schedule.jsx'
import TaskForm from './components/TaskForm.jsx'
import WelcomeSection from './components/WelcomeSection.jsx'
import WeekView from './components/WeekView.jsx'
import { addDays, addMonths, getMonthGridDates, getWeekDates, toDateKey } from './utils/calendar.js'
import './App.css'

function datesForView(date, viewMode) {
  if (viewMode === 'week') {
    return getWeekDates(date)
  }
  if (viewMode === 'month') {
    return getMonthGridDates(date)
  }
  return [date]
}

function App() {
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [todayKey] = useState(() => toDateKey(new Date()))
  const [viewMode, setViewMode] = useState('day')
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingTask, setEditingTask] = useState(null)
  const [saving, setSaving] = useState(false)

  const dateKey = toDateKey(selectedDate)
  const periodDates = useMemo(
    () => datesForView(selectedDate, viewMode),
    [selectedDate, viewMode],
  )
  const rangeStart = toDateKey(periodDates[0])
  const rangeEnd = toDateKey(periodDates[periodDates.length - 1])
  const dateLabel = useMemo(
    () => {
      if (viewMode === 'month') {
        return new Intl.DateTimeFormat(undefined, {
          month: 'long',
          year: 'numeric',
        }).format(selectedDate)
      }

      if (viewMode === 'week') {
        const start = new Intl.DateTimeFormat(undefined, {
          month: 'short',
          day: 'numeric',
        }).format(periodDates[0])
        const end = new Intl.DateTimeFormat(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }).format(periodDates[6])
        return `${start} – ${end}`
      }

      return new Intl.DateTimeFormat(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(selectedDate)
    },
    [periodDates, selectedDate, viewMode],
  )

  useEffect(() => {
    const controller = new AbortController()
    const taskRequest =
      viewMode === 'day'
        ? getTasks(rangeStart, { signal: controller.signal })
        : getTasksInRange(rangeStart, rangeEnd, { signal: controller.signal })

    taskRequest
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
  }, [rangeEnd, rangeStart, viewMode])

  const completedCount = tasks.filter((task) => task.completed).length

  function selectDate(date, nextViewMode = viewMode) {
    const nextPeriodDates = datesForView(date, nextViewMode)
    const nextRangeStart = toDateKey(nextPeriodDates[0])
    const nextRangeEnd = toDateKey(nextPeriodDates[nextPeriodDates.length - 1])

    if (
      nextViewMode !== viewMode ||
      nextRangeStart !== rangeStart ||
      nextRangeEnd !== rangeEnd
    ) {
      setLoading(true)
    }
    setError('')
    setSelectedDate(date)
    setViewMode(nextViewMode)
  }

  function movePeriod(direction) {
    const nextDate =
      viewMode === 'day'
        ? addDays(selectedDate, direction)
        : viewMode === 'week'
          ? addDays(selectedDate, direction * 7)
          : addMonths(selectedDate, direction)
    selectDate(nextDate)
  }

  function goToToday() {
    selectDate(new Date())
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
    const updatedTasks =
      viewMode === 'day'
        ? await getTasks(dateKey)
        : await getTasksInRange(rangeStart, rangeEnd)
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
        <section className="calendar-card" aria-label="Calendar schedule">
          <CalendarToolbar
            dateLabel={dateLabel}
            viewMode={viewMode}
            onViewModeChange={(nextViewMode) => selectDate(selectedDate, nextViewMode)}
            onToday={goToToday}
            onPrevious={() => movePeriod(-1)}
            onNext={() => movePeriod(1)}
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
          {viewMode === 'day' && (
            <Schedule
              tasks={tasks}
              dateKey={dateKey}
              loading={loading}
              onCreate={startNewTask}
              onToggle={toggleTask}
              onEdit={setEditingTask}
            />
          )}
          {viewMode === 'week' && !loading && (
            <WeekView
              dates={periodDates}
              tasks={tasks}
              selectedDate={selectedDate}
              onSelectDate={(date) => selectDate(date, 'day')}
              onToggle={toggleTask}
              onEdit={setEditingTask}
            />
          )}
          {viewMode === 'month' && !loading && (
            <MonthView
              date={selectedDate}
              selectedDate={selectedDate}
              todayKey={todayKey}
              tasks={tasks}
              onSelectDate={selectDate}
              onToggle={toggleTask}
              onEdit={setEditingTask}
            />
          )}
          {viewMode !== 'day' && loading && (
            <p className="period-loading">Loading your schedule…</p>
          )}
        </section>
        <footer className="page-footer">Small steps make a meaningful day.</footer>
      </main>
    </div>
  )
}

export default App
