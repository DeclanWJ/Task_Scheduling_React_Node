import TimedGrid from './TimedGrid.jsx'
import './WeekView.css'

function WeekView({ dates, tasks, selectedDate, onSelectDate, onToggle, onView }) {
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
        onView={onView}
      />
    </div>
  )
}

export default WeekView
