import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Breadcrumbs from '../components/Breadcrumbs'
import CreationSparkle from '../components/CreationSparkle'
import CustomDropdown from '../components/CustomDropdown'
import FormCard from '../components/FormCard'
import { useTheme } from '../context/ThemeContext'
import useFetch from '../hooks/useFetch'
import { API_BASE_URL } from '../config/api'
import { markItemCreated, setSelectedCategory } from '../store/dashboardSlice'
import { getAlertClass } from '../styles/alertStyles'
import { getFormInputClass } from '../styles/formStyles'

const initialForm = {
  title: '',
  course: '',
  deadline: '',
  progress: 0,
}

function ProjectsPage() {
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

  useEffect(() => {
    dispatch(setSelectedCategory('projects'))
  }, [dispatch])

  const { data, loading, error, refetch } = useFetch(
    `${API_BASE_URL}/api/projects?userId=${encodeURIComponent(userId)}&r=${refreshKey}`,
  )
  const { data: moodleData } = useFetch(`${API_BASE_URL}/api/moodle/sync`)
  const projects = useMemo(() => (Array.isArray(data) ? data : []), [data])
  const moodleProjects = useMemo(
    () => (Array.isArray(moodleData?.projects) ? moodleData.projects : []),
    [moodleData],
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

  useEffect(() => {
    if (!lastCreatedItem || lastCreatedItem.category !== 'projects' || !lastCreatedItem.id) {
      return
    }
    setSparkleProjectId(String(lastCreatedItem.id))
    const timer = setTimeout(() => setSparkleProjectId(''), 1000)
    return () => clearTimeout(timer)
  }, [lastCreatedItem])

  const triggerRefresh = () => {
    refetch()
    setRefreshKey((prev) => prev + 1)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage('')
    setErrorMessage('')

    try {
      const response = await fetch(
        editingId ? `${API_BASE_URL}/api/projects/${editingId}` : `${API_BASE_URL}/api/projects`,
        {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
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
      setMessage(editingId ? 'Project updated successfully.' : 'Project created successfully.')
      triggerRefresh()
    } catch (submitError) {
      setErrorMessage(submitError.message)
    }
  }

  const startEdit = (project) => {
    setEditingId(project._id)
    setFormData({
      title: project.title,
      course: project.course,
      deadline: new Date(project.deadline).toISOString().slice(0, 16),
      progress: project.progress,
    })
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete?')) {
      return
    }
    setErrorMessage('')
    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/${id}`, { method: 'DELETE' })
      if (!response.ok) {
        throw new Error('Failed to delete project')
      }
      triggerRefresh()
    } catch (deleteError) {
      setErrorMessage(deleteError.message)
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
    <section
      className={`rounded-2xl border p-6 shadow-lg backdrop-blur-sm transition-colors duration-300 ${
        isDark
          ? 'academy-page-dark border-[#7d654f]'
          : 'academy-page-light border-[#d1bfa7]'
      }`}
    >
      <Breadcrumbs isDark={isDark} />
      <h2 className="text-2xl font-bold">Projects</h2>
      <div className="mt-3 flex items-center gap-3">
        <label className="text-xs font-medium">Filter by course:</label>
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
      </div>

      {error ? <div className={getAlertClass('error', isDark)}>{error}</div> : null}
      {errorMessage ? <div className={getAlertClass('error', isDark)}>{errorMessage}</div> : null}
      {message ? <div className={getAlertClass('success', isDark)}>{message}</div> : null}

      <FormCard
        isDark={isDark}
        onSubmit={handleSubmit}
        actions={
          <>
            <button
              type="submit"
              className="rounded-md bg-[#8b6b57] px-4 py-2 text-sm font-medium text-white"
            >
              {editingId ? 'Update Project' : 'Add Project'}
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
        <div className="grid gap-3 md:grid-cols-2">
          <input
            type="text"
            value={formData.title}
            onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="Project title"
            className={getFormInputClass(isDark)}
            required
          />
          <input
            type="text"
            value={formData.course}
            onChange={(event) => setFormData((prev) => ({ ...prev, course: event.target.value }))}
            placeholder="Course name"
            className={getFormInputClass(isDark)}
            required
          />
          <input
            type="datetime-local"
            value={formData.deadline}
            onChange={(event) => setFormData((prev) => ({ ...prev, deadline: event.target.value }))}
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
        </div>
      </FormCard>

      {loading ? (
        <p className={`mt-4 text-sm ${isDark ? 'text-[#eadccf]' : 'text-[#6b5447]'}`}>
          Loading projects...
        </p>
      ) : null}

      <div className="mt-6 space-y-4">
        {groupedCourses.map((courseName) => (
          <div
            key={courseName}
            className={`academy-card p-4 ${isDark ? 'academy-card-dark' : 'academy-card-light'}`}
          >
            <h3 className="mb-3 text-sm font-semibold">{courseName}</h3>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {groupedProjects[courseName].map((project) => (
                <li
                  key={project.id}
                  className={`academy-card relative overflow-visible p-4 ${
                    isDark ? 'academy-card-dark' : 'academy-card-light'
                  }`}
                >
                  {sparkleProjectId === String(project.id) && project.source === 'db' ? (
                    <CreationSparkle />
                  ) : null}
                  <h4 className="font-semibold">{project.title}</h4>
                  <p className="text-sm">Deadline: {new Date(project.deadline).toLocaleString()}</p>
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
                          onClick={() => handleDelete(project._id)}
                          className="rounded-md bg-[#6f3f3f] px-3 py-1.5 text-xs font-medium text-white"
                        >
                          Delete
                        </button>
                      </>
                    ) : (
                      <p className="text-xs">Source: Moodle projects feed</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}

export default ProjectsPage
