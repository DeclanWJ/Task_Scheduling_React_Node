import './AppHeader.css'

function AppHeader({ onAddTask }) {
  return (
    <header className="topbar">
      <a className="brand" href="/" aria-label="DJ's Tasks home">
        <span className="brand-mark" aria-hidden="true">DJ</span>
        <span>DJ's Tasks</span>
      </a>
      <button className="button button-primary add-task-button" onClick={onAddTask}>
        <span aria-hidden="true">+</span> Add task
      </button>
    </header>
  )
}

export default AppHeader
