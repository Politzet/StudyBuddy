import { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import useFetch from '../hooks/useFetch'
import { API_BASE_URL } from '../config/api'
import { useTheme } from '../context/ThemeContext'
import { getAlertClass } from '../styles/alertStyles'
import { setLatestSyncAt } from '../store/dashboardSlice'

function MoodleSync() {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.user)
  const { latestSyncAt } = useSelector((state) => state.dashboard)
  const userId = user?.id || ''
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [activeTab, setActiveTab] = useState('tasks')
  const [importingKey, setImportingKey] = useState('')
  const [importDraft, setImportDraft] = useState(null)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const {
    data: moodleAssignments,
    loading,
    error,
    refetch,
  } = useFetch(`${API_BASE_URL}/api/moodle/sync`)

  const moodleData = useMemo(() => {
    const source = moodleAssignments && typeof moodleAssignments === 'object' ? moodleAssignments : {}
    return {
      tasks: Array.isArray(source.tasks) ? source.tasks : [],
      exams: Array.isArray(source.exams) ? source.exams : [],
      projects: Array.isArray(source.projects) ? source.projects : [],
    }
  }, [moodleAssignments])

  const ensureCourseExists = async (courseName) => {
    const coursesResponse = await fetch(`${API_BASE_URL}/api/courses?userId=${encodeURIComponent(userId)}`)
    if (!coursesResponse.ok) {
      throw new Error('Failed to load courses before import')
    }

    const courses = await coursesResponse.json()
    const exists = courses.some((course) => course.name === courseName)

    if (exists) {
      return
    }

    const createCourseResponse = await fetch(`${API_BASE_URL}/api/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: courseName }),
    })

    if (!createCourseResponse.ok) {
      const body = await createCourseResponse.json().catch(() => ({}))
      throw new Error(body.message || 'Failed to create course for imported task')
    }
  }

  const importTask = async (task, index) => {
    const importKey = `task-${index}`
    setImportDraft({ type: 'Task', title: task.title, course: task.course })
    setMessage('')
    setErrorMessage('')
    setImportingKey(importKey)

    try {
      await ensureCourseExists(task.course)

      const response = await fetch(`${API_BASE_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          title: task.title,
          course: task.course,
          dueDate: task.dueDate,
          difficulty: 3,
          category: 'tasks',
        }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.message || 'Failed to import assignment')
      }

      setMessage('Task imported from Moodle.')
    } catch (importError) {
      setErrorMessage(importError.message)
    } finally {
      setImportingKey('')
    }
  }

  const importExam = async (exam, index) => {
    const importKey = `exam-${index}`
    setImportDraft({ type: 'Exam', title: exam.course, course: exam.course })
    setMessage('')
    setErrorMessage('')
    setImportingKey(importKey)

    try {
      const response = await fetch(`${API_BASE_URL}/api/exams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          course: exam.course,
          date: exam.date,
          time: exam.time,
          location: exam.location,
        }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.message || 'Failed to import exam')
      }

      setMessage('Exam imported from Moodle.')
    } catch (importError) {
      setErrorMessage(importError.message)
    } finally {
      setImportingKey('')
    }
  }

  const importProject = async (project, index) => {
    const importKey = `project-${index}`
    setImportDraft({ type: 'Project', title: project.title, course: project.course })
    setMessage('')
    setErrorMessage('')
    setImportingKey(importKey)

    try {
      await ensureCourseExists(project.course)

      const response = await fetch(`${API_BASE_URL}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          title: project.title,
          course: project.course,
          deadline: project.deadline,
          weight: project.weight || 0,
          progress: 0,
          isProject: true,
        }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.message || 'Failed to import project')
      }

      setMessage('Project imported from Moodle.')
    } catch (importError) {
      setErrorMessage(importError.message)
    } finally {
      setImportingKey('')
    }
  }

  const handleSync = () => {
    refetch()
    dispatch(setLatestSyncAt(new Date().toISOString()))
  }

  const tabs = [
    { id: 'tasks', label: 'Tasks' },
    { id: 'exams', label: 'Exams' },
    { id: 'projects', label: 'Projects' },
  ]

  return (
    <section
      className={`rounded-2xl border p-6 shadow-lg backdrop-blur-sm ${
        isDark
          ? 'border-[#5a463b] bg-[#2d221d]/85 text-[#f6ede6]'
          : 'border-[#d9c7b8] bg-[#fff8f1]/88 text-[#453434]'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Moodle Sync</h2>
          <p className={`mt-1 ${isDark ? 'text-[#eadccf]' : 'text-[#6b5447]'}`}>
            Import Tasks, Exams, and Projects from Moodle mock data.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSync}
          className="rounded-md bg-[#8b6b57] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#785845]"
        >
          Sync with Moodle
        </button>
      </div>
      <p className={`mt-2 text-xs ${isDark ? 'text-[#d7c3b4]' : 'text-[#7c6558]'}`}>
        {latestSyncAt ? `Latest sync: ${new Date(latestSyncAt).toLocaleString()}` : 'Not synced yet'}
      </p>

      {loading ? (
        <div
          className={`mt-6 flex items-center justify-center gap-3 rounded-lg border px-4 py-5 ${
            isDark
              ? 'border-[#8b6b57] bg-[#3a2b24]/80 text-[#f6ede6]'
              : 'border-[#d9c7b8] bg-[#fff1e4] text-[#6b5447]'
          }`}
        >
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#8b6b57] border-t-transparent" />
          <span className="font-medium">Syncing assignments...</span>
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-md px-4 py-2 text-sm font-medium ${
              activeTab === tab.id
                ? 'bg-[#8b6b57] text-white'
                : isDark
                  ? 'bg-[#3a2d26]/90 text-[#f5e7db]'
                  : 'bg-[#fff7ef] text-[#5a463b]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className={getAlertClass('error', isDark)}>
          Error: {error}
        </div>
      ) : null}

      {message ? (
        <div className={getAlertClass('success', isDark)}>
          {message}
        </div>
      ) : null}
      {errorMessage ? (
        <div className={getAlertClass('error', isDark)}>
          {errorMessage}
        </div>
      ) : null}

      {importDraft ? (
        <div
          className={`mt-4 rounded-md border px-4 py-3 text-sm ${
            isDark
              ? 'border-[#5a463b] bg-[#1f1612]/80 text-[#eadccf]'
              : 'border-[#d9c7b8] bg-[#fffaf4]/85 text-[#6b5447]'
          }`}
        >
          Prepared for import: <span className="font-medium">{importDraft.type}</span> -{' '}
          {importDraft.title} ({importDraft.course})
        </div>
      ) : null}

      {!loading && !error && activeTab === 'tasks' ? (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {moodleData.tasks.map((task, index) => {
            const key = `task-${index}`
            return (
              <li
                key={key}
                className={`rounded-lg border p-3 ${
                  isDark ? 'border-[#5f4a3f] bg-[#2f241f]/90' : 'border-[#d9c7b8] bg-[#fffaf4]/95'
                }`}
              >
                <h4 className="text-sm font-semibold">{task.title}</h4>
                <p className="mt-1 text-xs">Course: {task.course}</p>
                <p className="mt-1 text-xs">Due: {new Date(task.dueDate).toLocaleString()}</p>
                <button
                  type="button"
                  onClick={() => importTask(task, index)}
                  disabled={importingKey === key}
                  className="mt-2 rounded-md bg-[#8b6b57] px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-[#785845] disabled:opacity-70"
                >
                  {importingKey === key ? 'Importing...' : 'Import'}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}

      {!loading && !error && activeTab === 'exams' ? (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {moodleData.exams.map((exam, index) => {
            const key = `exam-${index}`
            return (
              <li
                key={key}
                className={`rounded-lg border p-3 ${
                  isDark ? 'border-[#5f4a3f] bg-[#2f241f]/90' : 'border-[#d9c7b8] bg-[#fffaf4]/95'
                }`}
              >
                <h4 className="text-sm font-semibold">{exam.course}</h4>
                <p className="mt-1 text-xs">
                  {new Date(exam.date).toLocaleDateString()} at {exam.time}
                </p>
                <p className="mt-1 text-xs">
                  {exam.location?.building} / {exam.location?.room}
                </p>
                <button
                  type="button"
                  onClick={() => importExam(exam, index)}
                  disabled={importingKey === key}
                  className="mt-2 rounded-md bg-[#8b6b57] px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-[#785845] disabled:opacity-70"
                >
                  {importingKey === key ? 'Importing...' : 'Import'}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}

      {!loading && !error && activeTab === 'projects' ? (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {moodleData.projects.map((project, index) => {
            const key = `project-${index}`
            return (
              <li
                key={key}
                className={`rounded-lg border p-3 ${
                  isDark ? 'border-[#5f4a3f] bg-[#2f241f]/90' : 'border-[#d9c7b8] bg-[#fffaf4]/95'
                }`}
              >
                <h4 className="text-sm font-semibold">{project.title}</h4>
                <p className="mt-1 text-xs">Course: {project.course}</p>
                <p className="mt-1 text-xs">Deadline: {new Date(project.deadline).toLocaleString()}</p>
                <p className="mt-1 text-xs">Weight: {project.weight}%</p>
                <button
                  type="button"
                  onClick={() => importProject(project, index)}
                  disabled={importingKey === key}
                  className="mt-2 rounded-md bg-[#8b6b57] px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-[#785845] disabled:opacity-70"
                >
                  {importingKey === key ? 'Importing...' : 'Import'}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </section>
  )
}

export default MoodleSync
