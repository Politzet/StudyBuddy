import { useState } from 'react'
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
import { useTheme } from './context/ThemeContext'

const appBgCandidates = [
  '/src/assets/images/logon page background.png',
  '/src/assets/images/logon page background.jpg',
  '/src/assets/images/logon page background.jpeg',
  '/src/assets/images/logon page background.webp',
]

function ProtectedRoute({ children }) {
  const isLoggedIn = useSelector((state) => state.user.isLoggedIn)
  return isLoggedIn ? children : <Navigate to="/" replace />
}

function App() {
  const location = useLocation()
  const isAuthPage = location.pathname === '/' || location.pathname === '/register'
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [bgIndex, setBgIndex] = useState(0)

  const handleBgError = () => {
    setBgIndex((prev) => Math.min(prev + 1, appBgCandidates.length - 1))
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {!isAuthPage ? (
        <>
          <img
            src={appBgCandidates[bgIndex]}
            onError={handleBgError}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div
            className={`absolute inset-0 ${
              isDark ? 'bg-[#1f1612]/80' : 'bg-[#f8f2eb]/58'
            }`}
          />
        </>
      ) : null}

      <div className="relative z-10 min-h-screen">
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
    </div>
  )
}

export default App
