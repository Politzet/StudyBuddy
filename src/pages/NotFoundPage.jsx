import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <section className="flex min-h-[55vh] items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
          Error 404
        </p>
        <h2 className="mt-2 text-3xl font-bold text-slate-900">Page Not Found</h2>
        <p className="mt-3 text-slate-600">
          The page you are looking for does not exist or may have been moved.
        </p>

        <Link
          to="/"
          className="mt-6 inline-flex rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700"
        >
          Back to Home
        </Link>
      </div>
    </section>
  )
}

export default NotFoundPage
