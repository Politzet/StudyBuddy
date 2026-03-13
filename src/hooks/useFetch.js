import { useEffect, useState } from 'react'

function useFetch(url) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [requestCount, setRequestCount] = useState(0)

  useEffect(() => {
    if (!url) {
      setData(null)
      setError('')
      setLoading(false)
      return undefined
    }

    let isCancelled = false
    const controller = new AbortController()

    const runFetch = async () => {
      try {
        setLoading(true)
        setError('')

        const response = await fetch(url, { signal: controller.signal })

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}))
          const errorMessage =
            errorBody?.error?.message ||
            errorBody?.message ||
            'Failed to fetch data from API'
          throw new Error(errorMessage)
        }

        const json = await response.json()

        if (!isCancelled) {
          setData(json)
        }
      } catch (fetchError) {
        if (fetchError.name !== 'AbortError' && !isCancelled) {
          setError(fetchError.message)
        }
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    runFetch()

    return () => {
      isCancelled = true
      controller.abort()
    }
  }, [url, requestCount])

  const refetch = () => {
    setRequestCount((prevCount) => prevCount + 1)
  }

  return { data, loading, error, refetch }
}

export default useFetch
