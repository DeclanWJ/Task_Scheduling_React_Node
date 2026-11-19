import { useState } from 'react'
import './TaskForm.css'

function TaskForm({
  task,
  saving,
  onSubmit,
  onDelete,
  onDeleteAllOccurrences,
  onClose,
}) {
  const isEditing = Boolean(task.id)
  const [repeatMode, setRepeatMode] = useState('none')
  const [selectedWeekdays, setSelectedWeekdays] = useState(() => {
    const startDate = task.startsAt || task.starts_at
    const weekday = new Date(`${startDate.slice(0, 10)}T00:00:00Z`).getUTCDay()
    return [weekday]
  })
  const startDate = task.startsAt || task.starts_at
  const repeatUntil = new Date(`${startDate.slice(0, 10)}T00:00:00Z`)
  repeatUntil.setUTCDate(repeatUntil.getUTCDate() + 28)
  const repeatUntilValue = repeatUntil.toISOString().slice(0, 10)
  const weekdays = [
    { value: 0, label: 'Sun' },
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' },
  ]

  return (
    <form className="task-form" onSubmit={onSubmit}>
      <div className="form-heading">
        <div>
          <p className="eyebrow">{isEditing ? 'UPDATE YOUR PLAN' : 'MAKE A PLAN'}</p>
          <h3>{isEditing ? 'Edit task' : 'New task'}</h3>
        </div>
        <button
          type="button"
          className="icon-button close-button"
          aria-label="Close task form"
          onClick={onClose}
        >
          ×
        </button>
      </div>
      <label>
        Task name
        <input name="title" required maxLength="120" defaultValue={task.title} autoFocus />
      </label>
      <label>
        Notes <span className="optional-label">Optional</span>
        <textarea name="description" rows="2" maxLength="1000" defaultValue={task.description} />
      </label>
      <div className="time-fields">
        <label>
          Starts
          <input
            name="startsAt"
            type="datetime-local"
            required
            defaultValue={task.startsAt || task.starts_at?.slice(0, 16)}
          />
        </label>
        <label>
          Ends
          <input
            name="endsAt"
            type="datetime-local"
            required
            defaultValue={task.endsAt || task.ends_at?.slice(0, 16)}
          />
        </label>
      </div>
      {!isEditing && (
        <div className="repeat-fields">
          <label>
            Repeat
            <select
              name="repeat"
              value={repeatMode}
              onChange={(event) => setRepeatMode(event.target.value)}
            >
              <option value="none">Does not repeat</option>
              <option value="daily">Every day</option>
              <option value="weekdays">Every weekday (Mon–Fri)</option>
              <option value="weekly">Custom days each week</option>
            </select>
          </label>
          {repeatMode !== 'none' && (
            <label>
              Repeat until
              <input
                name="repeatUntil"
                type="date"
                required
                defaultValue={repeatUntilValue}
              />
            </label>
          )}
          {repeatMode === 'weekly' && (
            <fieldset className="weekday-picker">
              <legend>Repeat on</legend>
              <div className="weekday-options">
                {weekdays.map(({ value, label }) => (
                  <label key={value}>
                    <input
                      type="checkbox"
                      name="repeatDays"
                      value={value}
                      checked={selectedWeekdays.includes(value)}
                      onChange={() => {
                        setSelectedWeekdays((current) =>
                          current.includes(value)
                            ? current.filter((day) => day !== value)
                            : [...current, value],
                        )
                      }}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
        </div>
      )}
      <div className="form-actions">
        {isEditing && (
          <div className="delete-actions">
            <button type="button" className="button button-danger" onClick={onDelete} disabled={saving}>
              Delete task
            </button>
            {task.series_id && (
              <button
                type="button"
                className="button button-danger"
                onClick={onDeleteAllOccurrences}
                disabled={saving}
              >
                Delete all occurrences
              </button>
            )}
          </div>
        )}
        <button type="button" className="button button-subtle" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="button button-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save task'}
        </button>
      </div>
    </form>
  )
}

export default TaskForm
