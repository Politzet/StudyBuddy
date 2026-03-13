import { useEffect, useMemo, useState } from 'react'
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
  deadline: '',
  progress: 0,
}

function ProjectsPage() {
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
  const [moodleProgressMap, setMoodleProgressMap] = useState({})

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

    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/${project._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: nextProgress }),
      })
      if (!response.ok) {
        throw new Error('Failed to update project progress')
      }
      triggerRefresh()
    } catch (progressError) {
      setErrorMessage(progressError.message)
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
      <h2 className="text-2xl font-bold">Projects</h2>

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

      <ul className="mt-6 space-y-3">
        {allProjects.map((project) => (
          <li
            key={project.id}
            className={`rounded-xl border p-4 ${
              isDark ? 'border-[#5a463b] bg-[#1f1612]/80' : 'border-[#d9c7b8] bg-[#fffaf4]/85'
            }`}
          >
            <h3 className="font-semibold">{project.title}</h3>
            <p className="text-sm">Course: {project.course}</p>
            <p className="text-sm">Deadline: {new Date(project.deadline).toLocaleString()}</p>
            <div className="mt-2 h-2.5 w-full rounded-full bg-[#d2c0b1]">
              <div
                className="h-2.5 rounded-full bg-[#8b6b57]"
                style={{ width: `${Math.max(0, Math.min(100, project.progress || 0))}%` }}
              />
            </div>
            <p className="mt-1 text-xs">Progress: {project.progress || 0}%</p>
            <input
              type="range"
              min="0"
              max="100"
              value={project.progress || 0}
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
    </section>
  )
}

export default ProjectsPage
