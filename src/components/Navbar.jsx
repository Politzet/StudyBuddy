import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useTheme } from '../context/ThemeContext'
import { logout } from '../store/userSlice'

const navClassName = (isDark) => ({ isActive }) =>
  `px-2 py-1 text-sm font-semibold transition border-b-2 border-transparent ${
    isActive
      ? isDark
        ? 'rounded-md border border-[#8b6a4d]/70 bg-[#4b372c]/80 text-[#f3e6cf] shadow-[0_3px_10px_rgba(0,0,0,0.28)]'
        : 'rounded-md border border-[#c5ae98]/80 bg-[#f2e6d9]/88 text-[#4a352a] shadow-[0_3px_10px_rgba(108,74,49,0.18)]'
      : isDark
        ? 'text-[#f1dfb3] hover:text-[#ffe9c9] hover:border-[#d7ba86]/70'
        : 'text-[#3f3127] hover:text-[#2e2219] hover:border-[#b99474]/70'
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
  const appLogoSrc = '/images/homepage logo.png'
  const homeDropdownTriggerClass = isDark
    ? 'rounded-md border border-[#a68467]/55 bg-[#4a372b]/55 px-3 py-1.5 text-sm font-semibold text-[#f6e9d5] transition hover:bg-[#5a4335]/70'
    : 'rounded-md border border-[#c2a485]/70 bg-[#f6ecdf]/65 px-3 py-1.5 text-sm font-semibold text-[#5a3f2f] transition hover:bg-[#efe2d2]/80'
  const homeDropdownMenuClass = isDark
    ? 'border-[#a68467]/55 bg-[#4a372b]/55'
    : 'border-[#c2a485]/70 bg-[#f6ecdf]/65'
  const homeDropdownSelectedItemClass = isDark
    ? 'bg-[#6c4f3e]/85 text-[#f6e9d5]'
    : 'bg-[#9a7459]/95 text-[#fff7ee]'
  const homeDropdownItemClass = isDark
    ? 'text-[#f5e7db] hover:bg-[#3a2d26]/60'
    : 'text-[#5a463b] hover:bg-[#f1e2d5]/80'

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
      className={`relative z-50 border-b backdrop-blur-md ${
        isDark
          ? 'border-[#5a463b]/45 bg-[#2d221d]/12 text-[#f6ede6]'
          : 'border-[#d7c5b7]/50 bg-[#fff8f1]/12 text-[#453434]'
      }`}
    >
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/home" className="inline-flex items-center transition hover:opacity-90">
          <img
            src={appLogoSrc}
            alt="StudyBuddy"
            className={`h-9 w-auto object-contain sm:h-10 ${
              isDark
                ? 'brightness-[1.34] contrast-[1.22] saturate-[1.1] drop-shadow-[0_0_16px_rgba(255,232,182,0.46)]'
                : ''
            }`}
          />
        </Link>
        <nav className="relative z-50 flex items-center gap-2">
          <div className="relative" ref={homeMenuRef}>
            <button
              type="button"
              onClick={() => setIsHomeMenuOpen((prev) => !prev)}
              aria-expanded={isHomeMenuOpen}
              aria-haspopup="menu"
              className={`${homeDropdownTriggerClass} ${isHomeMenuActive ? 'shadow-[0_3px_10px_rgba(108,74,49,0.18)]' : ''}`}
            >
              Home ▾
            </button>
            {isHomeMenuOpen ? (
              <div
                className={`absolute left-0 top-full z-[100] mt-2 w-52 rounded-lg border p-1 shadow-2xl ${homeDropdownMenuClass}`}
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
                      `block rounded-md px-3 py-2 text-sm ${
                        isActive ? homeDropdownSelectedItemClass : homeDropdownItemClass
                      }`
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
            className={`px-2 py-1 text-sm font-semibold transition border-b-2 border-transparent ${
              isDark
                ? 'text-[#f1dfb3] hover:text-[#ffe9c9] hover:border-[#d7ba86]/70'
                : 'text-[#3f3127] hover:text-[#2e2219] hover:border-[#b99474]/70'
            }`}
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
              className="px-2 py-1 text-sm font-semibold text-[#7c2d2d] transition hover:border-b-2 hover:border-[#7c2d2d]/70 hover:text-[#5f1f1f]"
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
