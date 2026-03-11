import { useMemo, useState } from 'react'
import useFetch from '../hooks/useFetch'
import ResourceCard from '../components/ResourceCard'
import mockNewsResponse from '../data/mockNewsResponse'

const truncateTitle = (title = '', maxLength = 80) =>
  title.length > maxLength ? `${title.slice(0, maxLength)}...` : title

function ResourcesPage() {
  const [mockOffset, setMockOffset] = useState(0)
  const [lastRefresh, setLastRefresh] = useState(() =>
    new Date().toLocaleTimeString(),
  )
  const apiKey = import.meta.env.VITE_NEWS_API_KEY
  const newsUrl = `https://newsapi.org/v2/everything?q=software+engineering+learning&apiKey=${
    apiKey || 'YOUR_FREE_API_KEY'
  }`

  const {
    data,
    loading,
    error,
    refetch,
  } = useFetch(newsUrl)
  const useMockData = !apiKey

  const articles = useMemo(() => {
    if (useMockData) {
      const mockArticles = mockNewsResponse.articles
      if (mockArticles.length === 0) {
        return []
      }

      // Rotate list on refresh in demo mode so users see visible change.
      const offset = mockOffset % mockArticles.length
      return [...mockArticles.slice(offset), ...mockArticles.slice(0, offset)].map(
        (article) => ({
          ...article,
          title: truncateTitle(article.title),
        }),
      )
    }

    return (data?.articles || []).map((article) => ({
      ...article,
      title: truncateTitle(article.title),
    }))
  }, [data, mockOffset, useMockData])

  const handleRefresh = () => {
    setLastRefresh(new Date().toLocaleTimeString())
    if (useMockData) {
      setMockOffset((prev) => prev + 1)
      return
    }
    refetch()
  }

  return (
    <section>
      <h2 className="text-2xl font-bold">Study Resources (API)</h2>
      <p className="mt-2 text-slate-600">Helpful study resources for your day.</p>
      {useMockData ? (
        <p className="mt-1 text-sm text-amber-700">
          Demo mode: add `VITE_NEWS_API_KEY` in your environment for live news.
        </p>
      ) : null}

      {loading && !useMockData ? (
        <div className="mt-8 flex items-center justify-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-6 text-blue-700">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <span className="font-medium">Loading resources...</span>
        </div>
      ) : null}

      {error && !useMockData ? (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-4 text-red-700">
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
      <p className="mt-2 text-xs text-slate-500">Last refresh: {lastRefresh}</p>

      {(useMockData || (!loading && !error)) ? (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {articles.map((article, index) => (
            <li key={`${article.url}-${index}`}>
              <ResourceCard article={article} />
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}

export default ResourcesPage
