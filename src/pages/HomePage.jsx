import { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import TaskCard from '../components/TaskCard'
import { useTheme } from '../context/ThemeContext'
import useFetch from '../hooks/useFetch'
import { API_BASE_URL } from '../config/api'
import {
  TASK_STATUS_OPTIONS,
  TASK_STATUS_SORT_ORDER,
} from '../constants/taskStatus'

function HomePage() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [courseViewConfig, setCourseViewConfig] = useState({})
  const [taskMutationError, setTaskMutationError] = useState('')
  const { user, isLoggedIn } = useSelector((state) => state.user)
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const {
    data: tasksData,
    loading: tasksLoading,
    error: tasksError,
    refetch: refetchTasks,
  } = useFetch(`${API_BASE_URL}/api/tasks?refresh=${refreshKey}`)
  const tasks = useMemo(
    () => (Array.isArray(tasksData) ? tasksData : []),
    [tasksData],
  )
  const tasksByCourse = useMemo(() => {
    const groups = {}
    for (const task of tasks) {
      const courseName = task.courseName || task.course || 'General'
      if (!groups[courseName]) {
        groups[courseName] = []
      }
      groups[courseName].push(task)
    }
    return groups
  }, [tasks])

  const handleCourseConfigChange = (courseName, field, value) => {
    setCourseViewConfig((prev) => ({
      ...prev,
      [courseName]: {
        sortBy: prev[courseName]?.sortBy || 'dueDate',
        filterStatus: prev[courseName]?.filterStatus || 'all',
        [field]: value,
      },
    }))
  }

  const getVisibleCourseTasks = (courseName) => {
    const config = courseViewConfig[courseName] || {
      sortBy: 'dueDate',
      filterStatus: 'all',
    }
    const baseTasks = tasksByCourse[courseName] || []

    const filteredTasks =
      config.filterStatus === 'all'
        ? baseTasks
        : baseTasks.filter((task) => task.status === config.filterStatus)

    const sortedTasks = [...filteredTasks].sort((a, b) => {
      if (config.sortBy === 'status') {
        return (
          (TASK_STATUS_SORT_ORDER[a.status] ?? 0) -
          (TASK_STATUS_SORT_ORDER[b.status] ?? 0)
        )
      }
      return new Date(a.dueDate) - new Date(b.dueDate)
    })

    return sortedTasks
  }

  const triggerTasksRefresh = () => {
    refetchTasks()
    setRefreshKey((prev) => prev + 1)
  }

  const handleDeleteTask = async (taskId) => {
    const shouldDelete = window.confirm('Are you sure you want to delete?')
    if (!shouldDelete) {
      return
    }

    setTaskMutationError('')
    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to delete task')
      }
      triggerTasksRefresh()
    } catch (error) {
      setTaskMutationError(error.message)
    }
  }

  const handleUpdateTask = async (taskId, updates) => {
    setTaskMutationError('')
    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}))
        throw new Error(errorBody.message || 'Failed to update task')
      }

      triggerTasksRefresh()
    } catch (error) {
      setTaskMutationError(error.message)
    }
  }

  return (
    <section
      className={`rounded-xl p-6 ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'}`}
    >
      <h2 className="text-2xl font-bold">My Study Tasks</h2>
      <p className={`mt-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
        {isLoggedIn
          ? `Welcome back, ${user?.name ?? 'Student'}! Ready to study?`
          : 'Welcome, Guest! Log in to personalize your experience.'}
      </p>

      {tasksLoading ? (
        <p className={`mt-6 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          Loading tasks...
        </p>
      ) : null}
      {tasksError ? (
        <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          <p>Could not load tasks: {tasksError}</p>
          <button
            type="button"
            onClick={refetchTasks}
            className="mt-2 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      ) : null}
      {taskMutationError ? (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {taskMutationError}
        </div>
      ) : null}
      {!tasksLoading && !tasksError && tasks.length === 0 ? (
        <p className={`mt-6 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          No tasks yet. Add your first study task from the form page.
        </p>
      ) : null}
      {!tasksLoading && !tasksError && tasks.length > 0 ? (
        <div className="mt-6 space-y-6">
          {Object.keys(tasksByCourse)
            .sort((a, b) => a.localeCompare(b))
            .map((courseName) => {
              const config = courseViewConfig[courseName] || {
                sortBy: 'dueDate',
                filterStatus: 'all',
              }
              const visibleTasks = getVisibleCourseTasks(courseName)

              return (
                <section
                  key={courseName}
                  className={`rounded-xl border p-4 ${
                    isDark
                      ? 'border-slate-700 bg-slate-900 text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-900'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold">{courseName}</h3>
                    <div className="flex flex-wrap gap-2">
                      <select
                        value={config.filterStatus}
                        onChange={(event) =>
                          handleCourseConfigChange(
                            courseName,
                            'filterStatus',
                            event.target.value,
                          )
                        }
                        className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-900"
                      >
                        <option value="all">All statuses</option>
                        {TASK_STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={config.sortBy}
                        onChange={(event) =>
                          handleCourseConfigChange(
                            courseName,
                            'sortBy',
                            event.target.value,
                          )
                        }
                        className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-900"
                      >
                        <option value="dueDate">Sort by date/time</option>
                        <option value="status">Sort by status</option>
                      </select>
                    </div>
                  </div>

                  {visibleTasks.length === 0 ? (
                    <p
                      className={`mt-3 text-sm ${
                        isDark ? 'text-slate-300' : 'text-slate-600'
                      }`}
                    >
                      No tasks match this filter.
                    </p>
                  ) : (
                    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {visibleTasks.map((task) => (
                        <TaskCard
                          key={task._id || task.id}
                          task={task}
                          onDelete={handleDeleteTask}
                          onUpdate={handleUpdateTask}
                        />
                      ))}
                    </div>
                  )}
                </section>
              )
            })}
        </div>
      ) : null}

    </section>
  )
}

export default HomePage
