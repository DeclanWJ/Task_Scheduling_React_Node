import './CalendarToolbar.css'

function CalendarToolbar({ dateLabel, onToday, onPrevious, onNext }) {
  return (
    <div className="calendar-toolbar">
      <div className="date-heading">
        <span className="view-label">DAY VIEW</span>
        <h2>{dateLabel}</h2>
      </div>
      <div className="date-controls" aria-label="Choose date">
        <button className="button button-subtle today-button" onClick={onToday}>
          Today
        </button>
        <button className="icon-button" aria-label="Previous day" onClick={onPrevious}>
          ‹
        </button>
        <button className="icon-button" aria-label="Next day" onClick={onNext}>
          ›
        </button>
      </div>
    </div>
  )
}

export default CalendarToolbar
