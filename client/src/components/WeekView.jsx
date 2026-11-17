import TimedGrid from './TimedGrid.jsx'
import './WeekView.css'

function WeekView({ dates, tasks, selectedDate, onSelectDate, onToggle, onEdit }) {
  return (
    <div className="week-scroll" role="region" aria-label="Weekly schedule" tabIndex={0}>
      <TimedGrid
        dates={dates}
        tasks={tasks}
        mode="stack"
        showDateHeaders
        selectedDate={selectedDate}
        onSelectDate={onSelectDate}
        onToggle={onToggle}
        onEdit={onEdit}
      />
    </div>
  )
}

export default WeekView
