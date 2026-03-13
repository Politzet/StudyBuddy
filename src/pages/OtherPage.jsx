import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import FormCard from '../components/FormCard'
import { useTheme } from '../context/ThemeContext'
import useFetch from '../hooks/useFetch'
import { API_BASE_URL } from '../config/api'
import { setSelectedCategory } from '../store/dashboardSlice'
import { getAlertClass } from '../styles/alertStyles'
import { getFormInputClass } from '../styles/formStyles'

function OtherPage() {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.user)
  const userId = user?.id || ''
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [searchParams] = useSearchParams()
  const categoryName = searchParams.get('category') || 'Other'

  const [title, setTitle] = useState('')
  const [deadline, setDeadline] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [message, setMessage] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    dispatch(setSelectedCategory('other'))
  }, [dispatch])

  const { data, loading, error, refetch } = useFetch(
    `${API_BASE_URL}/api/others?userId=${encodeURIComponent(userId)}&categoryName=${encodeURIComponent(categoryName)}&r=${refreshKey}`,
  )
  const items = useMemo(() => (Array.isArray(data) ? data : []), [data])

  const triggerRefresh = () => {
    refetch()
    setRefreshKey((prev) => prev + 1)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/others`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          title: title.trim(),
          deadline: deadline || null,
          categoryName,
        }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.message || 'Failed to add item')
      }
      setTitle('')
      setDeadline('')
      setMessage('Item added successfully.')
      triggerRefresh()
    } catch (submitError) {
      setErrorMessage(submitError.message)
    }
  }

  const handleToggleDone = async (item) => {
    setErrorMessage('')
    try {
      const response = await fetch(`${API_BASE_URL}/api/others/${item._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done: !item.done }),
      })
      if (!response.ok) {
        throw new Error('Failed to update item')
      }
      triggerRefresh()
    } catch (updateError) {
      setErrorMessage(updateError.message)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete?')) {
      return
    }
    setErrorMessage('')
    try {
      const response = await fetch(`${API_BASE_URL}/api/others/${id}`, { method: 'DELETE' })
      if (!response.ok) {
        throw new Error('Failed to delete item')
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
      <h2 className="text-2xl font-bold">{categoryName}</h2>

      {error ? <div className={getAlertClass('error', isDark)}>{error}</div> : null}
      {errorMessage ? <div className={getAlertClass('error', isDark)}>{errorMessage}</div> : null}
      {message ? <div className={getAlertClass('success', isDark)}>{message}</div> : null}

      <FormCard
        isDark={isDark}
        onSubmit={handleSubmit}
        title={`Add ${categoryName} Item`}
        actions={
          <button
            type="submit"
            className="rounded-md bg-[#8b6b57] px-4 py-2 text-sm font-medium text-white"
          >
            Add Item
          </button>
        }
      >
        <div className="grid gap-3 md:grid-cols-2">
          <input
            type="text"
            placeholder="Item title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className={getFormInputClass(isDark)}
            required
          />
          <input
            type="datetime-local"
            value={deadline}
            onChange={(event) => setDeadline(event.target.value)}
            className={getFormInputClass(isDark)}
          />
        </div>
      </FormCard>

      {loading ? (
        <p className={`mt-4 text-sm ${isDark ? 'text-[#eadccf]' : 'text-[#6b5447]'}`}>
          Loading items...
        </p>
      ) : null}

      <ul className="mt-6 space-y-3">
        {items.map((item) => (
          <li
            key={item._id}
            className={`rounded-xl border p-4 ${
              isDark ? 'border-[#5a463b] bg-[#1f1612]/80' : 'border-[#d9c7b8] bg-[#fffaf4]/85'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className={`font-medium ${item.done ? 'line-through opacity-70' : ''}`}>
                {item.title}
              </p>
              <span className="text-xs">{item.done ? 'Done' : 'Open'}</span>
            </div>
            {item.deadline ? (
              <p className="mt-1 text-sm">Deadline: {new Date(item.deadline).toLocaleString()}</p>
            ) : (
              <p className="mt-1 text-sm">No deadline</p>
            )}

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => handleToggleDone(item)}
                className="rounded-md bg-[#b38763] px-3 py-1.5 text-xs font-medium text-white"
              >
                {item.done ? 'Mark as Open' : 'Mark as Done'}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(item._id)}
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

export default OtherPage
