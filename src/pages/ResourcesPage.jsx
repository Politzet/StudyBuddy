import { useMemo, useState } from 'react'
import useFetch from '../hooks/useFetch'
import ResourceCard from '../components/ResourceCard'
import { API_BASE_URL } from '../config/api'
import { useTheme } from '../context/ThemeContext'
import { getAlertActionClass, getAlertClass } from '../styles/alertStyles'

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
      className={`rounded-2xl border p-6 shadow-lg backdrop-blur-sm ${
        isDark
          ? 'border-[#5a463b] bg-[#2d221d]/85 text-[#f6ede6]'
          : 'border-[#d9c7b8] bg-[#fff8f1]/88 text-[#453434]'
      }`}
    >
      <h2 className="text-2xl font-bold">Resources</h2>
      <p className={`mt-2 ${isDark ? 'text-[#eadccf]' : 'text-[#6b5447]'}`}>
        Real blog resources matched to your current course tasks.
      </p>

      {loading ? (
        <div
          className={`mt-8 flex items-center justify-center gap-3 rounded-lg border px-4 py-6 ${
            isDark
              ? 'border-[#8b6b57] bg-[#3a2b24]/80 text-[#f6ede6]'
              : 'border-[#d9c7b8] bg-[#fff1e4] text-[#6b5447]'
          }`}
        >
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#8b6b57] border-t-transparent" />
          <span className="font-medium">Loading resources...</span>
        </div>
      ) : null}

      {error ? (
        <div className={getAlertClass('error', isDark)}>
          <p className="font-medium">Error: {error}</p>
          <button
            type="button"
            onClick={handleRefresh}
            className={getAlertActionClass('error')}
          >
            Try Again
          </button>
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleRefresh}
        className="mt-4 rounded-md bg-[#8b6b57] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#785845]"
      >
        Refresh Resources
      </button>
      <p className={`mt-2 text-xs ${isDark ? 'text-[#d7c3b4]' : 'text-[#7c6558]'}`}>
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
