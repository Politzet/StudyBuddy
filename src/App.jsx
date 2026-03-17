import { useEffect, useRef, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { AnimatePresence, motion } from 'framer-motion'
import Navbar from './components/Navbar'
import LogonPage from './pages/LogonPage'
import RegisterPage from './pages/RegisterPage'
import HomePage from './pages/HomePage'
import TasksPage from './pages/TasksPage'
import ExamsPage from './pages/ExamsPage'
import ProjectsPage from './pages/ProjectsPage'
import OtherPage from './pages/OtherPage'
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
  const MotionDiv = motion.div
  const location = useLocation()
  const isAuthPage = location.pathname === '/' || location.pathname === '/register'
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [bgIndex, setBgIndex] = useState(0)
  const [wandGlowPos, setWandGlowPos] = useState({ x: -9999, y: -9999, visible: false })
  const rafRef = useRef(null)

  useEffect(() => {
    const timers = new WeakMap()
    const handleInkBleedAnimation = (event) => {
      const target = event.target

      const isTextInput =
        target instanceof HTMLInputElement &&
        ['text', 'password', 'email', 'number'].includes(target.type)
      const isTextarea = target instanceof HTMLTextAreaElement

      if (!(target instanceof HTMLElement) || (!isTextInput && !isTextarea)) {
        return
      }

      // Subtle "ink drying": briefly tint text, then let it dry to field's final color.
      target.style.color = '#4f5b66'
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          target.style.color = ''
        })
      })

      const prevTimer = timers.get(target)
      if (prevTimer) {
        clearTimeout(prevTimer)
      }

      const nextTimer = setTimeout(() => {
        target.style.color = ''
      }, 220)

      timers.set(target, nextTimer)
    }

    document.addEventListener('input', handleInkBleedAnimation, true)
    return () => {
      document.removeEventListener('input', handleInkBleedAnimation, true)
    }
  }, [])

  useEffect(() => {
    if (!isDark) {
      return undefined
    }

    const handleMouseMove = (event) => {
      const nextX = event.clientX
      const nextY = event.clientY

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }

      rafRef.current = requestAnimationFrame(() => {
        setWandGlowPos({ x: nextX, y: nextY, visible: true })
      })
    }

    const handleMouseLeave = () => {
      setWandGlowPos((prev) => ({ ...prev, visible: false }))
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseout', handleMouseLeave)

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseout', handleMouseLeave)
    }
  }, [isDark])

  const handleBgError = () => {
    setBgIndex((prev) => Math.min(prev + 1, appBgCandidates.length - 1))
  }

  const appRoutes = (
    <Routes location={location}>
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
        path="/tasks"
        element={
          <ProtectedRoute>
            <TasksPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exams"
        element={
          <ProtectedRoute>
            <ExamsPage />
          </ProtectedRoute>
        }
      />
      <Route path="/tests" element={<Navigate to="/exams" replace />} />
      <Route
        path="/projects"
        element={
          <ProtectedRoute>
            <ProjectsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/other"
        element={
          <ProtectedRoute>
            <OtherPage />
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
  )

  return (
    <div className="relative min-h-screen overflow-hidden transition-colors duration-300">
      {!isAuthPage ? (
        <>
          <img
            src={appBgCandidates[bgIndex]}
            onError={handleBgError}
            alt=""
            className="fixed inset-0 h-screen w-screen object-cover"
          />
          <div
            className={`fixed inset-0 ${
              isDark ? 'bg-[#1f1612]/82' : 'bg-[#eadcc9]/55'
            }`}
          />
        </>
      ) : null}

      <div className="relative z-10 min-h-screen">
        {!isAuthPage ? <Navbar /> : null}

        <main className={isAuthPage ? '' : 'mx-auto w-full max-w-5xl px-4 py-8 transition-colors duration-300'}>
          <div className="relative">
            {isAuthPage ? (
              <div className="relative">{appRoutes}</div>
            ) : (
              <>
                <AnimatePresence mode="wait" initial={false}>
                  <MotionDiv
                    key={`mist-${location.pathname}`}
                    initial={{ opacity: 0, x: '-115%' }}
                    animate={{ opacity: [0, 0.2, 0], x: ['-115%', '0%', '115%'] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.36, ease: 'easeInOut' }}
                    className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-r from-transparent via-[#2f2119]/28 to-transparent"
                  />
                </AnimatePresence>

                <AnimatePresence mode="wait" initial={false}>
                  <MotionDiv
                    key={location.pathname}
                    initial={{ opacity: 0, y: 20, scale: 1 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.985 }}
                    transition={{ duration: 0.34, ease: [0.22, 0.61, 0.36, 1] }}
                    className="relative"
                  >
                    <MotionDiv
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: [0, 0.18, 0], scale: [0.96, 1.02, 1] }}
                      transition={{ duration: 0.38, ease: 'easeOut' }}
                      className="pointer-events-none absolute inset-0 -z-10 rounded-2xl bg-[#e0b55b]/10 blur-2xl"
                    />
                    {appRoutes}
                  </MotionDiv>
                </AnimatePresence>
              </>
            )}
          </div>
        </main>
      </div>
      {isDark && wandGlowPos.visible ? (
        <div
          className="pointer-events-none fixed inset-0 z-[120]"
          style={{
            background: `radial-gradient(circle 130px at ${wandGlowPos.x}px ${wandGlowPos.y}px, rgba(255, 223, 140, 0.28) 0%, rgba(255, 223, 140, 0.14) 34%, rgba(255, 223, 140, 0.06) 54%, transparent 74%)`,
            mixBlendMode: 'screen',
          }}
        />
      ) : null}
    </div>
  )
}

export default App
