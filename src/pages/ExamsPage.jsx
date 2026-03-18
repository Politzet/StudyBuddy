import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
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
  course: '',
  date: '',
  time: '',
  studyDays: 1,
  building: '',
  room: '',
}

function ExamsPage() {
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
  const [courseFilter, setCourseFilter] = useState('all')
  const [sparkleExamId, setSparkleExamId] = useState('')
  const [showExamModal, setShowExamModal] = useState(false)
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

  const validateStudyDays = (dateValue, studyDaysValue) => {
    const examDate = new Date(dateValue)
    if (Number.isNaN(examDate.getTime())) {
      return 'Please select a valid exam date.'
    }

    const examDayEnd = new Date(examDate)
    examDayEnd.setHours(23, 59, 59, 999)

    const now = new Date()
    const msPerDay = 1000 * 60 * 60 * 24
    const daysLeft = Math.ceil((examDayEnd.getTime() - now.getTime()) / msPerDay)

    if (daysLeft <= 0) {
      return 'Exam date must be in the future.'
    }

    const normalizedStudyDays = Number(studyDaysValue) || 1
    if (normalizedStudyDays > daysLeft) {
      return `You entered ${normalizedStudyDays} study days, but only ${daysLeft} day(s) are left until the exam date.`
    }

    return ''
  }

  useEffect(() => {
    dispatch(setSelectedCategory('exams'))
  }, [dispatch])

  const { data, loading, error, refetch } = useFetch(
    `${API_BASE_URL}/api/exams?userId=${encodeURIComponent(userId)}&r=${refreshKey}`,
  )
  const {
    data: coursesData,
    error: coursesError,
    refetch: refetchCourses,
  } = useFetch(`${API_BASE_URL}/api/courses?r=${coursesRefreshKey}`)
  const { data: moodleData } = useFetch(`${API_BASE_URL}/api/moodle/sync`)

  const exams = useMemo(() => (Array.isArray(data) ? data : []), [data])
  const moodleExams = useMemo(
    () => (Array.isArray(moodleData?.exams) ? moodleData.exams : []),
    [moodleData],
  )
  const availableCourses = useMemo(
    () => (Array.isArray(coursesData) ? coursesData.map((course) => course.name).filter(Boolean).sort() : []),
    [coursesData],
  )
  const allExams = useMemo(() => {
    const imported = exams.map((exam) => ({
      ...exam,
      id: exam._id,
      source: 'db',
    }))
    const mocked = moodleExams.map((exam) => ({
      ...exam,
      id: exam.id,
      source: 'moodle',
    }))
    return [...imported, ...mocked]
  }, [exams, moodleExams])
  const courses = useMemo(
    () => Array.from(new Set(allExams.map((exam) => exam.course).filter(Boolean))).sort(),
    [allExams],
  )
  const normalizedCourseFilter =
    courseFilter === 'all' || courses.includes(courseFilter) ? courseFilter : 'all'
  const visibleExams = useMemo(() => {
    const base =
      normalizedCourseFilter === 'all'
        ? allExams
        : allExams.filter((exam) => exam.course === normalizedCourseFilter)
    return [...base].sort((a, b) => new Date(a.date) - new Date(b.date))
  }, [allExams, normalizedCourseFilter])
  const groupedExams = useMemo(() => {
    return visibleExams.reduce((acc, exam) => {
      const courseName = exam.course || 'Unassigned Course'
      if (!acc[courseName]) {
        acc[courseName] = []
      }
      acc[courseName].push(exam)
      return acc
    }, {})
  }, [visibleExams])
  const groupedCourses = useMemo(() => Object.keys(groupedExams).sort(), [groupedExams])
  const isExamModalOpen = showExamModal

  useEffect(() => {
    if (!lastCreatedItem || lastCreatedItem.category !== 'exams' || !lastCreatedItem.id) {
      return
    }
    setSparkleExamId(String(lastCreatedItem.id))
    dispatch(clearLastCreatedItem())
    const timer = setTimeout(() => setSparkleExamId(''), 1000)
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
    setShowExamModal(true)
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

  const startEdit = (exam) => {
    setErrorMessage('')
    setCourseActionError('')
    setEditingId(exam._id)
    setFormData({
      course: exam.course,
      date: new Date(exam.date).toISOString().slice(0, 10),
      time: exam.time || '',
      studyDays: Number(exam.studyDays) > 0 ? Number(exam.studyDays) : 1,
      building: exam.location?.building || '',
      room: exam.location?.room || '',
    })
    setShowExamModal(true)
    setMessage('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage('')
    setErrorMessage('')

    if (!formData.course.trim() && courseNameInput.trim()) {
      setErrorMessage('You typed a new course name. Click "Add" to create/select it first.')
      return
    }
    if (!formData.course.trim() || !formData.date || !formData.time) {
      setErrorMessage('Course, date, and time are required for exams.')
      return
    }
    if (Number(formData.studyDays) < 1) {
      setErrorMessage('Study days must be at least 1.')
      return
    }

    const studyDaysError = validateStudyDays(formData.date, formData.studyDays)
    if (studyDaysError) {
      setErrorMessage(studyDaysError)
      return
    }

    try {
      const payload = {
        userId,
        course: formData.course.trim(),
        date: formData.date,
        time: formData.time,
        studyDays: Number(formData.studyDays) || 1,
        location: {
          building: formData.building.trim(),
          room: formData.room.trim(),
        },
      }

      const response = await fetch(
        editingId ? `${API_BASE_URL}/api/exams/${editingId}` : `${API_BASE_URL}/api/exams`,
        {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      )

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.message || 'Failed to save exam')
      }

      const savedExam = await response.json().catch(() => null)
      if (!editingId) {
        const createdExamId = savedExam?._id || savedExam?.id
        if (createdExamId) {
          dispatch(
            markItemCreated({
              category: 'exams',
              id: String(createdExamId),
              createdAt: Date.now(),
            }),
          )
        }
      }

      setFormData(initialForm)
      setEditingId('')
      setShowExamModal(false)
      setMessage(editingId ? 'Exam updated successfully.' : 'Exam created successfully.')
      triggerRefresh()
    } catch (submitError) {
      setErrorMessage(submitError.message)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete?')) {
      return
    }
    setErrorMessage('')
    try {
      const response = await fetch(`${API_BASE_URL}/api/exams/${id}`, { method: 'DELETE' })
      if (!response.ok) {
        throw new Error('Failed to delete exam')
      }
      triggerRefresh()
    } catch (deleteError) {
      setErrorMessage(deleteError.message)
    }
  }

  return (
    <section className="rounded-2xl border border-transparent bg-transparent p-6 shadow-none backdrop-blur-0 transition-colors duration-300">
      <Breadcrumbs isDark={isDark} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : ''}`}>Exams</h2>
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
            Add Exam
          </button>
        </div>
      </div>

      {error ? <div className={getAlertClass('error', isDark)}>{error}</div> : null}
      {!isExamModalOpen && errorMessage ? (
        <div className={getAlertClass('error', isDark)}>{errorMessage}</div>
      ) : null}
      {message ? <div className={getAlertClass('success', isDark)}>{message}</div> : null}
      {coursesError ? <div className={getAlertClass('error', isDark)}>{coursesError}</div> : null}
      {!isExamModalOpen && courseActionError ? (
        <div className={getAlertClass('error', isDark)}>{courseActionError}</div>
      ) : null}

      {loading ? (
        <p className={`mt-6 text-sm ${isDark ? 'text-[#eadccf]' : 'text-[#6b5447]'}`}>
          Loading exams...
        </p>
      ) : null}

      {!loading && !error && visibleExams.length === 0 ? (
        <p className={`mt-6 text-sm ${isDark ? 'text-[#eadccf]' : 'text-[#6b5447]'}`}>
          No exams found for this filter.
        </p>
      ) : null}

      {!loading && !error && visibleExams.length > 0 ? (
        <div className="mt-6 space-y-4">
          {groupedCourses.map((courseName) => (
            <div
              key={courseName}
              className={`academy-card border p-4 ${courseCardClass}`}
            >
              <h3 className={`mb-3 text-sm font-semibold ${isDark ? 'text-white' : ''}`}>{courseName}</h3>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {groupedExams[courseName].map((exam) => (
                  <li
                    key={exam.id}
                    className={`academy-card relative overflow-visible border p-4 ${itemCardClass}`}
                  >
                    {sparkleExamId === String(exam.id) && exam.source === 'db' ? (
                      <CreationSparkle />
                    ) : null}
                    <p className={`font-semibold ${isDark ? 'text-white' : ''}`}>
                      {new Date(exam.date).toLocaleDateString()}
                    </p>
                    <p className="text-sm">Time: {exam.time}</p>
                    <p className="text-sm">
                      Study days: {Number(exam.studyDays) > 0 ? exam.studyDays : 1}
                    </p>
                    <p className="text-sm">
                      Location: {exam.location?.building || '—'} / {exam.location?.room || '—'}
                    </p>
                    {exam.source === 'db' ? (
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(exam)}
                          className="rounded-md bg-[#b38763] px-3 py-1.5 text-xs font-medium text-white"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(exam._id)}
                          className="rounded-md bg-[#6f3f3f] px-3 py-1.5 text-xs font-medium text-white"
                        >
                          Delete
                        </button>
                      </div>
                    ) : (
                      <p className="mt-3 text-xs">Source: Moodle schedule</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}

      {showExamModal ? (
        <ModalPortal>
          <div className="fixed inset-0 z-[160] flex items-start justify-center overflow-y-auto bg-black/35 p-4 backdrop-blur-sm sm:items-center sm:p-6">
            <div
              className={`my-4 w-full max-w-md rounded-xl border p-6 ${
                isDark
                  ? 'border-[#5a463b] bg-[#2d221d] text-[#f6ede6]'
                  : 'border-[#d9c7b8] bg-[#fffaf4] text-[#453434]'
              }`}
            >
              <h3 className="text-xl font-semibold">{editingId ? 'Edit Exam' : 'Add Exam'}</h3>
              {errorMessage ? <div className={getAlertClass('error', isDark)}>{errorMessage}</div> : null}
              {courseActionError ? (
                <div className={getAlertClass('error', isDark)}>{courseActionError}</div>
              ) : null}
              <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
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
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="date"
                  value={formData.date}
                  onChange={(event) => setFormData((prev) => ({ ...prev, date: event.target.value }))}
                  className={getFormInputClass(isDark)}
                  required
                />
                <input
                  type="time"
                  value={formData.time}
                  onChange={(event) => setFormData((prev) => ({ ...prev, time: event.target.value }))}
                  className={getFormInputClass(isDark)}
                  required
                />
              </div>
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
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder="Building"
                  value={formData.building}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, building: event.target.value }))
                  }
                  className={getFormInputClass(isDark)}
                  required
                />
                <input
                  type="text"
                  placeholder="Room"
                  value={formData.room}
                  onChange={(event) => setFormData((prev) => ({ ...prev, room: event.target.value }))}
                  className={getFormInputClass(isDark)}
                  required
                />
              </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage('')
                      setCourseActionError('')
                      setShowExamModal(false)
                    }}
                    className="rounded-md bg-[#6f5b50] px-4 py-2 text-sm font-medium text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-[#8b6b57] px-4 py-2 text-sm font-medium text-white"
                  >
                    {editingId ? 'Save Changes' : 'Save Exam'}
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

export default ExamsPage
