import { NavLink } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

const navClassName = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition ${
    isActive
      ? 'bg-blue-600 text-white'
      : 'bg-white text-slate-700 hover:bg-slate-100'
  }`

function Navbar() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <header
      className={`border-b ${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-900'}`}
    >
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
        <h1 className="text-xl font-bold">StudyBuddy</h1>
        <nav className="flex items-center gap-2">
          <NavLink to="/" className={navClassName}>
            Home
          </NavLink>
          <NavLink to="/form" className={navClassName}>
            Add Task
          </NavLink>
          <NavLink to="/api" className={navClassName}>
            API Resources
          </NavLink>
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            Toggle Theme
          </button>
          <span className="ml-1 text-sm">
            Current Mode: {isDark ? 'Dark' : 'Light'}
          </span>
        </nav>
      </div>
    </header>
  )
}

export default Navbar
