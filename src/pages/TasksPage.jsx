import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AnimatePresence, motion } from 'framer-motion'
import Breadcrumbs from '../components/Breadcrumbs'
import CreationSparkle from '../components/CreationSparkle'
import CustomDropdown from '../components/CustomDropdown'
import ModalPortal from '../components/ModalPortal'
import { useTheme } from '../context/ThemeContext'
import useFetch from '../hooks/useFetch'
import useLocalStorage from '../hooks/useLocalStorage'
import { API_BASE_URL } from '../config/api'
import { clearLastCreatedItem, markItemCreated, setSelectedCategory } from '../store/dashboardSlice'
import { getAlertClass } from '../styles/alertStyles'
import { TASK_STATUS_OPTIONS } from '../constants/taskStatus'

function TasksPage() {
  const MotionLi = motion.li
  const MotionDiv = motion.div
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.user)
  const lastCreatedItem = useSelector((state) => state.dashboard.lastCreatedItem)
  const userId = user?.id || ''
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [refreshKey, setRefreshKey] = useState(0)
  const [courseFilter, setCourseFilter] = useLocalStorage('tasks-course-filter', 'all')
  const [taskMutationError, setTaskMutationError] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [addTaskLoading, setAddTaskLoading] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [editTaskLoading, setEditTaskLoading] = useState(false)
  const [deletingTaskId, setDeletingTaskId] = useState('')
  const [showTrashFx, setShowTrashFx] = useState(false)
  const [trashPulse, setTrashPulse] = useState(false)
  const [sparkleTaskId, setSparkleTaskId] = useState('')
  const [courseActionError, setCourseActionError] = useState('')
  const [courseNameInput, setCourseNameInput] = useState('')
  const [isAddingCourse, setIsAddingCourse] = useState(false)
  const [coursesRefreshKey, setCoursesRefreshKey] = useState(0)
  const [addTaskData, setAddTaskData] = useState({
    title: '',
    course: '',
    dueDate: '',
    studyDays: 1,
    status: 'not_started',
  })
  const [editTaskData, setEditTaskData] = useState({
    title: '',
    course: '',
    dueDate: '',
    studyDays: 1,
    status: 'not_started',
  })

  const validateStudyDays = (dueDateValue, studyDaysValue) => {
    const dueDate = new Date(dueDateValue)
    if (Number.isNaN(dueDate.getTime())) {
      return 'Please select a valid due date.'
    }

    const dueAtEndOfDay = new Date(dueDate)
    dueAtEndOfDay.setHours(23, 59, 59, 999)

    const now = new Date()
    const msPerDay = 1000 * 60 * 60 * 24
    const daysLeft = Math.ceil((dueAtEndOfDay.getTime() - now.getTime()) / msPerDay)

    if (daysLeft <= 0) {
      return 'Due date must be in the future.'
    }

    const normalizedStudyDays = Number(studyDaysValue) || 1
    if (normalizedStudyDays > daysLeft) {
      return `You entered ${normalizedStudyDays} study days, but only ${daysLeft} day(s) are left until the due date.`
    }

    return ''
  }

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
  const {
    data: coursesData,
    error: coursesError,
    refetch: refetchCourses,
  } = useFetch(`${API_BASE_URL}/api/courses?r=${coursesRefreshKey}`)

  const tasks = useMemo(() => (Array.isArray(tasksData) ? tasksData : []), [tasksData])
  const availableCourses = useMemo(
    () => (Array.isArray(coursesData) ? coursesData.map((course) => course.name).filter(Boolean).sort() : []),
    [coursesData],
  )
  const allTasks = useMemo(
    () => (userId ? tasks.filter((task) => String(task.userId || '') === String(userId)) : []),
    [tasks, userId],
  )
  const courses = useMemo(
    () => Array.from(new Set(allTasks.map((task) => task.course).filter(Boolean))).sort(),
    [allTasks],
  )
  const normalizedCourseFilter =
    courseFilter === 'all' || courses.includes(courseFilter) ? courseFilter : 'all'

  const visibleTasks = useMemo(() => {
    const base =
      normalizedCourseFilter === 'all'
        ? allTasks
        : allTasks.filter((task) => task.course === normalizedCourseFilter)
    return [...base].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
  }, [allTasks, normalizedCourseFilter])
  const groupedTasks = useMemo(() => {
    return visibleTasks.reduce((acc, task) => {
      const courseName = task.course || 'Unassigned Course'
      if (!acc[courseName]) {
        acc[courseName] = []
      }
      acc[courseName].push(task)
      return acc
    }, {})
  }, [visibleTasks])
  const groupedCourses = useMemo(() => Object.keys(groupedTasks).sort(), [groupedTasks])
  const isTaskModalOpen = showAddModal || Boolean(editingTask)
  const courseCardClass = isDark
    ? 'border-[#a68467]/55 bg-[#4a372b]/55 text-[#f6e9d5]'
    : 'border-[#c2a485]/70 bg-[#f6ecdf]/65 text-[#5a3f2f]'
  const taskCardClass = isDark
    ? 'border-[#b07a4f]/60 bg-[#5b3a2a]/30 text-[#f6ede6]'
    : 'border-[#d4a06d]/65 bg-[#f5e1cf]/70 text-[#453434]'

  useEffect(() => {
    if (courseFilter !== normalizedCourseFilter) {
      setCourseFilter('all')
    }
  }, [courseFilter, normalizedCourseFilter, setCourseFilter])

  useEffect(() => {
    if (!lastCreatedItem || lastCreatedItem.category !== 'tasks' || !lastCreatedItem.id) {
      return
    }
    setSparkleTaskId(String(lastCreatedItem.id))
    dispatch(clearLastCreatedItem())
    const timer = setTimeout(() => setSparkleTaskId(''), 1000)
    return () => clearTimeout(timer)
  }, [dispatch, lastCreatedItem])

  const triggerRefresh = () => {
    refetch()
    setRefreshKey((prev) => prev + 1)
  }
  const triggerCoursesRefresh = () => {
    refetchCourses()
    setCoursesRefreshKey((prev) => prev + 1)
  }

  const handleAddCourse = async (target = 'add') => {
    const trimmedName = courseNameInput.trim()
    if (!trimmedName) {
      setCourseActionError('Course name is required.')
      return
    }

    setCourseActionError('')
    try {
      setIsAddingCourse(true)
      const response = await fetch(`${API_BASE_URL}/api/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName }),
      })
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}))
        throw new Error(errorBody.message || 'Failed to add course')
      }
      if (target === 'edit') {
        setEditTaskData((prev) => ({ ...prev, course: trimmedName }))
      } else {
        setAddTaskData((prev) => ({ ...prev, course: trimmedName }))
      }
      setCourseNameInput('')
      triggerCoursesRefresh()
    } catch (createError) {
      setCourseActionError(createError.message)
    } finally {
      setIsAddingCourse(false)
    }
  }

  const handleUpdateTask = async (taskId, updates) => {
    if (!taskId) {
      return
    }
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
    if (!addTaskData.course.trim() && courseNameInput.trim()) {
      setTaskMutationError('You typed a new course name. Click "Add" to create/select it first.')
      return
    }
    if (!addTaskData.course.trim()) {
      setTaskMutationError('Course is required.')
      return
    }
    if (!addTaskData.dueDate) {
      setTaskMutationError('Due date is required.')
      return
    }
    if (Number(addTaskData.studyDays) < 1) {
      setTaskMutationError('Study days must be at least 1.')
      return
    }

    const studyDaysError = validateStudyDays(addTaskData.dueDate, addTaskData.studyDays)
    if (studyDaysError) {
      setTaskMutationError(studyDaysError)
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
          course: addTaskData.course.trim(),
          dueDate: new Date(addTaskData.dueDate).toISOString(),
          studyDays: Number(addTaskData.studyDays) || 1,
          status: addTaskData.status,
          category: 'tasks',
          difficulty: 1,
        }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.message || 'Failed to create task')
      }

      const createdTask = await response.json().catch(() => null)
      const createdTaskId = createdTask?._id || createdTask?.id
      if (createdTaskId) {
        dispatch(
          markItemCreated({
            category: 'tasks',
            id: String(createdTaskId),
            createdAt: Date.now(),
          }),
        )
      }

      setShowAddModal(false)
      setAddTaskData({
        title: '',
        course: '',
        dueDate: '',
        studyDays: 1,
        status: 'not_started',
      })
      triggerRefresh()
    } catch (createError) {
      setTaskMutationError(createError.message)
    } finally {
      setAddTaskLoading(false)
    }
  }

  const openEditModal = (task) => {
    setTaskMutationError('')
    setEditingTask(task)
    setEditTaskData({
      title: task.title || '',
      course: task.course || '',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : '',
      studyDays: Number(task.studyDays) > 0 ? Number(task.studyDays) : 1,
      status: task.status || 'not_started',
    })
  }

  const handleSaveEditedTask = async (event) => {
    event.preventDefault()
    setTaskMutationError('')

    if (!editingTask) {
      return
    }

    if (!editTaskData.title.trim() || !editTaskData.course.trim() || !editTaskData.dueDate) {
      if (!editTaskData.course.trim() && courseNameInput.trim()) {
        setTaskMutationError('You typed a new course name. Click "Add" to create/select it first.')
        return
      }
      setTaskMutationError('Title, course, and due date are required.')
      return
    }
    if (Number(editTaskData.studyDays) < 1) {
      setTaskMutationError('Study days must be at least 1.')
      return
    }

    const studyDaysError = validateStudyDays(editTaskData.dueDate, editTaskData.studyDays)
    if (studyDaysError) {
      setTaskMutationError(studyDaysError)
      return
    }

    try {
      setEditTaskLoading(true)
      await handleUpdateTask(editingTask._id, {
        title: editTaskData.title.trim(),
        course: editTaskData.course.trim(),
        dueDate: new Date(editTaskData.dueDate).toISOString(),
        studyDays: Number(editTaskData.studyDays) || 1,
        status: editTaskData.status,
      })
      setEditingTask(null)
    } catch (saveError) {
      setTaskMutationError(saveError.message)
    } finally {
      setEditTaskLoading(false)
    }
  }

  const handleDeleteAnyTask = async (task) => {
    if (!window.confirm('Are you sure you want to delete?')) {
      return
    }

    setTaskMutationError('')
    try {
      setDeletingTaskId(task._id)
      setShowTrashFx(true)
      setTrashPulse(true)
      await new Promise((resolve) => setTimeout(resolve, 680))
      const response = await fetch(`${API_BASE_URL}/api/tasks/${task._id}`, { method: 'DELETE' })
      if (!response.ok) {
        throw new Error('Failed to delete task')
      }
      await new Promise((resolve) => setTimeout(resolve, 140))
      triggerRefresh()
    } catch (deleteError) {
      setTaskMutationError(deleteError.message)
    } finally {
      setDeletingTaskId('')
      setTrashPulse(false)
      setTimeout(() => setShowTrashFx(false), 200)
    }
  }

  return (
    <section className="rounded-2xl border border-transparent bg-transparent p-6 shadow-none backdrop-blur-0 transition-colors duration-300">
      <Breadcrumbs isDark={isDark} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : ''}`}>Tasks</h2>
        <div className="flex items-center gap-2">
          <CustomDropdown
            value={normalizedCourseFilter}
            onChange={setCourseFilter}
            isDark={isDark}
            className="min-w-[180px]"
            stylePreset="openCalendar"
            options={[
              { value: 'all', label: 'All courses' },
              ...courses.map((course) => ({ value: course, label: course })),
            ]}
          />
          <button
            type="button"
            onClick={() => {
              setTaskMutationError('')
              setShowAddModal(true)
            }}
            className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
              isDark
                ? 'border-[#b39271]/55 bg-[#6c4f3e]/85 text-[#f6e9d5] hover:bg-[#7a5b47]'
                : 'border-[#b48f6e]/75 bg-[#9a7459]/95 text-[#fff7ee] shadow-[0_6px_14px_rgba(88,58,39,0.2)] hover:bg-[#87664f]'
            }`}
          >
            Add Task
          </button>
        </div>
      </div>

      {error ? <div className={getAlertClass('error', isDark)}>{error}</div> : null}
      {!isTaskModalOpen && taskMutationError ? (
        <div className={getAlertClass('error', isDark)}>{taskMutationError}</div>
      ) : null}
      {coursesError ? <div className={getAlertClass('error', isDark)}>{coursesError}</div> : null}
      {!isTaskModalOpen && courseActionError ? (
        <div className={getAlertClass('error', isDark)}>{courseActionError}</div>
      ) : null}
      {loading ? (
        <p className={`mt-6 text-sm ${isDark ? 'text-[#eadccf]' : 'text-[#6b5447]'}`}>Loading tasks...</p>
      ) : null}

      {!loading && !error && visibleTasks.length === 0 ? (
        <p className={`mt-6 text-sm ${isDark ? 'text-[#eadccf]' : 'text-[#6b5447]'}`}>
          No tasks found for this filter.
        </p>
      ) : null}

      {!loading && !error && visibleTasks.length > 0 ? (
        <div className="mt-6 space-y-4">
          {groupedCourses.map((courseName) => (
            <div
              key={courseName}
              className={`academy-card border p-4 ${courseCardClass}`}
            >
              <h3 className={`mb-3 text-sm font-semibold ${isDark ? 'text-white' : ''}`}>{courseName}</h3>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {groupedTasks[courseName].map((task) => (
                  <MotionLi
                    key={task._id || task.id}
                    animate={
                      deletingTaskId === task._id
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
                    className={`academy-card relative overflow-visible border p-4 ${taskCardClass}`}
                  >
                    {sparkleTaskId === String(task._id || task.id) ? <CreationSparkle /> : null}
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h4 className={`font-semibold ${isDark ? 'text-white' : ''}`}>{task.title}</h4>
                        <p className="text-sm">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                        <p className="text-sm">Study days: {Number(task.studyDays) > 0 ? task.studyDays : 1}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(task)}
                          className="rounded-md bg-[#b38763] px-3 py-1.5 text-xs font-medium text-white"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAnyTask(task)}
                          className="rounded-md bg-[#6f3f3f] px-3 py-1.5 text-xs font-medium text-white"
                        >
                          Delete
                        </button>
                      </div>
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

      {showAddModal ? (
        <ModalPortal>
          <div className="fixed inset-0 z-[160] flex items-start justify-center overflow-y-auto bg-black/35 p-4 backdrop-blur-sm sm:items-center sm:p-6">
            <div
              className={`my-4 w-full max-w-md rounded-xl border p-6 ${
                isDark
                  ? 'border-[#5a463b] bg-[#2d221d] text-[#f6ede6]'
                  : 'border-[#d9c7b8] bg-[#fffaf4] text-[#453434]'
              }`}
            >
              <h3 className="text-xl font-semibold">Add Task</h3>
              {taskMutationError ? (
                <div className={getAlertClass('error', isDark)}>{taskMutationError}</div>
              ) : null}
              {courseActionError ? (
                <div className={getAlertClass('error', isDark)}>{courseActionError}</div>
              ) : null}
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
                <label className="mb-1 block text-sm font-medium">Course</label>
                <CustomDropdown
                  value={addTaskData.course}
                  onChange={(nextCourse) =>
                    setAddTaskData((prev) => ({ ...prev, course: nextCourse }))
                  }
                  isDark={isDark}
                  className="w-full"
                  options={[
                    { value: '', label: 'Select course' },
                    ...availableCourses.map((course) => ({ value: course, label: course })),
                  ]}
                />
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={courseNameInput}
                    onChange={(event) => setCourseNameInput(event.target.value)}
                    placeholder="Add new course"
                    className={`w-full rounded-md border px-3 py-2 ${
                      isDark
                        ? 'border-[#6a5448] bg-[#2d221d] text-[#f6ede6]'
                        : 'border-[#d2c0b1] bg-[#fffaf6] text-[#453434]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddCourse('add')}
                    disabled={isAddingCourse}
                    className="rounded-md bg-[#8b6b57] px-3 py-2 text-xs font-medium text-white"
                  >
                    {isAddingCourse ? 'Adding...' : 'Add'}
                  </button>
                </div>
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
                <label className="mb-1 block text-sm font-medium">Study Days Needed</label>
                <input
                  type="number"
                  min="1"
                  value={addTaskData.studyDays}
                  onChange={(event) =>
                    setAddTaskData((prev) => ({ ...prev, studyDays: Number(event.target.value) || 1 }))
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
                <CustomDropdown
                  value={addTaskData.status}
                  onChange={(nextStatus) =>
                    setAddTaskData((prev) => ({ ...prev, status: nextStatus }))
                  }
                  isDark={isDark}
                  className="w-full"
                  options={TASK_STATUS_OPTIONS.map((option) => ({
                    value: option.value,
                    label: option.label,
                  }))}
                />
              </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTaskMutationError('')
                      setShowAddModal(false)
                    }}
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
        </ModalPortal>
      ) : null}

      {editingTask ? (
        <ModalPortal>
          <div className="fixed inset-0 z-[160] flex items-start justify-center overflow-y-auto bg-black/35 p-4 backdrop-blur-sm sm:items-center sm:p-6">
            <div
              className={`my-4 w-full max-w-md rounded-xl border p-6 ${
                isDark
                  ? 'border-[#5a463b] bg-[#2d221d] text-[#f6ede6]'
                  : 'border-[#d9c7b8] bg-[#fffaf4] text-[#453434]'
              }`}
            >
              <h3 className="text-xl font-semibold">Edit Task</h3>
              {taskMutationError ? (
                <div className={getAlertClass('error', isDark)}>{taskMutationError}</div>
              ) : null}
              {courseActionError ? (
                <div className={getAlertClass('error', isDark)}>{courseActionError}</div>
              ) : null}
              <form className="mt-4 space-y-3" onSubmit={handleSaveEditedTask}>
              <div>
                <label className="mb-1 block text-sm font-medium">Task Name</label>
                <input
                  type="text"
                  value={editTaskData.title}
                  onChange={(event) =>
                    setEditTaskData((prev) => ({ ...prev, title: event.target.value }))
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
                <label className="mb-1 block text-sm font-medium">Course</label>
                <CustomDropdown
                  value={editTaskData.course}
                  onChange={(nextCourse) =>
                    setEditTaskData((prev) => ({ ...prev, course: nextCourse }))
                  }
                  isDark={isDark}
                  className="w-full"
                  options={[
                    { value: '', label: 'Select course' },
                    ...availableCourses.map((course) => ({ value: course, label: course })),
                  ]}
                />
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={courseNameInput}
                    onChange={(event) => setCourseNameInput(event.target.value)}
                    placeholder="Add new course"
                    className={`w-full rounded-md border px-3 py-2 ${
                      isDark
                        ? 'border-[#6a5448] bg-[#2d221d] text-[#f6ede6]'
                        : 'border-[#d2c0b1] bg-[#fffaf6] text-[#453434]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddCourse('edit')}
                    disabled={isAddingCourse}
                    className="rounded-md bg-[#8b6b57] px-3 py-2 text-xs font-medium text-white"
                  >
                    {isAddingCourse ? 'Adding...' : 'Add'}
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Due Date</label>
                <input
                  type="datetime-local"
                  value={editTaskData.dueDate}
                  onChange={(event) =>
                    setEditTaskData((prev) => ({ ...prev, dueDate: event.target.value }))
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
                <label className="mb-1 block text-sm font-medium">Study Days Needed</label>
                <input
                  type="number"
                  min="1"
                  value={editTaskData.studyDays}
                  onChange={(event) =>
                    setEditTaskData((prev) => ({ ...prev, studyDays: Number(event.target.value) || 1 }))
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
                <CustomDropdown
                  value={editTaskData.status}
                  onChange={(nextStatus) =>
                    setEditTaskData((prev) => ({ ...prev, status: nextStatus }))
                  }
                  isDark={isDark}
                  className="w-full"
                  options={TASK_STATUS_OPTIONS.map((option) => ({
                    value: option.value,
                    label: option.label,
                  }))}
                />
              </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTaskMutationError('')
                      setEditingTask(null)
                    }}
                    className="rounded-md bg-[#6f5b50] px-4 py-2 text-sm font-medium text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editTaskLoading}
                    className="rounded-md bg-[#8b6b57] px-4 py-2 text-sm font-medium text-white"
                  >
                    {editTaskLoading ? 'Saving...' : 'Save Changes'}
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

export default TasksPage
