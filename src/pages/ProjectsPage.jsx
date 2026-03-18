import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
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

const initialForm = {
  title: '',
  course: '',
  deadline: '',
  studyDays: 1,
  progress: 0,
}

function ProjectsPage() {
  const MotionLi = motion.li
  const MotionDiv = motion.div
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.user)
  const lastCreatedItem = useSelector((state) => state.dashboard.lastCreatedItem)
  const userId = user?.id || ''
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [formData, setFormData] = useState(initialForm)
  const [editingId, setEditingId] = useState('')
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [moodleProgressMap, setMoodleProgressMap] = useState({})
  const [dbProgressMap, setDbProgressMap] = useState({})
  const [courseFilter, setCourseFilter] = useState('all')
  const [sparkleProjectId, setSparkleProjectId] = useState('')
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [deletingProjectId, setDeletingProjectId] = useState('')
  const [showTrashFx, setShowTrashFx] = useState(false)
  const [trashPulse, setTrashPulse] = useState(false)
  const [courseActionError, setCourseActionError] = useState('')
  const [courseNameInput, setCourseNameInput] = useState('')
  const [isAddingCourse, setIsAddingCourse] = useState(false)
  const [coursesRefreshKey, setCoursesRefreshKey] = useState(0)
  const courseCardClass = isDark
    ? 'border-[#a68467]/55 bg-[#4a372b]/55 text-[#f6e9d5]'
    : 'border-[#c2a485]/70 bg-[#f6ecdf]/65 text-[#5a3f2f]'
  const itemCardClass = isDark
    ? 'border-[#b07a4f]/60 bg-[#5b3a2a]/30 text-[#f6ede6]'
    : 'border-[#d4a06d]/65 bg-[#f5e1cf]/70 text-[#453434]'
  const primaryActionBtnClass = isDark
    ? 'rounded-lg border border-[#b39271]/55 bg-[#6c4f3e]/85 px-4 py-2 text-sm font-semibold text-[#f6e9d5] transition hover:bg-[#7a5b47]'
    : 'rounded-lg border border-[#b48f6e]/75 bg-[#9a7459]/95 px-4 py-2 text-sm font-semibold text-[#fff7ee] shadow-[0_6px_14px_rgba(88,58,39,0.2)] transition hover:bg-[#87664f]'

  const validateStudyDays = (deadlineValue, studyDaysValue) => {
    const deadline = new Date(deadlineValue)
    if (Number.isNaN(deadline.getTime())) {
      return 'Please select a valid deadline.'
    }

    const now = new Date()
    const msPerDay = 1000 * 60 * 60 * 24
    const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / msPerDay)

    if (daysLeft <= 0) {
      return 'Deadline must be in the future.'
    }

    const normalizedStudyDays = Number(studyDaysValue) || 1
    if (normalizedStudyDays > daysLeft) {
      return `You entered ${normalizedStudyDays} study days, but only ${daysLeft} day(s) are left until the deadline.`
    }

    return ''
  }

  useEffect(() => {
    dispatch(setSelectedCategory('projects'))
  }, [dispatch])

  const { data, loading, error, refetch } = useFetch(
    `${API_BASE_URL}/api/projects?userId=${encodeURIComponent(userId)}&r=${refreshKey}`,
  )
  const {
    data: coursesData,
    error: coursesError,
    refetch: refetchCourses,
  } = useFetch(`${API_BASE_URL}/api/courses?r=${coursesRefreshKey}`)
  const { data: moodleData } = useFetch(`${API_BASE_URL}/api/moodle/sync`)
  const projects = useMemo(() => (Array.isArray(data) ? data : []), [data])
  const moodleProjects = useMemo(
    () => (Array.isArray(moodleData?.projects) ? moodleData.projects : []),
    [moodleData],
  )
  const availableCourses = useMemo(
    () => (Array.isArray(coursesData) ? coursesData.map((course) => course.name).filter(Boolean).sort() : []),
    [coursesData],
  )
  const allProjects = useMemo(() => {
    const imported = projects.map((project) => ({
      ...project,
      id: project._id,
      source: 'db',
    }))
    const mocked = moodleProjects
      .filter(
        (moodleProject) =>
          !projects.some(
            (project) =>
              project.title === moodleProject.title && project.course === moodleProject.course,
          ),
      )
      .map((project) => ({
        ...project,
        id: project.id,
        source: 'moodle',
        progress: moodleProgressMap[project.id] ?? 0,
      }))
    return [...imported, ...mocked]
  }, [projects, moodleProjects, moodleProgressMap])
  const courses = useMemo(
    () => Array.from(new Set(allProjects.map((project) => project.course).filter(Boolean))).sort(),
    [allProjects],
  )
  const normalizedCourseFilter =
    courseFilter === 'all' || courses.includes(courseFilter) ? courseFilter : 'all'
  const visibleProjects = useMemo(
    () =>
      normalizedCourseFilter === 'all'
        ? allProjects
        : allProjects.filter((project) => project.course === normalizedCourseFilter),
    [allProjects, normalizedCourseFilter],
  )
  const groupedProjects = useMemo(() => {
    return visibleProjects.reduce((acc, project) => {
      const courseName = project.course || 'Unassigned Course'
      if (!acc[courseName]) {
        acc[courseName] = []
      }
      acc[courseName].push(project)
      return acc
    }, {})
  }, [visibleProjects])
  const groupedCourses = useMemo(() => Object.keys(groupedProjects).sort(), [groupedProjects])
  const isProjectModalOpen = showProjectModal

  useEffect(() => {
    if (!lastCreatedItem || lastCreatedItem.category !== 'projects' || !lastCreatedItem.id) {
      return
    }
    setSparkleProjectId(String(lastCreatedItem.id))
    dispatch(clearLastCreatedItem())
    const timer = setTimeout(() => setSparkleProjectId(''), 1000)
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

  const openAddModal = () => {
    setEditingId('')
    setFormData(initialForm)
    setShowProjectModal(true)
    setErrorMessage('')
    setCourseActionError('')
    setMessage('')
  }

  const handleAddCourse = async () => {
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
      setFormData((prev) => ({ ...prev, course: trimmedName }))
      setCourseNameInput('')
      triggerCoursesRefresh()
    } catch (createError) {
      setCourseActionError(createError.message)
    } finally {
      setIsAddingCourse(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage('')
    setErrorMessage('')
    if (!formData.course.trim() && courseNameInput.trim()) {
      setErrorMessage('You typed a new course name. Click "Add" to create/select it first.')
      return
    }
    if (!formData.course.trim()) {
      setErrorMessage('Course is required.')
      return
    }
    if (!formData.title.trim()) {
      setErrorMessage('Project title is required.')
      return
    }
    if (!formData.deadline) {
      setErrorMessage('Deadline is required.')
      return
    }
    if (Number(formData.studyDays) < 1) {
      setErrorMessage('Study days must be at least 1.')
      return
    }

    const studyDaysError = validateStudyDays(formData.deadline, formData.studyDays)
    if (studyDaysError) {
      setErrorMessage(studyDaysError)
      return
    }

    try {
      const response = await fetch(
        editingId ? `${API_BASE_URL}/api/projects/${editingId}` : `${API_BASE_URL}/api/projects`,
        {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            studyDays: Number(formData.studyDays) || 1,
            progress: Number(formData.progress),
            userId,
          }),
        },
      )

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.message || 'Failed to save project')
      }

      const savedProject = await response.json().catch(() => null)
      if (!editingId) {
        const createdProjectId = savedProject?._id || savedProject?.id
        if (createdProjectId) {
          dispatch(
            markItemCreated({
              category: 'projects',
              id: String(createdProjectId),
              createdAt: Date.now(),
            }),
          )
        }
      }

      setFormData(initialForm)
      setEditingId('')
      setShowProjectModal(false)
      setMessage(editingId ? 'Project updated successfully.' : 'Project created successfully.')
      triggerRefresh()
    } catch (submitError) {
      setErrorMessage(submitError.message)
    }
  }

  const startEdit = (project) => {
    setErrorMessage('')
    setCourseActionError('')
    setEditingId(project._id)
    setFormData({
      title: project.title,
      course: project.course,
      deadline: new Date(project.deadline).toISOString().slice(0, 16),
      studyDays: Number(project.studyDays) > 0 ? Number(project.studyDays) : 1,
      progress: project.progress,
    })
    setShowProjectModal(true)
    setMessage('')
  }

  const handleDelete = async (project) => {
    if (!window.confirm('Are you sure you want to delete?')) {
      return
    }
    setErrorMessage('')
    try {
      setDeletingProjectId(project._id)
      setShowTrashFx(true)
      setTrashPulse(true)
      await new Promise((resolve) => setTimeout(resolve, 680))
      const response = await fetch(`${API_BASE_URL}/api/projects/${project._id}`, { method: 'DELETE' })
      if (!response.ok) {
        throw new Error('Failed to delete project')
      }
      await new Promise((resolve) => setTimeout(resolve, 140))
      triggerRefresh()
    } catch (deleteError) {
      setErrorMessage(deleteError.message)
    } finally {
      setDeletingProjectId('')
      setTrashPulse(false)
      setTimeout(() => setShowTrashFx(false), 200)
    }
  }

  const handleProgressChange = async (project, nextProgress) => {
    if (project.source === 'moodle') {
      setMoodleProgressMap((prev) => ({ ...prev, [project.id]: nextProgress }))
      return
    }

    setDbProgressMap((prev) => ({ ...prev, [project.id]: nextProgress }))
    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/${project._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: project.title,
          course: project.course,
          deadline: project.deadline,
          progress: nextProgress,
          userId,
        }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.message || 'Failed to update project progress')
      }
    } catch (progressError) {
      setDbProgressMap((prev) => {
        const next = { ...prev }
        delete next[project.id]
        return next
      })
      setErrorMessage(progressError.message)
    }
  }

  return (
    <section className="rounded-2xl border border-transparent bg-transparent p-6 shadow-none backdrop-blur-0 transition-colors duration-300">
      <Breadcrumbs isDark={isDark} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : ''}`}>Projects</h2>
        <div className="flex items-center gap-2">
          <CustomDropdown
            value={normalizedCourseFilter}
            onChange={setCourseFilter}
            isDark={isDark}
            className="min-w-[180px]"
            options={[
              { value: 'all', label: 'All courses' },
              ...courses.map((course) => ({ value: course, label: course })),
            ]}
          />
          <button
            type="button"
            onClick={openAddModal}
            className={primaryActionBtnClass}
          >
            Add Project
          </button>
        </div>
      </div>

      {error ? <div className={getAlertClass('error', isDark)}>{error}</div> : null}
      {!isProjectModalOpen && errorMessage ? (
        <div className={getAlertClass('error', isDark)}>{errorMessage}</div>
      ) : null}
      {message ? <div className={getAlertClass('success', isDark)}>{message}</div> : null}
      {coursesError ? <div className={getAlertClass('error', isDark)}>{coursesError}</div> : null}
      {!isProjectModalOpen && courseActionError ? (
        <div className={getAlertClass('error', isDark)}>{courseActionError}</div>
      ) : null}

      {loading ? (
        <p className={`mt-6 text-sm ${isDark ? 'text-[#eadccf]' : 'text-[#6b5447]'}`}>
          Loading projects...
        </p>
      ) : null}

      {!loading && !error && visibleProjects.length === 0 ? (
        <p className={`mt-6 text-sm ${isDark ? 'text-[#eadccf]' : 'text-[#6b5447]'}`}>
          No projects found for this filter.
        </p>
      ) : null}

      {!loading && !error && visibleProjects.length > 0 ? (
        <div className="mt-6 space-y-4">
          {groupedCourses.map((courseName) => (
            <div
              key={courseName}
              className={`academy-card border p-4 ${courseCardClass}`}
            >
              <h3 className={`mb-3 text-sm font-semibold ${isDark ? 'text-white' : ''}`}>{courseName}</h3>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {groupedProjects[courseName].map((project) => (
                  <MotionLi
                    key={project.id}
                    animate={
                      deletingProjectId === project._id
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
                    className={`academy-card relative overflow-visible border p-4 ${itemCardClass}`}
                  >
                    {sparkleProjectId === String(project.id) && project.source === 'db' ? (
                      <CreationSparkle />
                    ) : null}
                    <h4 className={`font-semibold ${isDark ? 'text-white' : ''}`}>{project.title}</h4>
                    <p className="text-sm">Deadline: {new Date(project.deadline).toLocaleString()}</p>
                    <p className="text-sm">
                      Study days: {Number(project.studyDays) > 0 ? project.studyDays : 1}
                    </p>
                    <div className="mt-2 h-2.5 w-full rounded-full bg-[#d2c0b1]">
                      <div
                        className="h-2.5 rounded-full bg-[#8b6b57]"
                        style={{ width: `${Math.max(0, Math.min(100, project.progress || 0))}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs">
                      Progress:{' '}
                      {project.source === 'db'
                        ? dbProgressMap[project.id] ?? project.progress ?? 0
                        : project.progress ?? 0}
                      %
                    </p>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={
                        project.source === 'db'
                          ? dbProgressMap[project.id] ?? project.progress ?? 0
                          : project.progress ?? 0
                      }
                      onChange={(event) => handleProgressChange(project, Number(event.target.value))}
                      className="mt-2 w-full accent-[#8b6b57]"
                    />
                    <div className="mt-3 flex gap-2">
                      {project.source === 'db' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => startEdit(project)}
                            className="rounded-md bg-[#b38763] px-3 py-1.5 text-xs font-medium text-white"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(project)}
                            className="rounded-md bg-[#6f3f3f] px-3 py-1.5 text-xs font-medium text-white"
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        <p className="text-xs">Source: Moodle projects feed</p>
                      )}
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

      {showProjectModal ? (
        <ModalPortal>
          <div className="fixed inset-0 z-[160] flex items-start justify-center overflow-y-auto bg-black/35 p-4 backdrop-blur-sm sm:items-center sm:p-6">
            <div
              className={`my-4 w-full max-w-md rounded-xl border p-6 ${
                isDark
                  ? 'border-[#5a463b] bg-[#2d221d] text-[#f6ede6]'
                  : 'border-[#d9c7b8] bg-[#fffaf4] text-[#453434]'
              }`}
            >
              <h3 className="text-xl font-semibold">{editingId ? 'Edit Project' : 'Add Project'}</h3>
              {errorMessage ? <div className={getAlertClass('error', isDark)}>{errorMessage}</div> : null}
              {courseActionError ? (
                <div className={getAlertClass('error', isDark)}>{courseActionError}</div>
              ) : null}
              <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
              <input
                type="text"
                value={formData.title}
                onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Project title"
                className={getFormInputClass(isDark)}
                required
              />
              <CustomDropdown
                value={formData.course}
                onChange={(nextCourse) => setFormData((prev) => ({ ...prev, course: nextCourse }))}
                isDark={isDark}
                className="w-full"
                options={[
                  { value: '', label: 'Select course' },
                  ...availableCourses.map((course) => ({ value: course, label: course })),
                ]}
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={courseNameInput}
                  onChange={(event) => setCourseNameInput(event.target.value)}
                  placeholder="Add new course"
                  className={getFormInputClass(isDark)}
                />
                <button
                  type="button"
                  onClick={handleAddCourse}
                  disabled={isAddingCourse}
                  className="rounded-md bg-[#8b6b57] px-3 py-2 text-xs font-medium text-white"
                >
                  {isAddingCourse ? 'Adding...' : 'Add'}
                </button>
              </div>
              <input
                type="datetime-local"
                value={formData.deadline}
                onChange={(event) => setFormData((prev) => ({ ...prev, deadline: event.target.value }))}
                className={getFormInputClass(isDark)}
                required
              />
              <input
                type="number"
                min="1"
                value={formData.studyDays}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, studyDays: Number(event.target.value) || 1 }))
                }
                placeholder="Study days needed"
                className={getFormInputClass(isDark)}
                required
              />
              <input
                type="number"
                min="0"
                max="100"
                value={formData.progress}
                onChange={(event) => setFormData((prev) => ({ ...prev, progress: Number(event.target.value) }))}
                placeholder="Progress %"
                className={getFormInputClass(isDark)}
                required
              />

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage('')
                      setCourseActionError('')
                      setShowProjectModal(false)
                    }}
                    className="rounded-md bg-[#6f5b50] px-4 py-2 text-sm font-medium text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-[#8b6b57] px-4 py-2 text-sm font-medium text-white"
                  >
                    {editingId ? 'Save Changes' : 'Save Project'}
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

export default ProjectsPage
