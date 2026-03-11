function TaskCard({ title, courseName, dueDate }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-700">
        <span className="font-medium">Course:</span> {courseName}
      </p>
      <p className="mt-1 text-sm text-slate-700">
        <span className="font-medium">Due date:</span> {dueDate}
      </p>
    </article>
  )
}

export default TaskCard
