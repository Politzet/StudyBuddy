import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import useLocalStorage from '../hooks/useLocalStorage'

const initialForm = {
  taskName: '',
  course: '',
  difficulty: 1,
}

function AddTaskPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [formData, setFormData] = useLocalStorage('add-task-form', initialForm)
  const [errors, setErrors] = useState({})

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

    return validationErrors
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const validationErrors = validateForm()
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    console.log('Submitted task:', formData)
    setFormData(initialForm)
  }

  return (
    <section
      className={`rounded-xl p-6 ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'}`}
    >
      <h2 className="text-2xl font-bold">Add New Task</h2>
      <p className={`mt-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
        Fill the form and submit to log task data.
      </p>

      <form
        onSubmit={handleSubmit}
        className={`mt-6 max-w-xl rounded-xl border p-6 shadow-sm ${
          isDark
            ? 'border-slate-700 bg-slate-900 text-white'
            : 'border-slate-200 bg-white text-slate-900'
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
            className={`w-full rounded-md border px-3 py-2 focus:border-blue-500 focus:outline-none ${
              isDark
                ? 'border-slate-600 bg-slate-800 text-white'
                : 'border-slate-300 bg-white text-slate-900'
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
            className={`w-full rounded-md border px-3 py-2 focus:border-blue-500 focus:outline-none ${
              isDark
                ? 'border-slate-600 bg-slate-800 text-white'
                : 'border-slate-300 bg-white text-slate-900'
            }`}
          >
            <option value="">בחרי קורס</option>
            <option value="מבוא לתכנות">מבוא לתכנות</option>
            <option value="אלגוריתמים">אלגוריתמים</option>
            <option value="מארג שירותי אינטרנט">מארג שירותי אינטרנט</option>
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
            className={`w-full rounded-md border px-3 py-2 focus:border-blue-500 focus:outline-none ${
              isDark
                ? 'border-slate-600 bg-slate-800 text-white'
                : 'border-slate-300 bg-white text-slate-900'
            }`}
          />
          {errors.difficulty ? (
            <p className="mt-1 text-sm text-red-600">{errors.difficulty}</p>
          ) : null}
        </div>

        <button
          type="submit"
          className="mt-6 rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700"
        >
          Submit
        </button>
      </form>
    </section>
  )
}

export default AddTaskPage
