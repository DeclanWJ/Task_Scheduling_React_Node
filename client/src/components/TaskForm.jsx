import './TaskForm.css'

function TaskForm({ task, saving, onSubmit, onDelete, onClose }) {
  const isEditing = Boolean(task.id)

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
      <div className="form-actions">
        {isEditing && (
          <button type="button" className="button button-danger" onClick={onDelete} disabled={saving}>
            Delete task
          </button>
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
