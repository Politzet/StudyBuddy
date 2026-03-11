import { useEffect, useState } from 'react'

function ResourcesPage() {
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true)
        setError('')

        const response = await fetch('https://jsonplaceholder.typicode.com/todos')

        if (!response.ok) {
          throw new Error('Failed to fetch data from API')
        }

        const data = await response.json()
        setResources(data)
      } catch (fetchError) {
        setError(fetchError.message)
      } finally {
        setLoading(false)
      }
    }

    fetchResources()
  }, [])

  return (
    <section>
      <h2 className="text-2xl font-bold">Study Resources (API)</h2>
      <p className="mt-2 text-slate-600">
        Data loaded with fetch from an external API.
      </p>

      {loading ? <p className="mt-6">Loading...</p> : null}

      {error ? <p className="mt-6 text-red-600">Error: {error}</p> : null}

      {!loading && !error ? (
        <ul className="mt-6 space-y-3">
          {resources.map((resource) => (
            <li
              key={resource.id}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            >
              <p className="font-medium text-slate-900">{resource.title}</p>
              <p className="mt-1 text-sm text-slate-600">
                Status: {resource.completed ? 'Completed' : 'Not completed'}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}

export default ResourcesPage
