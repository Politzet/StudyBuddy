import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useTheme } from '../context/ThemeContext'
import { login, logout } from '../store/userSlice'

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
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [loginName, setLoginName] = useState('')

  const handleLoginSubmit = (event) => {
    event.preventDefault()
    const trimmedName = loginName.trim()

    if (!trimmedName) {
      return
    }

    dispatch(login({ name: trimmedName }))
    setLoginName('')
    setIsLoginOpen(false)
  }

  return (
    <>
      <header
        className={`border-b ${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-900'}`}
      >
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-xl font-bold transition hover:opacity-80">
            StudyBuddy
          </Link>
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
              {isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            </button>
            <span className="ml-1 text-sm font-medium">
              {isLoggedIn ? `Hello, ${user?.name ?? 'Student'}` : 'Guest'}
            </span>
            {isLoggedIn ? (
              <>
                <button
                  type="button"
                  onClick={() => dispatch(logout())}
                  className="rounded-md bg-rose-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-rose-700"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsLoginOpen(true)}
                className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
              >
                Login
              </button>
            )}
          </nav>
        </div>
      </header>

      {isLoginOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-sm">
          <div
            className={`w-full max-w-md rounded-xl border p-6 shadow-xl ${
              isDark
                ? 'border-slate-700 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-900'
            }`}
          >
            <h3 className="text-xl font-semibold">Login</h3>
            <p className={`mt-1 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Enter your name to continue.
            </p>

            <form onSubmit={handleLoginSubmit} className="mt-4">
              <input
                type="text"
                value={loginName}
                onChange={(event) => setLoginName(event.target.value)}
                placeholder="Your name"
                className={`w-full rounded-md border px-3 py-2 focus:border-blue-500 focus:outline-none ${
                  isDark
                    ? 'border-slate-600 bg-slate-800 text-white'
                    : 'border-slate-300 bg-white text-slate-900'
                }`}
              />
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsLoginOpen(false)}
                  className="rounded-md bg-slate-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
                >
                  Login
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}

export default Navbar
