import { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTheme } from '../context/ThemeContext'
import useFetch from '../hooks/useFetch'
import { API_BASE_URL } from '../config/api'
import Breadcrumbs from '../components/Breadcrumbs'
import CustomDropdown from '../components/CustomDropdown'
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

const getExamDateTime = (exam) => {
  const datePart = new Date(exam.date).toISOString().slice(0, 10)
  const startTime = String(exam.time || '00:00').split('-')[0].trim()
  return new Date(`${datePart}T${startTime || '00:00'}`)
}

const dashboardStagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.08,
    },
  },
}

const dashboardItem = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
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
  const moodleQuery = `${API_BASE_URL}/api/moodle/sync`

  const { data: tasksData, error: tasksError } = useFetch(tasksQuery)
  const { data: examsData, error: examsError } = useFetch(examsQuery)
  const { data: projectsData, error: projectsError } = useFetch(projectsQuery)
  const { data: moodleData, error: moodleError } = useFetch(moodleQuery)

  const tasks = useMemo(() => (Array.isArray(tasksData) ? tasksData : []), [tasksData])
  const exams = useMemo(() => (Array.isArray(examsData) ? examsData : []), [examsData])
  const projects = useMemo(() => (Array.isArray(projectsData) ? projectsData : []), [projectsData])
  const moodleExams = useMemo(
    () => (Array.isArray(moodleData?.exams) ? moodleData.exams : []),
    [moodleData],
  )
  const moodleProjects = useMemo(
    () => (Array.isArray(moodleData?.projects) ? moodleData.projects : []),
    [moodleData],
  )
  const allTasks = useMemo(() => {
    return userId ? tasks.filter((task) => String(task.userId || '') === String(userId)) : []
  }, [tasks, userId])
  const allExams = useMemo(() => {
    const manualExams = Array.isArray(exams) ? exams : []
    const extraMoodleExams = moodleExams.filter(
      (moodleExam) =>
        !manualExams.some(
          (exam) =>
            exam.course === moodleExam.course &&
            new Date(exam.date).toISOString().slice(0, 10) === moodleExam.date &&
            String(exam.time || '').trim() === String(moodleExam.time || '').trim(),
        ),
    )
    return [...manualExams, ...extraMoodleExams]
  }, [exams, moodleExams])
  const allProjects = useMemo(() => {
    const manualProjects = Array.isArray(projects) ? projects : []
    const extraMoodleProjects = moodleProjects.filter(
      (moodleProject) =>
        !manualProjects.some(
          (project) => project.title === moodleProject.title && project.course === moodleProject.course,
        ),
    )
    return [...manualProjects, ...extraMoodleProjects]
  }, [projects, moodleProjects])

  const upcomingWeekExams = useMemo(() => {
    const now = new Date()
    const weekAhead = new Date(now)
    weekAhead.setDate(now.getDate() + 7)

    return allExams
      .map((exam) => ({
        ...exam,
        examDateTime: getExamDateTime(exam),
      }))
      .filter((exam) => exam.examDateTime >= now && exam.examDateTime <= weekAhead)
      .sort((a, b) => a.examDateTime - b.examDateTime)
  }, [allExams])

  const closestExam = useMemo(() => {
    if (!allExams.length) {
      return null
    }
    const now = Date.now()
    const normalized = allExams
      .map((exam) => ({
        ...exam,
        examDateTime: getExamDateTime(exam),
      }))
      .sort((a, b) => {
        const aDiff = a.examDateTime.getTime() - now
        const bDiff = b.examDateTime.getTime() - now

        const aIsFuture = aDiff >= 0
        const bIsFuture = bDiff >= 0

        if (aIsFuture && !bIsFuture) {
          return -1
        }
        if (!aIsFuture && bIsFuture) {
          return 1
        }
        if (aIsFuture && bIsFuture) {
          return aDiff - bDiff
        }
        return Math.abs(aDiff) - Math.abs(bDiff)
      })

    return normalized[0] || null
  }, [allExams])

  const openTasksDueThisWeek = useMemo(() => {
    const now = new Date()
    const weekAhead = new Date(now)
    weekAhead.setDate(now.getDate() + 7)

    return allTasks
      .filter((task) => {
        const due = new Date(task.dueDate)
        const isOpen = task.status !== 'completed'
        return isOpen && due >= now && due <= weekAhead
      })
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
  }, [allTasks])
  const openDueThisWeekCount = openTasksDueThisWeek.length


  const magicalHeadline = useMemo(() => {
    const headings = ['THE ENCHANTED SUMMARY', 'WEEKLY OMEN & NOTICES']
    const weekSeed = Math.floor(Date.now() / (1000 * 60 * 60 * 24 * 7))
    return headings[weekSeed % headings.length]
  }, [])

  const courses = useMemo(() => {
    const allCourses = [
      ...allTasks.map((item) => item.course),
      ...allExams.map((item) => item.course),
      ...allProjects.map((item) => item.course),
    ].filter(Boolean)
    return Array.from(new Set(allCourses)).sort()
  }, [allTasks, allExams, allProjects])

  const courseSummary = useMemo(() => {
    const filter = selectedCourse === 'all' ? null : selectedCourse
    const filteredTasks = filter ? allTasks.filter((item) => item.course === filter) : allTasks
    const filteredExams = filter ? allExams.filter((item) => item.course === filter) : allExams
    const filteredProjects = filter
      ? allProjects.filter((item) => item.course === filter)
      : allProjects
    return {
      tasksCount: filteredTasks.length,
      examsCount: filteredExams.length,
      projectsCount: filteredProjects.length,
    }
  }, [selectedCourse, allTasks, allExams, allProjects])

  const handleOpenCategory = (id, path) => {
    dispatch(setSelectedCategory(id))
    navigate(path)
  }

  const anyError = tasksError || examsError || projectsError || moodleError

  return (
    <motion.section
      variants={dashboardStagger}
      initial="hidden"
      animate="show"
      className={`rounded-2xl border p-6 shadow-lg backdrop-blur-sm transition-colors duration-300 ${
        isDark
          ? 'academy-page-dark border-[#7d654f]'
          : 'academy-page-light border-[#d1bfa7]'
      }`}
    >
      <Breadcrumbs isDark={isDark} />
      <h2 className="text-3xl font-bold">Hybrid Dashboard</h2>
      <p className={`mt-1 text-sm ${isDark ? 'text-[#eadccf]' : 'text-[#6b5447]'}`}>
        Smart overview of your academic timeline.
      </p>

      {anyError ? <div className={getAlertClass('error', isDark)}>{anyError}</div> : null}

      <motion.div
        variants={dashboardItem}
        className={`academy-card mt-6 p-6 text-center ${
          isDark ? 'academy-card-dark' : 'academy-card-light'
        } border-[#d4af37]/40 shadow-[0_8px_30px_rgba(92,64,34,0.2)]`}
      >
        <h3
          className="text-2xl font-bold tracking-wide"
          style={{ color: '#D4AF37', textShadow: '0 0 10px rgba(212, 175, 55, 0.22)' }}
        >
          {magicalHeadline}
        </h3>

        <div className="mx-auto mt-3 h-px w-40 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />

        <div
          className={`mt-4 rounded-xl border px-4 py-3 ${
            upcomingWeekExams.length > 0
              ? isDark
                ? 'border-[#b07a4f]/60 bg-[#5b3a2a]/30'
                : 'border-[#d4a06d]/65 bg-[#f5e1cf]/70'
              : isDark
                ? 'border-[#7a634f]/55 bg-[#3a2d26]/45'
                : 'border-[#d1bfa7]/70 bg-[#f4eae0]/70'
          }`}
        >
          {upcomingWeekExams.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {upcomingWeekExams.map((exam) => (
                <li key={exam._id || exam.id || `${exam.course}-${exam.date}-${exam.time}`}>
                  <span className="font-semibold">{exam.course}</span> |{' '}
                  <span>{exam.examDateTime.toLocaleDateString()}</span> |{' '}
                  <span>{exam.location?.room || 'Room TBD'}</span>
                </li>
              ))}
            </ul>
          ) : closestExam ? (
            <p className="text-sm">
              <span className="font-semibold">{closestExam.course}</span> |{' '}
              <span>{closestExam.examDateTime.toLocaleDateString()}</span> |{' '}
              <span>{closestExam.location?.room || 'Room TBD'}</span>
            </p>
          ) : (
            <p className="text-sm">The horizon is clear of examinations... for now.</p>
          )}
        </div>

        <p className="mt-4 text-sm font-semibold tracking-wide">
          {openDueThisWeekCount} Assignments due this week
        </p>
        {openTasksDueThisWeek.length > 0 ? (
          <ul className="mx-auto mt-2 max-w-2xl space-y-1 text-sm">
            {openTasksDueThisWeek.slice(0, 3).map((task) => (
              <li key={task._id || `${task.course}-${task.title}-${task.dueDate}`}>
                {task.course}: {task.title} ({new Date(task.dueDate).toLocaleDateString()})
              </li>
            ))}
          </ul>
        ) : null}
      </motion.div>

      <motion.div variants={dashboardItem} className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {dashboardCards.map((card) => (
          <motion.button
            variants={dashboardItem}
            key={card.id}
            type="button"
            onClick={() => handleOpenCategory(card.id, card.path)}
            className={`academy-card p-6 text-left ${isDark ? 'academy-card-dark' : 'academy-card-light'}`}
          >
            <h3 className="text-lg font-semibold">{card.label}</h3>
          </motion.button>
        ))}
      </motion.div>

      <motion.div
        variants={dashboardItem}
        className={`academy-card mt-6 p-4 ${isDark ? 'academy-card-dark' : 'academy-card-light'}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">Browse by Course</h3>
          <CustomDropdown
            value={selectedCourse}
            onChange={setSelectedCourse}
            isDark={isDark}
            className="min-w-[180px]"
            options={[
              { value: 'all', label: 'All courses' },
              ...courses.map((course) => ({ value: course, label: course })),
            ]}
          />
        </div>

        <motion.div variants={dashboardStagger} className="mt-4 flex gap-3 overflow-x-auto pb-2">
          <motion.div
            variants={dashboardItem}
            className={`academy-card min-w-[170px] p-3 ${isDark ? 'academy-card-dark' : 'academy-card-light'}`}
          >
            <p className="text-xs uppercase tracking-wide">Tasks</p>
            <p className="mt-1 text-xl font-bold">{courseSummary.tasksCount}</p>
          </motion.div>
          <motion.div
            variants={dashboardItem}
            className={`academy-card min-w-[170px] p-3 ${isDark ? 'academy-card-dark' : 'academy-card-light'}`}
          >
            <p className="text-xs uppercase tracking-wide">Exams</p>
            <p className="mt-1 text-xl font-bold">{courseSummary.examsCount}</p>
          </motion.div>
          <motion.div
            variants={dashboardItem}
            className={`academy-card min-w-[170px] p-3 ${isDark ? 'academy-card-dark' : 'academy-card-light'}`}
          >
            <p className="text-xs uppercase tracking-wide">Projects</p>
            <p className="mt-1 text-xl font-bold">{courseSummary.projectsCount}</p>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.section>
  )
}

export default HomePage
