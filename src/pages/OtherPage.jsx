import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Breadcrumbs from '../components/Breadcrumbs'
import CreationSparkle from '../components/CreationSparkle'
import CustomDropdown from '../components/CustomDropdown'
import ModalPortal from '../components/ModalPortal'
import { useTheme } from '../context/ThemeContext'
import useFetch from '../hooks/useFetch'
import { API_BASE_URL } from '../config/api'
import { clearLastCreatedItem, markItemCreated, setSelectedCategory } from '../store/dashboardSlice'
import { getAlertClass } from '../styles/alertStyles'
import { getFormInputClass } from '../styles/formStyles'

const OTHER_STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'done', label: 'Done' },
]

const initialForm = {
  title: '',
  categoryName: 'Other',
  deadline: '',
  status: 'open',
}

function OtherPage() {
  const MotionLi = motion.li
  const MotionDiv = motion.div
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.user)
  const lastCreatedItem = useSelector((state) => state.dashboard.lastCreatedItem)
  const userId = user?.id || ''
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [searchParams] = useSearchParams()
  const initialCategoryName = searchParams.get('category') || 'Other'
  const [formData, setFormData] = useState({ ...initialForm, categoryName: initialCategoryName })
  const [editingItem, setEditingItem] = useState(null)
  const [courseFilter, setCourseFilter] = useState('all')
  const [showOtherModal, setShowOtherModal] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [sparkleItemId, setSparkleItemId] = useState('')
  const [deletingItemId, setDeletingItemId] = useState('')
  const [showTrashFx, setShowTrashFx] = useState(false)
  const [trashPulse, setTrashPulse] = useState(false)

  useEffect(() => {
    dispatch(setSelectedCategory('other'))
  }, [dispatch])

  const { data, loading, error, refetch } = useFetch(
    `${API_BASE_URL}/api/others?userId=${encodeURIComponent(userId)}&r=${refreshKey}`,
  )
  const items = useMemo(() => (Array.isArray(data) ? data : []), [data])
  const categories = useMemo(
    () => Array.from(new Set(items.map((item) => item.categoryName || 'Other'))).sort(),
    [items],
  )
  const normalizedCourseFilter =
    courseFilter === 'all' || categories.includes(courseFilter) ? courseFilter : 'all'
  const visibleItems = useMemo(() => {
    const base =
      normalizedCourseFilter === 'all'
        ? items
        : items.filter((item) => (item.categoryName || 'Other') === normalizedCourseFilter)
    return [...base].sort((a, b) => {
      const aTime = a.deadline ? new Date(a.deadline).getTime() : Number.MAX_SAFE_INTEGER
      const bTime = b.deadline ? new Date(b.deadline).getTime() : Number.MAX_SAFE_INTEGER
      return aTime - bTime
    })
  }, [items, normalizedCourseFilter])
  const groupedItems = useMemo(() => {
    return visibleItems.reduce((acc, item) => {
      const groupName = item.categoryName || 'Other'
      if (!acc[groupName]) {
        acc[groupName] = []
      }
      acc[groupName].push(item)
      return acc
    }, {})
  }, [visibleItems])
  const groupedCategories = useMemo(() => Object.keys(groupedItems).sort(), [groupedItems])

  useEffect(() => {
    if (!lastCreatedItem || lastCreatedItem.category !== 'other' || !lastCreatedItem.id) {
      return
    }
    setSparkleItemId(String(lastCreatedItem.id))
    dispatch(clearLastCreatedItem())
    const timer = setTimeout(() => setSparkleItemId(''), 1000)
    return () => clearTimeout(timer)
  }, [dispatch, lastCreatedItem])

  const triggerRefresh = () => {
    refetch()
    setRefreshKey((prev) => prev + 1)
  }

  const openAddModal = () => {
    setEditingItem(null)
    setFormData({ ...initialForm, categoryName: initialCategoryName })
    setShowOtherModal(true)
    setErrorMessage('')
    setMessage('')
  }

  const startEdit = (item) => {
    setEditingItem(item)
    setFormData({
      title: item.title || '',
      categoryName: item.categoryName || 'Other',
      deadline: item.deadline ? new Date(item.deadline).toISOString().slice(0, 16) : '',
      status: item.done ? 'done' : 'open',
    })
    setShowOtherModal(true)
    setErrorMessage('')
    setMessage('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setMessage('')

    if (!formData.title.trim()) {
      setErrorMessage('Title is required.')
      return
    }

    try {
      const payload = {
        userId,
        title: formData.title.trim(),
        categoryName: formData.categoryName.trim() || 'Other',
        deadline: formData.deadline || null,
        done: formData.status === 'done',
      }

      const response = await fetch(
        editingItem ? `${API_BASE_URL}/api/others/${editingItem._id}` : `${API_BASE_URL}/api/others`,
        {
          method: editingItem ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      )
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.message || 'Failed to save item')
      }

      const savedItem = await response.json().catch(() => null)
      if (!editingItem) {
        const createdItemId = savedItem?._id || savedItem?.id
        if (createdItemId) {
          dispatch(
            markItemCreated({
              category: 'other',
              id: String(createdItemId),
              createdAt: Date.now(),
            }),
          )
        }
      }

      setFormData({ ...initialForm, categoryName: initialCategoryName })
      setEditingItem(null)
      setShowOtherModal(false)
      setMessage(editingItem ? 'Item updated successfully.' : 'Item created successfully.')
      triggerRefresh()
    } catch (submitError) {
      setErrorMessage(submitError.message)
    }
  }

  const handleStatusChange = async (item, status) => {
    setErrorMessage('')
    try {
      const response = await fetch(`${API_BASE_URL}/api/others/${item._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done: status === 'done' }),
      })
      if (!response.ok) {
        throw new Error('Failed to update item')
      }
      triggerRefresh()
    } catch (updateError) {
      setErrorMessage(updateError.message)
    }
  }

  const handleDelete = async (item) => {
    if (!window.confirm('Are you sure you want to delete?')) {
      return
    }
    setErrorMessage('')
    try {
      setDeletingItemId(item._id)
      setShowTrashFx(true)
      setTrashPulse(true)
      await new Promise((resolve) => setTimeout(resolve, 680))
      const response = await fetch(`${API_BASE_URL}/api/others/${item._id}`, { method: 'DELETE' })
      if (!response.ok) {
        throw new Error('Failed to delete item')
      }
      await new Promise((resolve) => setTimeout(resolve, 140))
      triggerRefresh()
    } catch (deleteError) {
      setErrorMessage(deleteError.message)
    } finally {
      setDeletingItemId('')
      setTrashPulse(false)
      setTimeout(() => setShowTrashFx(false), 200)
    }
  }

  return (
    <section
      className={`rounded-2xl border p-6 shadow-lg backdrop-blur-sm transition-colors duration-300 ${
        isDark
          ? 'academy-page-dark border-[#7d654f]'
          : 'academy-page-light border-[#d1bfa7]'
      }`}
    >
      <Breadcrumbs isDark={isDark} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Other</h2>
        <div className="flex items-center gap-2">
          <CustomDropdown
            value={normalizedCourseFilter}
            onChange={setCourseFilter}
            isDark={isDark}
            className="min-w-[180px]"
            options={[
              { value: 'all', label: 'All groups' },
              ...categories.map((category) => ({ value: category, label: category })),
            ]}
          />
          <button
            type="button"
            onClick={openAddModal}
            className="rounded-md bg-[#8b6b57] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#785845]"
          >
            Add Item
          </button>
        </div>
      </div>

      {error ? <div className={getAlertClass('error', isDark)}>{error}</div> : null}
      {errorMessage ? <div className={getAlertClass('error', isDark)}>{errorMessage}</div> : null}
      {message ? <div className={getAlertClass('success', isDark)}>{message}</div> : null}

      {loading ? (
        <p className={`mt-6 text-sm ${isDark ? 'text-[#eadccf]' : 'text-[#6b5447]'}`}>
          Loading items...
        </p>
      ) : null}

      {!loading && !error && visibleItems.length === 0 ? (
        <p className={`mt-6 text-sm ${isDark ? 'text-[#eadccf]' : 'text-[#6b5447]'}`}>
          No items found for this filter.
        </p>
      ) : null}

      {!loading && !error && visibleItems.length > 0 ? (
        <div className="mt-6 space-y-4">
          {groupedCategories.map((groupName) => (
            <div
              key={groupName}
              className={`academy-card p-4 ${isDark ? 'academy-card-dark' : 'academy-card-light'}`}
            >
              <h3 className="mb-3 text-sm font-semibold">{groupName}</h3>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {groupedItems[groupName].map((item) => (
                  <MotionLi
                    key={item._id}
                    animate={
                      deletingItemId === item._id
                        ? {
                            scale: [1, 0.9, 0.8, 0.58, 0.26],
                            rotate: [0, 60, 180, 300, 360],
                            x: [0, 20, 110, 235, 360],
                            y: [0, -4, 14, 88, 176],
                            opacity: [1, 0.98, 0.9, 0.58, 0],
                            filter: ['blur(0px)', 'blur(0.2px)', 'blur(1px)', 'blur(1.8px)', 'blur(2.2px)'],
                          }
                        : { scale: 1, rotate: 0, x: 0, y: 0, opacity: 1 }
                    }
                    transition={{ duration: 0.66, ease: [0.2, 0.8, 0.2, 1] }}
                    className={`academy-card relative overflow-visible p-4 ${
                      isDark ? 'academy-card-dark' : 'academy-card-light'
                    }`}
                  >
                    {sparkleItemId === String(item._id) ? <CreationSparkle /> : null}
                    <p className={`font-medium ${item.done ? 'line-through opacity-70' : ''}`}>
                      {item.title}
                    </p>
                    <p className="mt-1 text-sm">
                      {item.deadline
                        ? `Deadline: ${new Date(item.deadline).toLocaleString()}`
                        : 'No deadline'}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {OTHER_STATUS_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleStatusChange(item, option.value)}
                          className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                            (item.done ? 'done' : 'open') === option.value
                              ? 'bg-[#8b6b57] text-white'
                              : isDark
                                ? 'bg-[#3a2d26] text-[#f5e7db]'
                                : 'bg-[#fff7ef] text-[#5a463b]'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="rounded-md bg-[#b38763] px-3 py-1.5 text-xs font-medium text-white"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
                        className="rounded-md bg-[#6f3f3f] px-3 py-1.5 text-xs font-medium text-white"
                      >
                        Delete
                      </button>
                    </div>
                  </MotionLi>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}

      <AnimatePresence>
        {showTrashFx ? (
          <MotionDiv
            initial={{ opacity: 0, scale: 0.7, y: 18 }}
            animate={
              trashPulse
                ? { opacity: 1, scale: [1, 1.14, 1], y: [0, -3, 0] }
                : { opacity: 1, scale: 1, y: 0 }
            }
            exit={{ opacity: 0, scale: 0.8, y: 18 }}
            transition={{ duration: 0.28 }}
            className="fixed bottom-6 right-6 z-[130] rounded-full border border-[#d1bfa7] bg-[#5a3a2e]/95 px-3 py-2 text-sm text-[#f1e4cc] shadow-2xl"
          >
            <span className="inline-flex items-center gap-2">
              <span>🧪</span>
              <span className="text-xs font-medium">Vanishing...</span>
            </span>
          </MotionDiv>
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {trashPulse ? (
          <MotionDiv
            initial={{ opacity: 0, scale: 0.2 }}
            animate={{ opacity: [0.95, 0.65, 0], scale: [0.2, 1.1, 1.6] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.36 }}
            className="pointer-events-none fixed bottom-8 right-8 z-[129] h-12 w-12 rounded-full border border-[#d6b76f] bg-[#d6b76f]/20"
          />
        ) : null}
      </AnimatePresence>

      {showOtherModal ? (
        <ModalPortal>
          <div className="fixed inset-0 z-[160] flex items-start justify-center overflow-y-auto bg-black/35 p-4 backdrop-blur-sm sm:items-center sm:p-6">
            <div
              className={`my-4 w-full max-w-md rounded-xl border p-6 ${
                isDark
                  ? 'border-[#5a463b] bg-[#2d221d] text-[#f6ede6]'
                  : 'border-[#d9c7b8] bg-[#fffaf4] text-[#453434]'
              }`}
            >
              <h3 className="text-xl font-semibold">{editingItem ? 'Edit Item' : 'Add Item'}</h3>
              <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Title"
                value={formData.title}
                onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
                className={getFormInputClass(isDark)}
                required
              />
              <input
                type="text"
                placeholder="Group name"
                value={formData.categoryName}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, categoryName: event.target.value }))
                }
                className={getFormInputClass(isDark)}
              />
              <input
                type="datetime-local"
                value={formData.deadline}
                onChange={(event) => setFormData((prev) => ({ ...prev, deadline: event.target.value }))}
                className={getFormInputClass(isDark)}
              />
              <CustomDropdown
                value={formData.status}
                onChange={(nextStatus) => setFormData((prev) => ({ ...prev, status: nextStatus }))}
                isDark={isDark}
                className="w-full"
                options={OTHER_STATUS_OPTIONS}
              />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowOtherModal(false)}
                    className="rounded-md bg-[#6f5b50] px-4 py-2 text-sm font-medium text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-[#8b6b57] px-4 py-2 text-sm font-medium text-white"
                  >
                    {editingItem ? 'Save Changes' : 'Save Item'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      ) : null}
    </section>
  )
}

export default OtherPage
