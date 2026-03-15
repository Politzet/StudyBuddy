import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useTheme } from '../context/ThemeContext'
import { logout } from '../store/userSlice'

const navClassName = (isDark) => ({ isActive }) =>
  `academy-btn rounded-md px-3 py-2 text-sm font-medium transition ${
    isActive
      ? isDark
        ? 'bg-[#8b6b57] text-[#f3e6cf]'
        : 'bg-[#8b6b57] text-[#f3e6cf]'
      : isDark
        ? 'bg-[#3a2d26]/90 text-[#f1dfb3] hover:bg-[#4a382f]'
        : 'bg-[#f4eae0] text-[#2a3748] hover:bg-[#f1e2d5]'
  }`

function Navbar() {
  const dispatch = useDispatch()
  const location = useLocation()
  const { user, isLoggedIn } = useSelector((state) => state.user)
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  const [isHomeMenuOpen, setIsHomeMenuOpen] = useState(false)
  const homeMenuRef = useRef(null)
  const homeRoutes = ['/home', '/tasks', '/exams', '/projects', '/other']
  const isHomeMenuActive = homeRoutes.includes(location.pathname)

  const handleLogout = () => {
    if (!window.confirm('Are you sure you want to logout?')) {
      return
    }
    dispatch(logout())
  }

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!homeMenuRef.current?.contains(event.target)) {
        setIsHomeMenuOpen(false)
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsHomeMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  return (
    <header
      className={`relative z-50 border-b backdrop-blur-sm ${
        isDark
          ? 'border-[#5a463b] bg-[#2d221d]/90 text-[#f6ede6]'
          : 'border-[#d7c5b7] bg-[#fff8f1]/90 text-[#453434]'
      }`}
    >
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
        <Link to="/home" className="text-xl font-bold transition hover:opacity-80">
          StudyBuddy
        </Link>
        <nav className="relative z-50 flex items-center gap-2">
          <div className="relative" ref={homeMenuRef}>
            <button
              type="button"
              onClick={() => setIsHomeMenuOpen((prev) => !prev)}
              aria-expanded={isHomeMenuOpen}
              aria-haspopup="menu"
              className={`academy-btn rounded-md px-3 py-2 text-sm font-medium transition ${
                isHomeMenuActive
                  ? 'bg-[#8b6b57] text-[#f3e6cf]'
                  : isDark
                    ? 'bg-[#3a2d26]/90 text-[#f1dfb3] hover:bg-[#4a382f]'
                    : 'bg-[#f4eae0] text-[#2a3748] hover:bg-[#f1e2d5]'
              }`}
            >
              Home ▾
            </button>
            {isHomeMenuOpen ? (
              <div
                className={`absolute left-0 top-full z-[100] mt-2 w-52 rounded-lg border p-1 shadow-2xl ${
                  isDark
                    ? 'border-[#8b6a4d] bg-[#2d241e]'
                    : 'border-[#d7c5b7] bg-[#f4eae0]'
                }`}
              >
                {[
                  { label: 'Dashboard Home', to: '/home' },
                  { label: 'Tasks', to: '/tasks' },
                  { label: 'Exams', to: '/exams' },
                  { label: 'Projects', to: '/projects' },
                  { label: 'Other', to: '/other' },
                ].map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsHomeMenuOpen(false)}
                    className={({ isActive }) =>
                      `block rounded-md px-3 py-2 text-sm ${isActive ? 'bg-[#8b6b57] text-white' : isDark ? 'text-[#f5e7db] hover:bg-[#3a2d26]' : 'text-[#5a463b] hover:bg-[#f1e2d5]'}`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            ) : null}
          </div>
          <NavLink to="/api" className={navClassName(isDark)}>
            Resources
          </NavLink>
          <NavLink to="/moodle-sync" className={navClassName(isDark)}>
            Moodle Sync
          </NavLink>
          <button
            type="button"
            onClick={toggleTheme}
            className="academy-btn academy-spell-toggle rounded-md px-3 py-2 text-sm font-medium transition"
          >
            {isDark ? 'Lumos' : 'Nox'}
          </button>
          <span className="ml-1 text-sm font-medium">
            {isLoggedIn ? `Hello, ${user?.name ?? 'Student'}` : 'Guest'}
          </span>
          {isLoggedIn ? (
            <button
              type="button"
              onClick={handleLogout}
              className="academy-btn rounded-md bg-[#6f3f3f] px-3 py-2 text-sm font-medium text-[#f3e6cf] transition hover:bg-[#5d3434]"
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
