import { useSelector } from 'react-redux'
import TaskCard from '../components/TaskCard'
import { useTheme } from '../context/ThemeContext'
import useFetch from '../hooks/useFetch'
import mockNewsResponse from '../data/mockNewsResponse'
import { API_BASE_URL } from '../config/api'

const truncateTitle = (title, maxLength = 45) =>
  title.length > maxLength ? `${title.slice(0, maxLength)}...` : title

function HomePage() {
  const { user, isLoggedIn } = useSelector((state) => state.user)
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const {
    data: tasksData,
    loading: tasksLoading,
    error: tasksError,
    refetch: refetchTasks,
  } = useFetch(`${API_BASE_URL}/api/tasks`)
  const tasks = Array.isArray(tasksData) ? tasksData : []
  const sortedTasks = [...tasks].sort(
    (a, b) => new Date(a.dueDate) - new Date(b.dueDate),
  )
  const apiKey = import.meta.env.VITE_NEWS_API_KEY
  const newsUrl = `https://newsapi.org/v2/everything?q=software+engineering+learning&apiKey=${
    apiKey || 'YOUR_FREE_API_KEY'
  }`
  const {
    data,
    loading: quickResourcesLoading,
    error: quickResourcesError,
  } = useFetch(newsUrl)
  const quickResources = apiKey
    ? (data?.articles || []).slice(0, 3)
    : mockNewsResponse.articles.slice(0, 3)

  return (
    <section
      className={`rounded-xl p-6 ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'}`}
    >
      <h2 className="text-2xl font-bold">My Study Tasks</h2>
      <p className={`mt-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
        {isLoggedIn
          ? `Welcome back, ${user?.name ?? 'Student'}! Ready to study?`
          : 'Welcome, Guest! Log in to personalize your experience.'}
      </p>

      {tasksLoading ? (
        <p className={`mt-6 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          Loading tasks...
        </p>
      ) : null}
      {tasksError ? (
        <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          <p>Could not load tasks: {tasksError}</p>
          <button
            type="button"
            onClick={refetchTasks}
            className="mt-2 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      ) : null}
      {!tasksLoading && !tasksError && sortedTasks.length === 0 ? (
        <p className={`mt-6 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          No tasks yet. Add your first study task from the form page.
        </p>
      ) : null}
      {!tasksLoading && !tasksError && sortedTasks.length > 0 ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedTasks.map((task) => (
            <TaskCard
              key={task._id || task.id}
              title={task.title}
              courseName={task.courseName || task.course}
              dueDate={task.dueDate}
            />
          ))}
        </div>
      ) : null}

      <div
        className={`mt-8 rounded-xl border p-4 ${
          isDark
            ? 'border-slate-700 bg-slate-900 text-white'
            : 'border-slate-200 bg-slate-50 text-slate-900'
        }`}
      >
        <h3 className="text-lg font-semibold">Quick Resources</h3>
        {quickResourcesLoading && apiKey ? (
          <p className={`mt-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            Loading resources...
          </p>
        ) : null}
        {quickResourcesError && apiKey ? (
          <p className="mt-2 text-sm text-red-600">Could not load resources.</p>
        ) : null}
        {!quickResourcesLoading && !quickResourcesError ? (
          <ul className="mt-3 list-disc space-y-1 pl-5">
            {quickResources.map((item, index) => (
              <li
                key={`${item.url || item.title}-${index}`}
                className={isDark ? 'text-slate-200' : 'text-slate-700'}
              >
                Study Resource: {truncateTitle(item.title)}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  )
}

export default HomePage
