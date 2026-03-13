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
  title: '',
  course: '',
  date: '',
}

function TestsPage() {
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

  useEffect(() => {
    dispatch(setSelectedCategory('tests'))
  }, [dispatch])

  const { data, loading, error, refetch } = useFetch(
    `${API_BASE_URL}/api/tests?userId=${encodeURIComponent(userId)}&r=${refreshKey}`,
  )
  const tests = useMemo(() => (Array.isArray(data) ? data : []), [data])

  const selectedDate = formData.date ? new Date(formData.date) : new Date()

  const triggerRefresh = () => {
    refetch()
    setRefreshKey((prev) => prev + 1)
  }

  const handleCalendarChange = (value) => {
    const dateValue = Array.isArray(value) ? value[0] : value
    setFormData((prev) => ({
      ...prev,
      date: dateValue.toISOString().slice(0, 16),
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage('')
    setErrorMessage('')

    if (!formData.date) {
      setErrorMessage('Date is required for tests.')
      return
    }

    try {
      const response = await fetch(
        editingId ? `${API_BASE_URL}/api/tests/${editingId}` : `${API_BASE_URL}/api/tests`,
        {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, userId }),
        },
      )

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.message || 'Failed to save test')
      }

      setFormData(initialForm)
      setEditingId('')
      setMessage(editingId ? 'Test updated successfully.' : 'Test created successfully.')
      triggerRefresh()
    } catch (submitError) {
      setErrorMessage(submitError.message)
    }
  }

  const startEdit = (testItem) => {
    setEditingId(testItem._id)
    setFormData({
      title: testItem.title,
      course: testItem.course,
      date: new Date(testItem.date).toISOString().slice(0, 16),
    })
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete?')) {
      return
    }
    setErrorMessage('')
    try {
      const response = await fetch(`${API_BASE_URL}/api/tests/${id}`, { method: 'DELETE' })
      if (!response.ok) {
        throw new Error('Failed to delete test')
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
      <h2 className="text-2xl font-bold">Tests</h2>

      {error ? <div className={getAlertClass('error', isDark)}>{error}</div> : null}
      {errorMessage ? <div className={getAlertClass('error', isDark)}>{errorMessage}</div> : null}
      {message ? <div className={getAlertClass('success', isDark)}>{message}</div> : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div
          className={`rounded-xl border p-4 ${
            isDark ? 'border-[#5a463b] bg-[#1f1612]/80' : 'border-[#d9c7b8] bg-[#fffaf4]/85'
          }`}
        >
          <Calendar onChange={handleCalendarChange} value={selectedDate} />
        </div>

        <FormCard
          isDark={isDark}
          onSubmit={handleSubmit}
          className="mt-0"
          actions={
            <>
              <button
                type="submit"
                className="rounded-md bg-[#8b6b57] px-4 py-2 text-sm font-medium text-white"
              >
                {editingId ? 'Update Test' : 'Add Test'}
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
          <label className="mb-1 block text-sm font-medium">Test Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
            className={`w-full ${getFormInputClass(isDark)}`}
            required
          />

          <label className="mb-1 mt-3 block text-sm font-medium">Course</label>
          <input
            type="text"
            value={formData.course}
            onChange={(event) => setFormData((prev) => ({ ...prev, course: event.target.value }))}
            className={`w-full ${getFormInputClass(isDark)}`}
            required
          />

          <label className="mb-1 mt-3 block text-sm font-medium">Date & Time</label>
          <input
            type="datetime-local"
            value={formData.date}
            onChange={(event) => setFormData((prev) => ({ ...prev, date: event.target.value }))}
            className={`w-full ${getFormInputClass(isDark)}`}
            required
          />
        </FormCard>
      </div>

      {loading ? (
        <p className={`mt-4 text-sm ${isDark ? 'text-[#eadccf]' : 'text-[#6b5447]'}`}>Loading tests...</p>
      ) : null}

      <ul className="mt-6 space-y-3">
        {tests.map((testItem) => (
          <li
            key={testItem._id}
            className={`rounded-xl border p-4 ${
              isDark ? 'border-[#5a463b] bg-[#1f1612]/80' : 'border-[#d9c7b8] bg-[#fffaf4]/85'
            }`}
          >
            <h3 className="font-semibold">{testItem.title}</h3>
            <p className="text-sm">Course: {testItem.course}</p>
            <p className="text-sm">Date: {new Date(testItem.date).toLocaleString()}</p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => startEdit(testItem)}
                className="rounded-md bg-[#b38763] px-3 py-1.5 text-xs font-medium text-white"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => handleDelete(testItem._id)}
                className="rounded-md bg-[#6f3f3f] px-3 py-1.5 text-xs font-medium text-white"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default TestsPage
