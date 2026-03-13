import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTheme } from '../context/ThemeContext'
import useLocalStorage from '../hooks/useLocalStorage'
import useFetch from '../hooks/useFetch'
import { setLastTaskAdded } from '../store/userSlice'
import { API_BASE_URL } from '../config/api'
import { getAlertClass } from '../styles/alertStyles'

const initialForm = {
  taskName: '',
  course: '',
  difficulty: 1,
  dueDate: '',
}

function AddTaskPage() {
  const dispatch = useDispatch()
  const { user, isLoggedIn, lastTaskAdded } = useSelector((state) => state.user)
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [formData, setFormData] = useLocalStorage('add-task-form', initialForm)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [courseNameInput, setCourseNameInput] = useState('')
  const [editingCourseId, setEditingCourseId] = useState('')
  const [editingCourseName, setEditingCourseName] = useState('')
  const [courseActionError, setCourseActionError] = useState('')
  const [coursesRefreshKey, setCoursesRefreshKey] = useState(0)

  const {
    data: coursesData,
    loading: coursesLoading,
    error: coursesError,
    refetch: refetchCourses,
  } = useFetch(`${API_BASE_URL}/api/courses?refresh=${coursesRefreshKey}`)
  const courses = Array.isArray(coursesData) ? coursesData : []

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'difficulty' ? Number(value) : value,
    }))
  }

  const validateForm = () => {
    const validationErrors = {}

    if (formData.taskName.trim().length < 3) {
      validationErrors.taskName = 'Task title must be at least 3 characters'
    }

    if (!formData.course) {
      validationErrors.course = 'יש לבחור קורס'
    }

    if (formData.difficulty < 1 || formData.difficulty > 5) {
      validationErrors.difficulty = 'רמת קושי חייבת להיות בין 1 ל-5'
    }

    if (!formData.dueDate) {
      validationErrors.dueDate = 'יש לבחור תאריך ושעת הגשה'
    }

    return validationErrors
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const validationErrors = validateForm()
    setErrors(validationErrors)
    setSubmitError('')
    setSubmitSuccess('')

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    const newTask = {
      userId: user?.id || '',
      title: formData.taskName.trim(),
      course: formData.course,
      difficulty: formData.difficulty,
      dueDate: formData.dueDate,
      category: 'tasks',
    }

    try {
      setIsSubmitting(true)
      const response = await fetch(`${API_BASE_URL}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTask),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}))
        const message =
          errorBody.message ||
          (Array.isArray(errorBody.details) ? errorBody.details.join(', ') : '') ||
          'Failed to save task'
        throw new Error(message)
      }

      dispatch(setLastTaskAdded(formData.taskName.trim()))
      setFormData(initialForm)
      setErrors({})
      setSubmitSuccess('Task added successfully.')
    } catch (error) {
      setSubmitError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const triggerCoursesRefresh = () => {
    refetchCourses()
    setCoursesRefreshKey((prev) => prev + 1)
  }

  const handleAddCourse = async (event) => {
    event.preventDefault()
    const trimmedName = courseNameInput.trim()
    if (!trimmedName) {
      return
    }

    setCourseActionError('')
    try {
      const response = await fetch(`${API_BASE_URL}/api/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName }),
      })
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}))
        throw new Error(errorBody.message || 'Failed to add course')
      }
      setCourseNameInput('')
      triggerCoursesRefresh()
    } catch (error) {
      setCourseActionError(error.message)
    }
  }

  const startEditCourse = (course) => {
    setEditingCourseId(course._id)
    setEditingCourseName(course.name)
  }

  const handleUpdateCourse = async () => {
    const trimmedName = editingCourseName.trim()
    if (!trimmedName) {
      return
    }

    setCourseActionError('')
    try {
      const response = await fetch(`${API_BASE_URL}/api/courses/${editingCourseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName }),
      })
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}))
        throw new Error(errorBody.message || 'Failed to update course')
      }
      setEditingCourseId('')
      setEditingCourseName('')
      triggerCoursesRefresh()
    } catch (error) {
      setCourseActionError(error.message)
    }
  }

  const handleDeleteCourse = async (courseId) => {
    const shouldDelete = window.confirm('Are you sure you want to delete?')
    if (!shouldDelete) {
      return
    }

    setCourseActionError('')
    try {
      const response = await fetch(`${API_BASE_URL}/api/courses/${courseId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}))
        throw new Error(errorBody.message || 'Failed to delete course')
      }
      triggerCoursesRefresh()
    } catch (error) {
      setCourseActionError(error.message)
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
      <h2 className="text-2xl font-bold">Add New Task</h2>
      <p className={`mt-2 ${isDark ? 'text-[#eadccf]' : 'text-[#6b5447]'}`}>
        Fill in the details to add your next study task.
      </p>
      <p className={`mt-2 text-sm ${isDark ? 'text-[#eadccf]' : 'text-[#6b5447]'}`}>
        {isLoggedIn
          ? `Last task added: ${lastTaskAdded || 'No task added yet'}`
          : 'Log in to track the last task you added.'}
      </p>
      {submitError ? (
        <div className={getAlertClass('error', isDark)}>{submitError}</div>
      ) : null}
      {submitSuccess ? (
        <div className={getAlertClass('success', isDark)}>{submitSuccess}</div>
      ) : null}

      <div
        className={`mt-6 max-w-xl rounded-xl border p-4 ${
          isDark
            ? 'border-[#5a463b] bg-[#1f1612]/80 text-[#f6ede6]'
            : 'border-[#d9c7b8] bg-[#fffaf4]/85 text-[#453434]'
        }`}
      >
        <h3 className="text-lg font-semibold">ניהול קורסים</h3>
        {courseActionError ? (
          <div className={getAlertClass('error', isDark)}>{courseActionError}</div>
        ) : null}
        {coursesError ? (
          <div className={getAlertClass('error', isDark)}>{coursesError}</div>
        ) : null}
        <form onSubmit={handleAddCourse} className="mt-3 flex gap-2">
          <input
            type="text"
            value={courseNameInput}
            onChange={(event) => setCourseNameInput(event.target.value)}
            placeholder="שם קורס חדש"
            className={`w-full rounded-md border px-3 py-2 focus:outline-none ${
              isDark
                ? 'border-[#6a5448] bg-[#2d221d] text-[#f6ede6] focus:border-[#8b6b57]'
                : 'border-[#d2c0b1] bg-[#fffaf6] text-[#453434] focus:border-[#8b6b57]'
            }`}
          />
          <button
            type="submit"
            className="rounded-md bg-[#8b6b57] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#785845]"
          >
            הוסף
          </button>
        </form>

        {coursesLoading ? <p className="mt-3 text-sm">Loading courses...</p> : null}
        {!coursesLoading && courses.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {courses.map((course) => (
              <li
                key={course._id}
                className={`rounded-md border px-3 py-2 ${
                  isDark
                    ? 'border-[#5f4a3f] bg-[#2f241f]/90'
                    : 'border-[#d9c7b8] bg-[#fffaf4]/95'
                }`}
              >
                {editingCourseId === course._id ? (
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="text"
                      value={editingCourseName}
                      onChange={(event) => setEditingCourseName(event.target.value)}
                      className={`flex-1 rounded-md border px-2 py-1 ${
                        isDark
                          ? 'border-[#6a5448] bg-[#2d221d] text-[#f6ede6]'
                          : 'border-[#d2c0b1] bg-[#fffaf6] text-[#453434]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={handleUpdateCourse}
                      className="rounded-md bg-[#8b6b57] px-2 py-1 text-xs font-medium text-white"
                    >
                      שמור
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCourseId('')
                        setEditingCourseName('')
                      }}
                      className="rounded-md bg-[#6f5b50] px-2 py-1 text-xs font-medium text-white"
                    >
                      בטל
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <span>{course.name}</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEditCourse(course)}
                        className="rounded-md bg-[#b38763] px-2 py-1 text-xs font-medium text-white"
                      >
                        ערוך
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCourse(course._id)}
                        className="rounded-md bg-[#6f3f3f] px-2 py-1 text-xs font-medium text-white"
                      >
                        מחק
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <form
        onSubmit={handleSubmit}
        className={`mt-6 max-w-xl rounded-xl border p-6 shadow-sm ${
          isDark
            ? 'border-[#5a463b] bg-[#1f1612]/80 text-[#f6ede6]'
            : 'border-[#d9c7b8] bg-[#fffaf4]/95 text-[#453434]'
        }`}
      >
        <div>
          <label htmlFor="taskName" className="mb-1 block text-sm font-medium">
            שם המטלה
          </label>
          <input
            id="taskName"
            name="taskName"
            type="text"
            value={formData.taskName}
            onChange={handleChange}
            className={`w-full rounded-md border px-3 py-2 focus:outline-none ${
              isDark
                ? 'border-[#6a5448] bg-[#2d221d] text-[#f6ede6] focus:border-[#8b6b57]'
                : 'border-[#d2c0b1] bg-[#fffaf6] text-[#453434] focus:border-[#8b6b57]'
            }`}
            placeholder="לדוגמה: סיכום פרק 3"
          />
          {errors.taskName ? (
            <p className="mt-1 text-sm text-red-600">{errors.taskName}</p>
          ) : null}
        </div>

        <div className="mt-4">
          <label htmlFor="course" className="mb-1 block text-sm font-medium">
            קורס
          </label>
          <select
            id="course"
            name="course"
            value={formData.course}
            onChange={handleChange}
            className={`w-full rounded-md border px-3 py-2 focus:outline-none ${
              isDark
                ? 'border-[#6a5448] bg-[#2d221d] text-[#f6ede6] focus:border-[#8b6b57]'
                : 'border-[#d2c0b1] bg-[#fffaf6] text-[#453434] focus:border-[#8b6b57]'
            }`}
          >
            <option value="">Please select</option>
            {courses.map((course) => (
              <option key={course._id} value={course.name}>
                {course.name}
              </option>
            ))}
          </select>
          {errors.course ? (
            <p className="mt-1 text-sm text-red-600">{errors.course}</p>
          ) : null}
        </div>

        <div className="mt-4">
          <label htmlFor="difficulty" className="mb-1 block text-sm font-medium">
            רמת קושי (1-5)
          </label>
          <input
            id="difficulty"
            name="difficulty"
            type="number"
            min="1"
            max="5"
            value={formData.difficulty}
            onChange={handleChange}
            className={`w-full rounded-md border px-3 py-2 focus:outline-none ${
              isDark
                ? 'border-[#6a5448] bg-[#2d221d] text-[#f6ede6] focus:border-[#8b6b57]'
                : 'border-[#d2c0b1] bg-[#fffaf6] text-[#453434] focus:border-[#8b6b57]'
            }`}
          />
          {errors.difficulty ? (
            <p className="mt-1 text-sm text-red-600">{errors.difficulty}</p>
          ) : null}
        </div>

        <div className="mt-4">
          <label htmlFor="dueDate" className="mb-1 block text-sm font-medium">
            תאריך ושעת הגשה
          </label>
          <input
            id="dueDate"
            name="dueDate"
            type="datetime-local"
            value={formData.dueDate || ''}
            onChange={handleChange}
            className={`w-full rounded-md border px-3 py-2 focus:outline-none ${
              isDark
                ? 'border-[#6a5448] bg-[#2d221d] text-[#f6ede6] focus:border-[#8b6b57]'
                : 'border-[#d2c0b1] bg-[#fffaf6] text-[#453434] focus:border-[#8b6b57]'
            }`}
          />
          {errors.dueDate ? (
            <p className="mt-1 text-sm text-red-600">{errors.dueDate}</p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 rounded-md bg-[#8b6b57] px-4 py-2 font-medium text-white transition hover:bg-[#785845]"
        >
          {isSubmitting ? 'Saving...' : 'Submit'}
        </button>
      </form>
    </section>
  )
}

export default AddTaskPage
