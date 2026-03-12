import { useMemo, useState } from 'react'
import useFetch from '../hooks/useFetch'
import ResourceCard from '../components/ResourceCard'
import { API_BASE_URL } from '../config/api'
import { useTheme } from '../context/ThemeContext'

const truncateTitle = (title = '', maxLength = 80) =>
  title.length > maxLength ? `${title.slice(0, maxLength)}...` : title

function ResourcesPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [refreshKey, setRefreshKey] = useState(0)
  const [lastRefresh, setLastRefresh] = useState(() =>
    new Date().toLocaleTimeString(),
  )

  const {
    data: resourcesData,
    loading,
    error,
    refetch,
  } = useFetch(`${API_BASE_URL}/api/resources/blogs?refresh=${refreshKey}`)

  const articles = useMemo(() => {
    const source = Array.isArray(resourcesData) ? resourcesData : []
    return source.map((article) => ({
      ...article,
      title: truncateTitle(article.title),
    }))
  }, [resourcesData])

  const handleRefresh = () => {
    setLastRefresh(new Date().toLocaleTimeString())
    refetch()
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <section
      className={`rounded-xl p-6 ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'}`}
    >
      <h2 className="text-2xl font-bold">Resources</h2>
      <p className={`mt-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
        Real blog resources matched to your current course tasks.
      </p>

      {loading ? (
        <div
          className={`mt-8 flex items-center justify-center gap-3 rounded-lg border px-4 py-6 ${
            isDark
              ? 'border-blue-800 bg-blue-950 text-blue-200'
              : 'border-blue-200 bg-blue-50 text-blue-700'
          }`}
        >
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <span className="font-medium">Loading resources...</span>
        </div>
      ) : null}

      {error ? (
        <div
          className={`mt-6 rounded-lg border px-4 py-4 ${
            isDark
              ? 'border-red-900 bg-red-950 text-red-200'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          <p className="font-medium">Error: {error}</p>
          <button
            type="button"
            onClick={handleRefresh}
            className="mt-3 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleRefresh}
        className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
      >
        Refresh Resources
      </button>
      <p className={`mt-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        Last refresh: {lastRefresh}
      </p>

      {!loading && !error ? (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {articles.map((article, index) => (
            <li key={`${article.url}-${index}`}>
              <ResourceCard article={article} isDark={isDark} />
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}

export default ResourcesPage
