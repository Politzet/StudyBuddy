import { useState } from 'react'
import {
  getTaskStatusLabel,
  TASK_STATUS_OPTIONS,
} from '../constants/taskStatus'
import CustomDropdown from './CustomDropdown'

function TaskCard({
  task,
  onDelete,
  onUpdate,
  isDark = false,
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : '',
    status: task.status || 'not_started',
  })

  const handleEditChange = (event) => {
    const { name, value } = event.target
    setEditForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    await onUpdate(task._id || task.id, {
      dueDate: editForm.dueDate,
      status: editForm.status,
    })
    setIsEditing(false)
  }

  const title = task.title
  const courseName = task.courseName || task.course
  const dueDate = task.dueDate
  const parsedDate = new Date(dueDate)
  const formattedDueDate = Number.isNaN(parsedDate.getTime())
    ? dueDate
    : parsedDate.toLocaleString()

  return (
    <article
      className={`academy-card p-5 ${
        isDark ? 'academy-card-dark border-[#d1bfa7] text-[#f1e4cc]' : 'academy-card-light border-[#d1bfa7] text-[#2a3748]'
      }`}
    >
      <h3 className={`text-lg font-semibold ${isDark ? 'text-[#fff4ea]' : 'text-[#453434]'}`}>
        {title}
      </h3>
      <p className={`mt-2 text-sm ${isDark ? 'text-[#eadccf]' : 'text-[#6b5447]'}`}>
        <span className="font-medium">Course:</span> {courseName}
      </p>
      <p className={`mt-1 text-sm ${isDark ? 'text-[#eadccf]' : 'text-[#6b5447]'}`}>
        <span className="font-medium">Due date:</span> {formattedDueDate}
      </p>
      <p className={`mt-1 text-sm ${isDark ? 'text-[#eadccf]' : 'text-[#6b5447]'}`}>
        <span className="font-medium">Status:</span> {getTaskStatusLabel(task.status)}
      </p>

      {isEditing ? (
        <div className="mt-4 space-y-3">
          <div>
            <label
              className={`mb-1 block text-sm font-medium ${
                isDark ? 'text-[#eadccf]' : 'text-[#6b5447]'
              }`}
            >
              תאריך ושעת הגשה
            </label>
            <input
              type="datetime-local"
              name="dueDate"
              value={editForm.dueDate}
              onChange={handleEditChange}
              className={`w-full rounded-md border px-3 py-2 text-sm ${
                isDark
                  ? 'border-[#6a5448] bg-[#2d221d] text-[#f6ede6]'
                  : 'border-[#d2c0b1] bg-[#fffaf6] text-[#453434]'
              }`}
            />
          </div>
          <div>
            <label
              className={`mb-1 block text-sm font-medium ${
                isDark ? 'text-[#eadccf]' : 'text-[#6b5447]'
              }`}
            >
              סטטוס
            </label>
            <CustomDropdown
              value={editForm.status}
              onChange={(nextStatus) =>
                setEditForm((prev) => ({ ...prev, status: nextStatus }))
              }
              isDark={isDark}
              className="w-full"
              options={TASK_STATUS_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="rounded-md bg-[#8b6b57] px-3 py-2 text-sm font-medium text-[#f1e4cc] transition hover:bg-[#785845]"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-md bg-[#6f5b50] px-3 py-2 text-sm font-medium text-[#f1e4cc] transition hover:bg-[#5d4c43]"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="rounded-md bg-[#b38763] px-3 py-2 text-sm font-medium text-[#f1e4cc] transition hover:bg-[#9a7354]"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(task._id || task.id)}
            className="rounded-md bg-[#6f3f3f] px-3 py-2 text-sm font-medium text-[#f1e4cc] transition hover:bg-[#5d3434]"
          >
            Delete
          </button>
        </div>
      )}
    </article>
  )
}

export default TaskCard
