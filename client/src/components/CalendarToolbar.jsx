import './CalendarToolbar.css'

const views = ['day', 'week', 'month']

function CalendarToolbar({
  dateLabel,
  viewMode,
  onViewModeChange,
  onToday,
  onPrevious,
  onNext,
}) {
  return (
    <div className="calendar-toolbar">
      <div className="date-heading">
        <span className="view-label">{viewMode.toUpperCase()} VIEW</span>
        <h2>{dateLabel}</h2>
      </div>
      <div className="calendar-actions">
        <div className="date-controls" aria-label="Choose date">
          <button type="button" className="button button-subtle today-button" onClick={onToday}>
            Today
          </button>
          <button type="button" className="icon-button" aria-label="Previous period" onClick={onPrevious}>
            ‹
          </button>
          <button type="button" className="icon-button" aria-label="Next period" onClick={onNext}>
            ›
          </button>
        </div>
        <div className="view-switcher" role="group" aria-label="Calendar view">
          {views.map((view) => (
            <button
              type="button"
              className={`view-option${viewMode === view ? ' is-selected' : ''}`}
              aria-pressed={viewMode === view}
              key={view}
              onClick={() => onViewModeChange(view)}
            >
              {view[0].toUpperCase() + view.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default CalendarToolbar
