import { NavLink, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import AddTaskPage from './pages/AddTaskPage'
import ResourcesPage from './pages/ResourcesPage'

const navClassName = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition ${
    isActive
      ? 'bg-blue-600 text-white'
      : 'bg-white text-slate-700 hover:bg-slate-100'
  }`

function App() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold">StudyBuddy</h1>
          <nav className="flex gap-2">
            <NavLink to="/" className={navClassName}>
              Home
            </NavLink>
            <NavLink to="/add-task" className={navClassName}>
              Add Task
            </NavLink>
            <NavLink to="/resources" className={navClassName}>
              API Resources
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/add-task" element={<AddTaskPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
