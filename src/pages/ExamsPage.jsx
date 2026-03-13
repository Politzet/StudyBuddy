import { useEffect, useMemo, useState } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { useDispatch, useSelector } from 'react-redux'
import Breadcrumbs from '../components/Breadcrumbs'
import FormCard from '../components/FormCard'
import { useTheme } from '../context/ThemeContext'
import useFetch from '../hooks/useFetch'
import { API_BASE_URL } from '../config/api'
import { setSelectedCategory } from '../store/dashboardSlice'
import { getAlertClass } from '../styles/alertStyles'
import { getFormInputClass } from '../styles/formStyles'

const initialForm = {
  course: '',
  date: '',
  time: '',
  building: '',
  room: '',
}

const normalizeDate = (value) => new Date(value).toISOString().slice(0, 10)

function ExamsPage() {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.user)
  const userId = user?.id || ''
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [formData, setFormData] = useState(initialForm)
  const [editingId, setEditingId] = useState('')
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [selectedDay, setSelectedDay] = useState(() => new Date())

  useEffect(() => {
    dispatch(setSelectedCategory('exams'))
  }, [dispatch])

  const { data, loading, error, refetch } = useFetch(
    `${API_BASE_URL}/api/exams?userId=${encodeURIComponent(userId)}&r=${refreshKey}`,
  )
  const { data: moodleData } = useFetch(`${API_BASE_URL}/api/moodle/sync`)

  const exams = useMemo(() => (Array.isArray(data) ? data : []), [data])
  const moodleExams = useMemo(
    () => (Array.isArray(moodleData?.exams) ? moodleData.exams : []),
    [moodleData],
  )
  const allExams = useMemo(() => {
    const imported = exams.map((exam) => ({
      ...exam,
      id: exam._id,
      source: 'db',
    }))
    const mocked = moodleExams.map((exam) => ({
      ...exam,
      id: exam.id,
      source: 'moodle',
    }))
    return [...imported, ...mocked]
  }, [exams, moodleExams])

  const selectedDateIso = normalizeDate(selectedDay)
  const selectedDateExams = allExams.filter(
    (exam) => normalizeDate(exam.date) === selectedDateIso,
  )

  const triggerRefresh = () => {
    refetch()
    setRefreshKey((prev) => prev + 1)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage('')
    setErrorMessage('')

    if (!formData.date || !formData.time) {
      setErrorMessage('Date and time are required for exams.')
      return
    }

    try {
      const payload = {
        userId,
        course: formData.course,
        date: formData.date,
        time: formData.time,
        location: {
          building: formData.building,
          room: formData.room,
        },
      }

      const response = await fetch(
        editingId ? `${API_BASE_URL}/api/exams/${editingId}` : `${API_BASE_URL}/api/exams`,
        {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      )

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.message || 'Failed to save exam')
      }

      setFormData(initialForm)
      setEditingId('')
      setMessage(editingId ? 'Exam updated successfully.' : 'Exam created successfully.')
      triggerRefresh()
    } catch (submitError) {
      setErrorMessage(submitError.message)
    }
  }

  const startEdit = (exam) => {
    setEditingId(exam._id)
    setFormData({
      course: exam.course,
      date: new Date(exam.date).toISOString().slice(0, 10),
      time: exam.time || '',
      building: exam.location?.building || '',
      room: exam.location?.room || '',
    })
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete?')) {
      return
    }
    setErrorMessage('')
    try {
      const response = await fetch(`${API_BASE_URL}/api/exams/${id}`, { method: 'DELETE' })
      if (!response.ok) {
        throw new Error('Failed to delete exam')
      }
      triggerRefresh()
    } catch (deleteError) {
      setErrorMessage(deleteError.message)
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
      <Breadcrumbs isDark={isDark} />
      <h2 className="text-2xl font-bold">Exams</h2>

      {error ? <div className={getAlertClass('error', isDark)}>{error}</div> : null}
      {errorMessage ? <div className={getAlertClass('error', isDark)}>{errorMessage}</div> : null}
      {message ? <div className={getAlertClass('success', isDark)}>{message}</div> : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div
          className={`rounded-xl border p-4 ${
            isDark ? 'border-[#5a463b] bg-[#1f1612]/80' : 'border-[#d9c7b8] bg-[#fffaf4]/85'
          }`}
        >
          <Calendar onChange={setSelectedDay} value={selectedDay} />

          <div className="mt-4">
            <h3 className="text-base font-semibold">
              Exams on {new Date(selectedDateIso).toLocaleDateString()}
            </h3>
            {selectedDateExams.length === 0 ? (
              <p className={`mt-2 text-sm ${isDark ? 'text-[#eadccf]' : 'text-[#6b5447]'}`}>
                No exams on this date.
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {selectedDateExams.map((exam) => (
                  <li
                    key={exam._id}
                    className={`rounded-md border p-3 ${
                      isDark
                        ? 'border-[#5f4a3f] bg-[#2f241f]/90'
                        : 'border-[#d9c7b8] bg-[#fffaf4]/95'
                    }`}
                  >
                    <p className="font-medium">{exam.course}</p>
                    <p className="text-sm">Time: {exam.time}</p>
                    <p className="text-sm">
                      Location: {exam.location?.building} / {exam.location?.room}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <FormCard
          isDark={isDark}
          onSubmit={handleSubmit}
          className="mt-0"
          title={editingId ? 'Edit Exam' : 'Add Exam'}
          actions={
            <>
              <button
                type="submit"
                className="rounded-md bg-[#8b6b57] px-4 py-2 text-sm font-medium text-white"
              >
                {editingId ? 'Update Exam' : 'Add Exam'}
              </button>
              {editingId ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId('')
                    setFormData(initialForm)
                  }}
                  className="rounded-md bg-[#6f5b50] px-4 py-2 text-sm font-medium text-white"
                >
                  Cancel
                </button>
              ) : null}
            </>
          }
        >
          <div className="grid gap-3">
            <input
              type="text"
              placeholder="Course"
              value={formData.course}
              onChange={(event) => setFormData((prev) => ({ ...prev, course: event.target.value }))}
              className={getFormInputClass(isDark)}
              required
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="date"
                value={formData.date}
                onChange={(event) => setFormData((prev) => ({ ...prev, date: event.target.value }))}
                className={getFormInputClass(isDark)}
                required
              />
              <input
                type="time"
                value={formData.time}
                onChange={(event) => setFormData((prev) => ({ ...prev, time: event.target.value }))}
                className={getFormInputClass(isDark)}
                required
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Building"
                value={formData.building}
                onChange={(event) => setFormData((prev) => ({ ...prev, building: event.target.value }))}
                className={getFormInputClass(isDark)}
                required
              />
              <input
                type="text"
                placeholder="Room"
                value={formData.room}
                onChange={(event) => setFormData((prev) => ({ ...prev, room: event.target.value }))}
                className={getFormInputClass(isDark)}
                required
              />
            </div>
          </div>
        </FormCard>
      </div>

      {loading ? (
        <p className={`mt-4 text-sm ${isDark ? 'text-[#eadccf]' : 'text-[#6b5447]'}`}>
          Loading exams...
        </p>
      ) : null}

      <ul className="mt-6 space-y-3">
        {allExams.map((exam) => (
          <li
            key={exam.id}
            className={`rounded-xl border p-4 ${
              isDark ? 'border-[#5a463b] bg-[#1f1612]/80' : 'border-[#d9c7b8] bg-[#fffaf4]/85'
            }`}
          >
            <h3 className="font-semibold">{exam.course}</h3>
            <p className="text-sm">
              {new Date(exam.date).toLocaleDateString()} at {exam.time}
            </p>
            <p className="text-sm">
              {exam.location?.building} / {exam.location?.room}
            </p>
            {exam.source === 'db' ? (
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(exam)}
                  className="rounded-md bg-[#b38763] px-3 py-1.5 text-xs font-medium text-white"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(exam._id)}
                  className="rounded-md bg-[#6f3f3f] px-3 py-1.5 text-xs font-medium text-white"
                >
                  Delete
                </button>
              </div>
            ) : (
              <p className="mt-3 text-xs">Source: Moodle schedule</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

export default ExamsPage
