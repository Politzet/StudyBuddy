function ResourceCard({ article }) {
  const fallbackDescription =
    'No description available for this study resource.'

  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <img
        src={
          article.urlToImage ||
          'https://images.unsplash.com/photo-1484417894907-623942c8ee29?auto=format&fit=crop&w=900&q=80'
        }
        alt={article.title}
        className="h-40 w-full object-cover"
      />
      <div className="p-4">
        {article.sourceCourse ? (
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-600">
            Related to: {article.sourceCourse}
          </p>
        ) : null}
        <h3 className="text-base font-semibold text-slate-900">
          Study Resource: {article.title}
        </h3>
        <p className="mt-2 text-sm text-slate-600">
          Description: {article.description || fallbackDescription}
        </p>
        <a
          href={article.url}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          Read More
        </a>
      </div>
    </article>
  )
}

export default ResourceCard
