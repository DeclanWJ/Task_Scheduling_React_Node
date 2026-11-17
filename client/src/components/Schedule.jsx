import TimedGrid from './TimedGrid.jsx'
import './Schedule.css'

function Schedule({ tasks, date, loading, onCreate, onToggle, onEdit }) {
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

  return (
    <div className="schedule">
      <TimedGrid
        dates={[date]}
        tasks={tasks}
        mode="columns"
        onToggle={onToggle}
        onEdit={onEdit}
      />
    </div>
  )
}

export default Schedule
