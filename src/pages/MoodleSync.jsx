import { useState } from 'react'
import useFetch from '../hooks/useFetch'
import { API_BASE_URL } from '../config/api'
import { useTheme } from '../context/ThemeContext'

function MoodleSync() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [importingId, setImportingId] = useState('')
  const [importDraft, setImportDraft] = useState(null)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const {
    data: moodleAssignments = [],
    loading,
    error,
    refetch,
  } = useFetch(`${API_BASE_URL}/api/moodle/sync`)

  const ensureCourseExists = async (courseName) => {
    const coursesResponse = await fetch(`${API_BASE_URL}/api/courses`)
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

  const handleImport = async (assignment) => {
    setImportDraft({
      title: assignment.title,
      course: assignment.courseName,
      dueDate: assignment.dueDate,
    })
    setMessage('')
    setErrorMessage('')
    setImportingId(assignment.moodleId)

    try {
      await ensureCourseExists(assignment.courseName)

      const response = await fetch(`${API_BASE_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: assignment.title,
          course: assignment.courseName,
          dueDate: assignment.dueDate,
          difficulty: 3,
        }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.message || 'Failed to import assignment')
      }

      setMessage('Assignment successfully imported from Moodle!')
    } catch (importError) {
      setErrorMessage(importError.message)
    } finally {
      setImportingId('')
    }
  }

  return (
    <section
      className={`rounded-xl p-6 shadow-sm ${
        isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Moodle Sync</h2>
          <p className={`mt-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            Sync assignments from Moodle simulator and import them to your tasks.
          </p>
        </div>
        <button
          type="button"
          onClick={refetch}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
        >
          Sync with Moodle
        </button>
      </div>

      {loading ? (
        <div
          className={`mt-6 flex items-center justify-center gap-3 rounded-lg border px-4 py-5 ${
            isDark
              ? 'border-blue-800 bg-blue-950 text-blue-200'
              : 'border-blue-200 bg-blue-50 text-blue-700'
          }`}
        >
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <span className="font-medium">Syncing assignments...</span>
        </div>
      ) : null}

      {error ? (
        <div
          className={`mt-6 rounded-lg border px-4 py-3 ${
            isDark
              ? 'border-red-900 bg-red-950 text-red-200'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          Error: {error}
        </div>
      ) : null}

      {message ? (
        <div
          className={`mt-4 rounded-md border px-4 py-3 ${
            isDark
              ? 'border-emerald-900 bg-emerald-950 text-emerald-200'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {message}
        </div>
      ) : null}
      {errorMessage ? (
        <div
          className={`mt-4 rounded-md border px-4 py-3 ${
            isDark
              ? 'border-red-900 bg-red-950 text-red-200'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {errorMessage}
        </div>
      ) : null}

      {importDraft ? (
        <div
          className={`mt-4 rounded-md border px-4 py-3 text-sm ${
            isDark
              ? 'border-slate-700 bg-slate-900 text-slate-200'
              : 'border-slate-200 bg-slate-50 text-slate-700'
          }`}
        >
          Prepared for import: <span className="font-medium">{importDraft.title}</span>{' '}
          ({importDraft.course})
        </div>
      ) : null}

      {!loading && !error ? (
        <ul className="mt-6 space-y-3">
          {moodleAssignments.map((assignment) => (
            <li
              key={assignment.moodleId}
              className={`rounded-lg border p-4 ${
                isDark
                  ? 'border-slate-700 bg-slate-900'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              <h3 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {assignment.title}
              </h3>
              <p className={`mt-1 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Course: {assignment.courseName}
              </p>
              <p className={`mt-1 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Due: {new Date(assignment.dueDate).toLocaleString()}
              </p>
              <button
                type="button"
                onClick={() => handleImport(assignment)}
                disabled={importingId === assignment.moodleId}
                className="mt-3 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {importingId === assignment.moodleId
                  ? 'Importing...'
                  : 'Import to My Tasks'}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}

export default MoodleSync
