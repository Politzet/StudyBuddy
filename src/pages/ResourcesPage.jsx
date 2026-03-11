import useFetch from '../hooks/useFetch'

function ResourcesPage() {
  const {
    data: resources = [],
    loading,
    error,
    refetch,
  } = useFetch('https://jsonplaceholder.typicode.com/todos')

  return (
    <section>
      <h2 className="text-2xl font-bold">Study Resources (API)</h2>
      <p className="mt-2 text-slate-600">
        Data loaded with fetch from an external API.
      </p>

      {loading ? <p className="mt-6">Loading...</p> : null}

      {error ? <p className="mt-6 text-red-600">Error: {error}</p> : null}

      <button
        type="button"
        onClick={refetch}
        className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
      >
        Refetch Data
      </button>

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
