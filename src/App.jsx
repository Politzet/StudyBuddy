import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Navbar from './components/Navbar'
import LogonPage from './pages/LogonPage'
import RegisterPage from './pages/RegisterPage'
import HomePage from './pages/HomePage'
import AddTaskPage from './pages/AddTaskPage'
import ResourcesPage from './pages/ResourcesPage'
import NotFoundPage from './pages/NotFoundPage'
import MoodleSync from './pages/MoodleSync'

function ProtectedRoute({ children }) {
  const isLoggedIn = useSelector((state) => state.user.isLoggedIn)
  return isLoggedIn ? children : <Navigate to="/" replace />
}

function App() {
  const location = useLocation()
  const isAuthPage = location.pathname === '/' || location.pathname === '/register'

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {!isAuthPage ? <Navbar /> : null}

      <main className={isAuthPage ? '' : 'mx-auto w-full max-w-5xl px-4 py-8'}>
        <Routes>
          <Route path="/" element={<LogonPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/form"
            element={
              <ProtectedRoute>
                <AddTaskPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/api"
            element={
              <ProtectedRoute>
                <ResourcesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/moodle-sync"
            element={
              <ProtectedRoute>
                <MoodleSync />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
