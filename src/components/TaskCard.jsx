import { useState } from 'react'
import {
  getTaskStatusLabel,
  TASK_STATUS_OPTIONS,
} from '../constants/taskStatus'

function TaskCard({
  task,
  onDelete,
  onUpdate,
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
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-lg">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-700">
        <span className="font-medium">Course:</span> {courseName}
      </p>
      <p className="mt-1 text-sm text-slate-700">
        <span className="font-medium">Due date:</span> {formattedDueDate}
      </p>
      <p className="mt-1 text-sm text-slate-700">
        <span className="font-medium">Status:</span> {getTaskStatusLabel(task.status)}
      </p>

      {isEditing ? (
        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              תאריך ושעת הגשה
            </label>
            <input
              type="datetime-local"
              name="dueDate"
              value={editForm.dueDate}
              onChange={handleEditChange}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">סטטוס</label>
            <select
              name="status"
              value={editForm.status}
              onChange={handleEditChange}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              {TASK_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-md bg-slate-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-600"
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
            className="rounded-md bg-amber-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-amber-600"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(task._id || task.id)}
            className="rounded-md bg-rose-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-rose-700"
          >
            Delete
          </button>
        </div>
      )}
    </article>
  )
}

export default TaskCard
