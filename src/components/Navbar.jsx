import { Link, NavLink } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useTheme } from '../context/ThemeContext'
import { logout } from '../store/userSlice'

const navClassName = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition ${
    isActive
      ? 'bg-blue-600 text-white'
      : 'bg-white text-slate-700 hover:bg-slate-100'
  }`

function Navbar() {
  const dispatch = useDispatch()
  const { user, isLoggedIn } = useSelector((state) => state.user)
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <header
      className={`border-b ${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-900'}`}
    >
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
        <Link to="/home" className="text-xl font-bold transition hover:opacity-80">
          StudyBuddy
        </Link>
        <nav className="flex items-center gap-2">
          <NavLink to="/home" className={navClassName}>
            Home
          </NavLink>
          <NavLink to="/form" className={navClassName}>
            Add Task
          </NavLink>
          <NavLink to="/api" className={navClassName}>
            Resources
          </NavLink>
          <NavLink to="/moodle-sync" className={navClassName}>
            Moodle Sync
          </NavLink>
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            {isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          </button>
          <span className="ml-1 text-sm font-medium">
            {isLoggedIn ? `Hello, ${user?.name ?? 'Student'}` : 'Guest'}
          </span>
          {isLoggedIn ? (
            <button
              type="button"
              onClick={() => dispatch(logout())}
              className="rounded-md bg-rose-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-rose-700"
            >
              Logout
            </button>
          ) : null}
        </nav>
      </div>
    </header>
  )
}

export default Navbar
