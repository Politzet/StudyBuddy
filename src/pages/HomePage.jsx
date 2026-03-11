import { useState } from 'react'
import TaskCard from '../components/TaskCard'

function HomePage() {
  const [tasks] = useState([
    {
      id: 1,
      title: 'HW1 - React basics',
      courseName: 'מבוא לתכנות',
      dueDate: '2026-03-15',
    },
    {
      id: 2,
      title: 'Graph algorithms summary',
      courseName: 'אלגוריתמים',
      dueDate: '2026-03-20',
    },
    {
      id: 3,
      title: 'REST API exercises',
      courseName: 'מארג שירותי אינטרנט',
      dueDate: '2026-03-18',
    },
  ])

  return (
    <section>
      <h2 className="text-2xl font-bold">My Study Tasks</h2>
      <p className="mt-2 text-slate-600">Demo tasks rendered with map().</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            title={task.title}
            courseName={task.courseName}
            dueDate={task.dueDate}
          />
        ))}
      </div>
    </section>
  )
}

export default HomePage
