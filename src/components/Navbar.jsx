import { NavLink } from 'react-router-dom'

const navClassName = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition ${
    isActive
      ? 'bg-blue-600 text-white'
      : 'bg-white text-slate-700 hover:bg-slate-100'
  }`

function Navbar() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
        <h1 className="text-xl font-bold">StudyBuddy</h1>
        <nav className="flex gap-2">
          <NavLink to="/" className={navClassName}>
            Home
          </NavLink>
          <NavLink to="/form" className={navClassName}>
            Add Task
          </NavLink>
          <NavLink to="/api" className={navClassName}>
            API Resources
          </NavLink>
        </nav>
      </div>
    </header>
  )
}

export default Navbar
