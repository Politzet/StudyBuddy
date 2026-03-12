import { useMemo, useState } from 'react'
import useFetch from '../hooks/useFetch'
import { API_BASE_URL } from '../config/api'
import { useTheme } from '../context/ThemeContext'
import { getAlertClass } from '../styles/alertStyles'

function MoodleSync() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [importingId, setImportingId] = useState('')
  const [importDraft, setImportDraft] = useState(null)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const {
    data: moodleAssignments,
    loading,
    error,
    refetch,
  } = useFetch(`${API_BASE_URL}/api/moodle/sync`)

  const assignmentsByCourse = useMemo(() => {
    const sourceAssignments = Array.isArray(moodleAssignments) ? moodleAssignments : []
    const grouped = {}
    for (const assignment of sourceAssignments) {
      const courseName = assignment.courseName || 'General'
      if (!grouped[courseName]) {
        grouped[courseName] = []
      }
      grouped[courseName].push(assignment)
    }
    return grouped
  }, [moodleAssignments])

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
            Sync assignments from Moodle simulator and import them to your tasks.
          </p>
        </div>
        <button
          type="button"
          onClick={refetch}
          className="rounded-md bg-[#8b6b57] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#785845]"
        >
          Sync with Moodle
        </button>
      </div>

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
          Prepared for import: <span className="font-medium">{importDraft.title}</span>{' '}
          ({importDraft.course})
        </div>
      ) : null}

      {!loading && !error ? (
        <div className="mt-6 space-y-4">
          {Object.keys(assignmentsByCourse)
            .sort((a, b) => a.localeCompare(b))
            .map((courseName) => (
              <section
                key={courseName}
                className={`rounded-xl border p-3 ${
                  isDark
                    ? 'border-[#5a463b] bg-[#1f1612]/75'
                    : 'border-[#d9c7b8] bg-[#fffaf4]/85'
                }`}
              >
                <h3 className="text-base font-semibold">{courseName}</h3>
                <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {assignmentsByCourse[courseName].map((assignment) => (
                    <li
                      key={assignment.moodleId}
                      className={`rounded-lg border p-3 ${
                        isDark
                          ? 'border-[#5f4a3f] bg-[#2f241f]/90'
                          : 'border-[#d9c7b8] bg-[#fffaf4]/95'
                      }`}
                    >
                      <h4
                        className={`text-sm font-semibold ${
                          isDark ? 'text-[#fff4ea]' : 'text-[#453434]'
                        }`}
                      >
                        {assignment.title}
                      </h4>
                      <p className={`mt-1 text-xs ${isDark ? 'text-[#eadccf]' : 'text-[#6b5447]'}`}>
                        Due: {new Date(assignment.dueDate).toLocaleString()}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleImport(assignment)}
                        disabled={importingId === assignment.moodleId}
                        className="mt-2 rounded-md bg-[#8b6b57] px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-[#785845] disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {importingId === assignment.moodleId
                          ? 'Importing...'
                          : 'Import to My Tasks'}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
        </div>
      ) : null}
    </section>
  )
}

export default MoodleSync
