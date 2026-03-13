import { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import useFetch from '../hooks/useFetch'
import { API_BASE_URL } from '../config/api'
import Breadcrumbs from '../components/Breadcrumbs'
import { setSelectedCategory } from '../store/dashboardSlice'
import { getAlertClass } from '../styles/alertStyles'

const dashboardCards = [
  { id: 'tasks', label: 'Tasks', path: '/tasks' },
  { id: 'exams', label: 'Exams', path: '/exams' },
  { id: 'projects', label: 'Projects', path: '/projects' },
  { id: 'other', label: 'Other', path: '/other' },
]

const getTaskCountDueThisWeek = (tasks) => {
  const now = new Date()
  const weekAhead = new Date(now)
  weekAhead.setDate(now.getDate() + 7)

  return tasks.filter((task) => {
    const due = new Date(task.dueDate)
    return due >= now && due <= weekAhead
  }).length
}

function HomePage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.user)
  const { latestSyncAt } = useSelector((state) => state.dashboard)
  const userId = user?.id || ''
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [selectedCourse, setSelectedCourse] = useState('all')

  const tasksQuery = `${API_BASE_URL}/api/tasks?userId=${encodeURIComponent(userId)}&category=tasks`
  const examsQuery = `${API_BASE_URL}/api/exams?userId=${encodeURIComponent(userId)}`
  const projectsQuery = `${API_BASE_URL}/api/projects?userId=${encodeURIComponent(userId)}`

  const { data: tasksData, error: tasksError } = useFetch(tasksQuery)
  const { data: examsData, error: examsError } = useFetch(examsQuery)
  const { data: projectsData, error: projectsError } = useFetch(projectsQuery)

  const tasks = useMemo(() => (Array.isArray(tasksData) ? tasksData : []), [tasksData])
  const exams = useMemo(() => (Array.isArray(examsData) ? examsData : []), [examsData])
  const projects = useMemo(() => (Array.isArray(projectsData) ? projectsData : []), [projectsData])

  const closestExam = useMemo(() => {
    const now = new Date()
    const upcoming = exams
      .map((exam) => ({
        ...exam,
        examDateTime: new Date(`${new Date(exam.date).toISOString().slice(0, 10)}T${exam.time || '00:00'}`),
      }))
      .filter((exam) => exam.examDateTime >= now)
      .sort((a, b) => a.examDateTime - b.examDateTime)
    return upcoming[0] || null
  }, [exams])

  const dueThisWeekCount = useMemo(() => getTaskCountDueThisWeek(tasks), [tasks])

  const courses = useMemo(() => {
    const allCourses = [
      ...tasks.map((item) => item.course),
      ...exams.map((item) => item.course),
      ...projects.map((item) => item.course),
    ].filter(Boolean)
    return Array.from(new Set(allCourses)).sort()
  }, [tasks, exams, projects])

  const courseSummary = useMemo(() => {
    const filter = selectedCourse === 'all' ? null : selectedCourse
    const filteredTasks = filter ? tasks.filter((item) => item.course === filter) : tasks
    const filteredExams = filter ? exams.filter((item) => item.course === filter) : exams
    const filteredProjects = filter ? projects.filter((item) => item.course === filter) : projects
    return {
      tasksCount: filteredTasks.length,
      examsCount: filteredExams.length,
      projectsCount: filteredProjects.length,
    }
  }, [selectedCourse, tasks, exams, projects])

  const handleOpenCategory = (id, path) => {
    dispatch(setSelectedCategory(id))
    navigate(path)
  }

  const anyError = tasksError || examsError || projectsError

  return (
    <section
      className={`rounded-2xl border p-6 shadow-lg backdrop-blur-sm ${
        isDark
          ? 'border-[#5a463b] bg-[#2d221d]/85 text-[#f6ede6]'
          : 'border-[#d9c7b8] bg-[#fff8f1]/88 text-[#453434]'
      }`}
    >
      <Breadcrumbs isDark={isDark} />
      <h2 className="text-2xl font-bold">Hybrid Dashboard</h2>
      <p className={`mt-1 text-sm ${isDark ? 'text-[#eadccf]' : 'text-[#6b5447]'}`}>
        Smart overview of your academic timeline.
      </p>

      {anyError ? <div className={getAlertClass('error', isDark)}>{anyError}</div> : null}

      <div
        className={`mt-6 grid gap-4 rounded-xl border p-4 md:grid-cols-2 ${
          isDark ? 'border-[#5a463b] bg-[#1f1612]/80' : 'border-[#d9c7b8] bg-[#fffaf4]/85'
        }`}
      >
        <div>
          <p className="text-sm font-medium">Closest Upcoming Exam</p>
          {closestExam ? (
            <p className="mt-1 text-sm">
              {closestExam.course} - {closestExam.examDateTime.toLocaleString()} (
              {closestExam.location?.building} / {closestExam.location?.room})
            </p>
          ) : (
            <p className="mt-1 text-sm">No upcoming exams.</p>
          )}
        </div>
        <div>
          <p className="text-sm font-medium">Tasks Due This Week</p>
          <p className="mt-1 text-2xl font-bold">{dueThisWeekCount}</p>
          <p className="mt-1 text-xs">
            {latestSyncAt ? `Latest Moodle sync: ${new Date(latestSyncAt).toLocaleString()}` : 'No sync yet.'}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {dashboardCards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => handleOpenCategory(card.id, card.path)}
            className={`rounded-xl border p-6 text-left transition hover:-translate-y-0.5 ${
              isDark
                ? 'border-[#5f4a3f] bg-[#2f241f]/90 hover:bg-[#3a2b24]'
                : 'border-[#d9c7b8] bg-[#fffaf4]/95 hover:bg-[#fff2e6]'
            }`}
          >
            <h3 className="text-lg font-semibold">{card.label}</h3>
          </button>
        ))}
      </div>

      <div
        className={`mt-6 rounded-xl border p-4 ${
          isDark ? 'border-[#5a463b] bg-[#1f1612]/80' : 'border-[#d9c7b8] bg-[#fffaf4]/85'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">Browse by Course</h3>
          <select
            value={selectedCourse}
            onChange={(event) => setSelectedCourse(event.target.value)}
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
        </div>

        <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
          <div
            className={`min-w-[170px] rounded-lg border p-3 ${
              isDark ? 'border-[#5f4a3f] bg-[#2f241f]/90' : 'border-[#d9c7b8] bg-[#fffaf4]/95'
            }`}
          >
            <p className="text-xs uppercase tracking-wide">Tasks</p>
            <p className="mt-1 text-xl font-bold">{courseSummary.tasksCount}</p>
          </div>
          <div
            className={`min-w-[170px] rounded-lg border p-3 ${
              isDark ? 'border-[#5f4a3f] bg-[#2f241f]/90' : 'border-[#d9c7b8] bg-[#fffaf4]/95'
            }`}
          >
            <p className="text-xs uppercase tracking-wide">Exams</p>
            <p className="mt-1 text-xl font-bold">{courseSummary.examsCount}</p>
          </div>
          <div
            className={`min-w-[170px] rounded-lg border p-3 ${
              isDark ? 'border-[#5f4a3f] bg-[#2f241f]/90' : 'border-[#d9c7b8] bg-[#fffaf4]/95'
            }`}
          >
            <p className="text-xs uppercase tracking-wide">Projects</p>
            <p className="mt-1 text-xl font-bold">{courseSummary.projectsCount}</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HomePage
