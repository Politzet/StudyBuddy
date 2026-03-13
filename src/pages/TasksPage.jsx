import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Breadcrumbs from '../components/Breadcrumbs'
import { useTheme } from '../context/ThemeContext'
import useFetch from '../hooks/useFetch'
import useLocalStorage from '../hooks/useLocalStorage'
import { API_BASE_URL } from '../config/api'
import { setSelectedCategory } from '../store/dashboardSlice'
import { getAlertClass } from '../styles/alertStyles'
import { TASK_STATUS_OPTIONS } from '../constants/taskStatus'

function TasksPage() {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.user)
  const userId = user?.id || ''
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [refreshKey, setRefreshKey] = useState(0)
  const [courseFilter, setCourseFilter] = useLocalStorage('tasks-course-filter', 'all')
  const [taskMutationError, setTaskMutationError] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [addTaskLoading, setAddTaskLoading] = useState(false)
  const [addTaskData, setAddTaskData] = useState({
    title: '',
    dueDate: '',
    status: 'not_started',
  })

  useEffect(() => {
    dispatch(setSelectedCategory('tasks'))
  }, [dispatch])

  const {
    data: tasksData,
    loading,
    error,
    refetch,
  } = useFetch(
    `${API_BASE_URL}/api/tasks?userId=${encodeURIComponent(userId)}&category=tasks&r=${refreshKey}`,
  )

  const tasks = useMemo(() => (Array.isArray(tasksData) ? tasksData : []), [tasksData])
  const courses = useMemo(
    () => Array.from(new Set(tasks.map((task) => task.course).filter(Boolean))).sort(),
    [tasks],
  )

  const visibleTasks = useMemo(() => {
    const base = courseFilter === 'all' ? tasks : tasks.filter((task) => task.course === courseFilter)
    return [...base].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
  }, [tasks, courseFilter])

  const triggerRefresh = () => {
    refetch()
    setRefreshKey((prev) => prev + 1)
  }

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete?')) {
      return
    }

    setTaskMutationError('')
    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, { method: 'DELETE' })
      if (!response.ok) {
        throw new Error('Failed to delete task')
      }
      triggerRefresh()
    } catch (deleteError) {
      setTaskMutationError(deleteError.message)
    }
  }

  const handleUpdateTask = async (taskId, updates) => {
    setTaskMutationError('')
    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.message || 'Failed to update task')
      }

      triggerRefresh()
    } catch (updateError) {
      setTaskMutationError(updateError.message)
    }
  }

  const toggleTaskStatus = async (task, status) => {
    await handleUpdateTask(task._id, { status })
  }

  const handleCreateTask = async (event) => {
    event.preventDefault()
    setTaskMutationError('')

    if (!addTaskData.title.trim()) {
      setTaskMutationError('Task name is required.')
      return
    }
    if (!addTaskData.dueDate) {
      setTaskMutationError('Due day is required.')
      return
    }

    try {
      setAddTaskLoading(true)
      const response = await fetch(`${API_BASE_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          title: addTaskData.title.trim(),
          dueDate: new Date(addTaskData.dueDate).toISOString(),
          status: addTaskData.status,
          category: 'tasks',
          course: 'General',
          difficulty: 1,
        }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.message || 'Failed to create task')
      }

      setShowAddModal(false)
      setAddTaskData({
        title: '',
        dueDate: '',
        status: 'not_started',
      })
      triggerRefresh()
    } catch (createError) {
      setTaskMutationError(createError.message)
    } finally {
      setAddTaskLoading(false)
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Tasks</h2>
        <div className="flex items-center gap-2">
          <select
            value={courseFilter}
            onChange={(event) => setCourseFilter(event.target.value)}
            className={`rounded-md border px-3 py-2 text-sm ${
              isDark
                ? 'border-[#6a5448] bg-[#2d221d] text-[#f6ede6]'
                : 'border-[#d2c0b1] bg-[#fffaf6] text-[#453434]'
            }`}
          >
            <option value="all">All courses</option>
            {courses.map((course) => (
              <option key={course} value={course}>
                {course}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="rounded-md bg-[#8b6b57] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#785845]"
          >
            Add Task
          </button>
        </div>
      </div>

      {error ? <div className={getAlertClass('error', isDark)}>{error}</div> : null}
      {taskMutationError ? <div className={getAlertClass('error', isDark)}>{taskMutationError}</div> : null}
      {loading ? (
        <p className={`mt-6 text-sm ${isDark ? 'text-[#eadccf]' : 'text-[#6b5447]'}`}>Loading tasks...</p>
      ) : null}

      {!loading && !error && visibleTasks.length === 0 ? (
        <p className={`mt-6 text-sm ${isDark ? 'text-[#eadccf]' : 'text-[#6b5447]'}`}>
          No tasks found for this filter.
        </p>
      ) : null}

      {!loading && !error && visibleTasks.length > 0 ? (
        <ul className="mt-6 space-y-3">
          {visibleTasks.map((task) => (
            <li
              key={task._id || task.id}
              className={`rounded-xl border p-4 ${
                isDark ? 'border-[#5a463b] bg-[#1f1612]/80' : 'border-[#d9c7b8] bg-[#fffaf4]/85'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{task.title}</h3>
                  <p className="text-sm">Course: {task.course}</p>
                  <p className="text-sm">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteTask(task._id)}
                  className="rounded-md bg-[#6f3f3f] px-3 py-1.5 text-xs font-medium text-white"
                >
                  Delete
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {TASK_STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleTaskStatus(task, option.value)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                      task.status === option.value
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
            </li>
          ))}
        </ul>
      ) : null}

      {showAddModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-sm">
          <div
            className={`w-full max-w-md rounded-xl border p-6 ${
              isDark
                ? 'border-[#5a463b] bg-[#2d221d] text-[#f6ede6]'
                : 'border-[#d9c7b8] bg-[#fffaf4] text-[#453434]'
            }`}
          >
            <h3 className="text-xl font-semibold">Add Task</h3>
            <form className="mt-4 space-y-3" onSubmit={handleCreateTask}>
              <div>
                <label className="mb-1 block text-sm font-medium">Task Name</label>
                <input
                  type="text"
                  value={addTaskData.title}
                  onChange={(event) =>
                    setAddTaskData((prev) => ({ ...prev, title: event.target.value }))
                  }
                  className={`w-full rounded-md border px-3 py-2 ${
                    isDark
                      ? 'border-[#6a5448] bg-[#2d221d] text-[#f6ede6]'
                      : 'border-[#d2c0b1] bg-[#fffaf6] text-[#453434]'
                  }`}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Due day</label>
                <input
                  type="date"
                  value={addTaskData.dueDate}
                  onChange={(event) =>
                    setAddTaskData((prev) => ({ ...prev, dueDate: event.target.value }))
                  }
                  className={`w-full rounded-md border px-3 py-2 ${
                    isDark
                      ? 'border-[#6a5448] bg-[#2d221d] text-[#f6ede6]'
                      : 'border-[#d2c0b1] bg-[#fffaf6] text-[#453434]'
                  }`}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Status</label>
                <select
                  value={addTaskData.status}
                  onChange={(event) =>
                    setAddTaskData((prev) => ({ ...prev, status: event.target.value }))
                  }
                  className={`w-full rounded-md border px-3 py-2 ${
                    isDark
                      ? 'border-[#6a5448] bg-[#2d221d] text-[#f6ede6]'
                      : 'border-[#d2c0b1] bg-[#fffaf6] text-[#453434]'
                  }`}
                >
                  {TASK_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-md bg-[#6f5b50] px-4 py-2 text-sm font-medium text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addTaskLoading}
                  className="rounded-md bg-[#8b6b57] px-4 py-2 text-sm font-medium text-white"
                >
                  {addTaskLoading ? 'Saving...' : 'Save Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default TasksPage
