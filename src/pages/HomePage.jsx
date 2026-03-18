import { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTheme } from '../context/ThemeContext'
import useFetch from '../hooks/useFetch'
import { API_BASE_URL } from '../config/api'
import Breadcrumbs from '../components/Breadcrumbs'
import CustomDropdown from '../components/CustomDropdown'
import AcademyCalendarModal from '../components/AcademyCalendarModal'
import { setSelectedCategory } from '../store/dashboardSlice'
import { getAlertClass } from '../styles/alertStyles'

const dashboardCards = [
  { id: 'tasks', label: 'Tasks', path: '/tasks' },
  { id: 'exams', label: 'Exams', path: '/exams' },
  { id: 'projects', label: 'Projects', path: '/projects' },
  { id: 'other', label: 'Other', path: '/other' },
]
const bookmarkIcon = '/images/bookmark.png'
const timeTurnerIcon = '/images/Time-Turner.png'

const getExamDateTime = (exam) => {
  const datePart = new Date(exam.date).toISOString().slice(0, 10)
  const startTime = String(exam.time || '00:00').split('-')[0].trim()
  return new Date(`${datePart}T${startTime || '00:00'}`)
}

const normalizeDate = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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
  const MotionSection = motion.section
  const MotionDiv = motion.div
  const MotionButton = motion.button
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.user)
  const userId = user?.id || ''
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [pageRenderSeed] = useState(() => Date.now())
  const [selectedCourse, setSelectedCourse] = useState('all')
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(() => new Date())
  const [calendarTypeFilter, setCalendarTypeFilter] = useState({
    tasks: true,
    exams: true,
    projects: true,
    others: true,
  })

  const tasksQuery = `${API_BASE_URL}/api/tasks?userId=${encodeURIComponent(userId)}&category=tasks`
  const examsQuery = `${API_BASE_URL}/api/exams?userId=${encodeURIComponent(userId)}`
  const projectsQuery = `${API_BASE_URL}/api/projects?userId=${encodeURIComponent(userId)}`
  const othersQuery = `${API_BASE_URL}/api/others?userId=${encodeURIComponent(userId)}`

  const { data: tasksData, error: tasksError } = useFetch(tasksQuery)
  const { data: examsData, error: examsError } = useFetch(examsQuery)
  const { data: projectsData, error: projectsError } = useFetch(projectsQuery)
  const { data: othersData, error: othersError } = useFetch(othersQuery)

  const tasks = useMemo(() => (Array.isArray(tasksData) ? tasksData : []), [tasksData])
  const exams = useMemo(() => (Array.isArray(examsData) ? examsData : []), [examsData])
  const projects = useMemo(() => (Array.isArray(projectsData) ? projectsData : []), [projectsData])
  const others = useMemo(() => (Array.isArray(othersData) ? othersData : []), [othersData])
  const allTasks = useMemo(() => {
    return userId ? tasks.filter((task) => String(task.userId || '') === String(userId)) : []
  }, [tasks, userId])
  const allExams = useMemo(() => (Array.isArray(exams) ? exams : []), [exams])
  const allProjects = useMemo(() => (Array.isArray(projects) ? projects : []), [projects])
  const allOthers = useMemo(
    () => (userId ? others.filter((item) => String(item.userId || '') === String(userId)) : []),
    [others, userId],
  )
  const selectedCalendarDateIso = normalizeDate(selectedCalendarDay)
  const calendarEventsByDate = useMemo(() => {
    const eventsByDate = {}
    const ensureBucket = (dateKey) => {
      if (!dateKey) {
        return null
      }
      if (!eventsByDate[dateKey]) {
        eventsByDate[dateKey] = {
          tasks: [],
          exams: [],
          projects: [],
          others: [],
        }
      }
      return eventsByDate[dateKey]
    }

    allTasks.forEach((task) => {
      const dateKey = normalizeDate(task.dueDate)
      const bucket = ensureBucket(dateKey)
      if (bucket) {
        bucket.tasks.push(task)
      }
    })

    allExams.forEach((exam) => {
      const dateKey = normalizeDate(exam.date)
      const bucket = ensureBucket(dateKey)
      if (bucket) {
        bucket.exams.push(exam)
      }
    })

    allProjects.forEach((project) => {
      const dateKey = normalizeDate(project.deadline)
      const bucket = ensureBucket(dateKey)
      if (bucket) {
        bucket.projects.push(project)
      }
    })

    allOthers.forEach((item) => {
      const dateKey = normalizeDate(item.deadline)
      const bucket = ensureBucket(dateKey)
      if (bucket) {
        bucket.others.push(item)
      }
    })

    return eventsByDate
  }, [allTasks, allExams, allProjects, allOthers])

  const filteredCalendarEventsByDate = useMemo(() => {
    const next = {}
    Object.entries(calendarEventsByDate).forEach(([dateKey, dayEvents]) => {
      next[dateKey] = {
        tasks: calendarTypeFilter.tasks ? dayEvents.tasks : [],
        exams: calendarTypeFilter.exams ? dayEvents.exams : [],
        projects: calendarTypeFilter.projects ? dayEvents.projects : [],
        others: calendarTypeFilter.others ? dayEvents.others : [],
      }
    })
    return next
  }, [calendarEventsByDate, calendarTypeFilter])

  const selectedCalendarEvents = filteredCalendarEventsByDate[selectedCalendarDateIso] || {
    tasks: [],
    exams: [],
    projects: [],
    others: [],
  }

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
    const now = pageRenderSeed
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
  }, [allExams, pageRenderSeed])

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
    const weekSeed = Math.floor(pageRenderSeed / (1000 * 60 * 60 * 24 * 7))
    return headings[weekSeed % headings.length]
  }, [pageRenderSeed])

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
  const toggleCalendarType = (type) => {
    setCalendarTypeFilter((prev) => ({ ...prev, [type]: !prev[type] }))
  }
  const resetCalendarFilters = () => {
    setCalendarTypeFilter({
      tasks: true,
      exams: true,
      projects: true,
      others: true,
    })
  }

  const anyError = tasksError || examsError || projectsError || othersError
  const openCalendarCardClass = isDark
    ? 'border-[#a68467]/55 bg-[#4a372b]/55 text-[#f6e9d5] shadow-none'
    : 'border-[#c2a485]/70 bg-[#f6ecdf]/65 text-[#5a3f2f] shadow-none'

  return (
    <MotionSection
      variants={dashboardStagger}
      initial="hidden"
      animate="show"
      className={`bg-transparent p-6 transition-colors duration-300 ${
        isDark
          ? 'text-[#f6ede6]'
          : 'text-[#2f2118]'
      }`}
    >
      <div>
      <Breadcrumbs isDark={isDark} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className={`text-3xl font-bold ${isDark ? 'text-[#f9ede1]' : 'text-[#2f2118]'}`}>
            Hybrid Dashboard
          </h2>
          <p className={`mt-1 text-sm ${isDark ? 'text-[#f0dfd0]' : 'text-[#4a382c]'}`}>
            Smart overview of your academic timeline.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCalendarModal(true)}
          className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition ${
            isDark
              ? 'border-[#a68467]/55 bg-[#4a372b]/55 text-[#f6e9d5] hover:bg-[#5a4335]/70'
              : 'border-[#c2a485]/70 bg-[#f6ecdf]/65 text-[#5a3f2f] hover:bg-[#efe2d2]/80'
          }`}
        >
          <img
            src={timeTurnerIcon}
            alt=""
            aria-hidden="true"
            className="h-5 w-5 object-contain opacity-90"
            onError={(event) => {
              event.currentTarget.style.display = 'none'
            }}
          />
          Open Calendar
        </button>
      </div>

      {anyError ? <div className={getAlertClass('error', isDark)}>{anyError}</div> : null}

      <MotionDiv
        variants={dashboardItem}
        className={`academy-card mt-6 p-6 text-center ${openCalendarCardClass}`}
      >
        <h3
          className="text-2xl font-bold tracking-wide"
          style={
            isDark
              ? {
                  color: '#E2BE57',
                  textShadow: '0 0 12px rgba(226, 190, 87, 0.35), 0 1px 1px rgba(20, 12, 6, 0.65)',
                }
              : {
                  color: '#9A6A10',
                  textShadow: '0 1px 0 rgba(255, 246, 225, 0.9), 0 0 10px rgba(212, 175, 55, 0.28)',
                }
          }
        >
          {magicalHeadline}
        </h3>

        <div
          className={`mx-auto mt-3 h-[2px] w-44 bg-gradient-to-r from-transparent to-transparent ${
            isDark ? 'via-[#e2be57]' : 'via-[#9a6a10]'
          }`}
          style={{
            boxShadow: isDark
              ? '0 0 8px rgba(226, 190, 87, 0.35)'
              : '0 0 6px rgba(154, 106, 16, 0.3)',
          }}
        />

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
      </MotionDiv>

      <AcademyCalendarModal
        isOpen={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        isDark={isDark}
        selectedDay={selectedCalendarDay}
        onDayChange={setSelectedCalendarDay}
        normalizeDate={normalizeDate}
        filteredEventsByDate={filteredCalendarEventsByDate}
        selectedEvents={selectedCalendarEvents}
        calendarTypeFilter={calendarTypeFilter}
        onToggleType={toggleCalendarType}
        onResetFilters={resetCalendarFilters}
      />

      <MotionDiv
        variants={dashboardItem}
        className={`academy-card mx-auto mt-6 w-full max-w-6xl p-4 ${openCalendarCardClass}`}
      >
        <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
          <div className="hidden sm:block" />
          <h3 className="text-center text-lg font-semibold">Browse by Course</h3>
          <div className="justify-self-center sm:justify-self-end">
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
        </div>

        <MotionDiv variants={dashboardStagger} className="mt-4 flex justify-center gap-3 overflow-x-auto pb-2">
          <MotionDiv
            variants={dashboardItem}
            className={`academy-card min-w-[170px] p-3 ${openCalendarCardClass}`}
          >
            <p className="text-center text-xs uppercase tracking-wide">Tasks</p>
            <p className="mt-1 text-center text-xl font-bold">{courseSummary.tasksCount}</p>
          </MotionDiv>
          <MotionDiv
            variants={dashboardItem}
            className={`academy-card min-w-[170px] p-3 ${openCalendarCardClass}`}
          >
            <p className="text-center text-xs uppercase tracking-wide">Exams</p>
            <p className="mt-1 text-center text-xl font-bold">{courseSummary.examsCount}</p>
          </MotionDiv>
          <MotionDiv
            variants={dashboardItem}
            className={`academy-card min-w-[170px] p-3 ${openCalendarCardClass}`}
          >
            <p className="text-center text-xs uppercase tracking-wide">Projects</p>
            <p className="mt-1 text-center text-xl font-bold">{courseSummary.projectsCount}</p>
          </MotionDiv>
        </MotionDiv>
      </MotionDiv>

      <MotionDiv variants={dashboardItem} className="mx-auto mt-6 grid w-full max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {dashboardCards.map((card) => (
          <MotionButton
            variants={dashboardItem}
            key={card.id}
            type="button"
            onClick={() => handleOpenCategory(card.id, card.path)}
            className={`academy-card relative overflow-hidden p-6 text-center ${openCalendarCardClass}`}
          >
            <img
              src={bookmarkIcon}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute right-3 top-0 h-10 w-auto"
            />
            <h3 className="text-lg font-semibold">{card.label}</h3>
          </MotionButton>
        ))}
      </MotionDiv>
      </div>
    </MotionSection>
  )
}

export default HomePage
