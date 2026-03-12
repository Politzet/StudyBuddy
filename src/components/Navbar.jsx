import { Link, NavLink } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useTheme } from '../context/ThemeContext'
import { logout } from '../store/userSlice'

const navClassName = (isDark) => ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition ${
    isActive
      ? isDark
        ? 'bg-[#8b6b57] text-white'
        : 'bg-[#8b6b57] text-white'
      : isDark
        ? 'bg-[#3a2d26]/90 text-[#f5e7db] hover:bg-[#4a382f]'
        : 'bg-[#fff7ef] text-[#5a463b] hover:bg-[#f1e2d5]'
  }`

function Navbar() {
  const dispatch = useDispatch()
  const { user, isLoggedIn } = useSelector((state) => state.user)
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <header
      className={`border-b backdrop-blur-sm ${
        isDark
          ? 'border-[#5a463b] bg-[#2d221d]/90 text-[#f6ede6]'
          : 'border-[#d7c5b7] bg-[#fff8f1]/90 text-[#453434]'
      }`}
    >
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
        <Link to="/home" className="text-xl font-bold transition hover:opacity-80">
          StudyBuddy
        </Link>
        <nav className="flex items-center gap-2">
          <NavLink to="/home" className={navClassName(isDark)}>
            Home
          </NavLink>
          <NavLink to="/form" className={navClassName(isDark)}>
            Add Task
          </NavLink>
          <NavLink to="/api" className={navClassName(isDark)}>
            Resources
          </NavLink>
          <NavLink to="/moodle-sync" className={navClassName(isDark)}>
            Moodle Sync
          </NavLink>
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-md bg-[#8b6b57] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#785845]"
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
              className="rounded-md bg-[#6f3f3f] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#5d3434]"
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
