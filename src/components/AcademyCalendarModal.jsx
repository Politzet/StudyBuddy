import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import ModalPortal from './ModalPortal'

function AcademyCalendarModal({
  isOpen,
  onClose,
  isDark,
  selectedDay,
  onDayChange,
  normalizeDate,
  filteredEventsByDate,
  selectedEvents,
  calendarTypeFilter,
  onToggleType,
  onResetFilters,
}) {
  if (!isOpen) {
    return null
  }

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[160] flex items-start justify-center overflow-y-auto bg-black/35 p-4 backdrop-blur-sm sm:items-center sm:p-6">
        <div
          className={`my-4 w-full max-w-4xl rounded-2xl border p-6 shadow-2xl ${
            isDark
              ? 'border-[#7a614e] bg-[#2d221d]/95 text-[#f6ede6]'
              : 'border-[#d9c7b8] bg-[#fffaf4]/98 text-[#453434]'
          }`}
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-2xl font-semibold">Magical Master Calendar</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-[#6f5b50] px-3 py-1.5 text-sm font-medium text-white"
            >
              Close
            </button>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            {[
              { key: 'exams', label: 'Exams', className: 'academy-legend-exam' },
              { key: 'tasks', label: 'Tasks', className: 'academy-legend-task' },
              { key: 'projects', label: 'Projects', className: 'academy-legend-project' },
              { key: 'others', label: 'Other', className: 'academy-legend-other' },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => onToggleType(item.key)}
                aria-pressed={calendarTypeFilter[item.key]}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition ${item.className} ${
                  calendarTypeFilter[item.key] ? 'opacity-100 ring-1 ring-current/35' : 'opacity-35'
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-current" />
                {item.label}
              </button>
            ))}
            <button
              type="button"
              onClick={onResetFilters}
              className={`ml-auto rounded-full px-3 py-1 text-xs font-semibold transition ${
                isDark
                  ? 'bg-[#4a382f] text-[#f3e6cf] hover:bg-[#5a463b]'
                  : 'bg-[#e9dccf] text-[#5a463b] hover:bg-[#dfd0c2]'
              }`}
            >
              Reset filters
            </button>
          </div>

          <div className="mx-auto flex w-full max-w-[980px] flex-col gap-6 lg:flex-row lg:items-start lg:justify-center lg:gap-8">
            <Calendar
              onChange={onDayChange}
              value={selectedDay}
              className={`academy-calendar academy-calendar-popup w-full lg:w-[560px] lg:flex-none ${
                isDark ? 'academy-calendar-dark' : 'academy-calendar-light'
              }`}
              tileClassName={({ date, view }) => {
                if (view !== 'month') {
                  return null
                }
                const dateKey = normalizeDate(date)
                const dayEvents = filteredEventsByDate[dateKey]
                if (!dayEvents) {
                  return null
                }
                if (dayEvents.exams.length > 0) {
                  return 'academy-calendar-has-exam'
                }
                if (dayEvents.tasks.length > 0) {
                  return 'academy-calendar-has-task'
                }
                if (dayEvents.projects.length > 0) {
                  return 'academy-calendar-has-project'
                }
                if (dayEvents.others.length > 0) {
                  return 'academy-calendar-has-other'
                }
                return null
              }}
              tileContent={({ date, view }) => {
                if (view !== 'month') {
                  return null
                }
                const dateKey = normalizeDate(date)
                const dayEvents = filteredEventsByDate[dateKey]
                if (!dayEvents) {
                  return null
                }
                return (
                  <span className="academy-calendar-event-dots">
                    {dayEvents.exams.length > 0 ? <span className="academy-calendar-exam-dot" /> : null}
                    {dayEvents.tasks.length > 0 ? <span className="academy-calendar-task-dot" /> : null}
                    {dayEvents.projects.length > 0 ? <span className="academy-calendar-project-dot" /> : null}
                    {dayEvents.others.length > 0 ? <span className="academy-calendar-other-dot" /> : null}
                  </span>
                )
              }}
            />

            <div
              className={`max-h-[540px] w-full overflow-y-auto rounded-xl border p-4 lg:w-[340px] lg:flex-none ${
                isDark
                  ? 'border-[#6a5448] bg-[#251c17]/75'
                  : 'border-[#d7c5b7] bg-[#fff7ef]/90'
              }`}
            >
              <h4 className="text-base font-semibold">Agenda for {selectedDay.toLocaleDateString()}</h4>

              {selectedEvents.exams.length === 0 &&
              selectedEvents.tasks.length === 0 &&
              selectedEvents.projects.length === 0 &&
              selectedEvents.others.length === 0 ? (
                <p className={`mt-2 text-sm ${isDark ? 'text-[#eadccf]' : 'text-[#6b5447]'}`}>
                  {Object.values(calendarTypeFilter).some(Boolean)
                    ? 'No items on this date.'
                    : 'All types are hidden. Enable at least one filter to view events.'}
                </p>
              ) : null}

              {selectedEvents.exams.length > 0 ? (
                <div className="mt-3">
                  <p className="text-sm font-bold text-[#d4af37]">Exams</p>
                  <ul className="mt-1 space-y-2">
                    {selectedEvents.exams.map((exam) => (
                      <li
                        key={exam._id || exam.id || `${exam.course}-${exam.date}-${exam.time}`}
                        className={`rounded-md border p-3 ${
                          isDark
                            ? 'border-[#8c6a45] bg-[#3b2a1e]/80'
                            : 'border-[#d3a163] bg-[#f8ead6]/90'
                        }`}
                      >
                        <p className="font-semibold">{exam.course}</p>
                        <p className="text-sm">Time: {exam.time}</p>
                        <p className="text-sm">
                          Study days: {Number(exam.studyDays) > 0 ? exam.studyDays : 1}
                        </p>
                        <p className="text-sm">
                          Location: {exam.location?.building || '—'} / {exam.location?.room || '—'}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {selectedEvents.tasks.length > 0 ? (
                <div className="mt-3">
                  <p className="text-sm font-semibold text-[#7f5a3a]">Tasks</p>
                  <ul className="mt-1 space-y-1 text-sm">
                    {selectedEvents.tasks.map((task) => (
                      <li key={task._id || `${task.course}-${task.title}-${task.dueDate}`}>
                        {task.course}: {task.title} (Study days:{' '}
                        {Number(task.studyDays) > 0 ? task.studyDays : 1})
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {selectedEvents.projects.length > 0 ? (
                <div className="mt-3">
                  <p className="text-sm font-semibold text-[#5d7a58]">Projects</p>
                  <ul className="mt-1 space-y-1 text-sm">
                    {selectedEvents.projects.map((project) => (
                      <li key={project._id || project.id || `${project.title}-${project.deadline}`}>
                        {project.course}: {project.title} (Study days:{' '}
                        {Number(project.studyDays) > 0 ? project.studyDays : 1})
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {selectedEvents.others.length > 0 ? (
                <div className="mt-3">
                  <p className="text-sm font-semibold text-[#6e5f96]">Other</p>
                  <ul className="mt-1 space-y-1 text-sm">
                    {selectedEvents.others.map((item) => (
                      <li key={item._id || `${item.title}-${item.deadline}`}>{item.title}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  )
}

export default AcademyCalendarModal
