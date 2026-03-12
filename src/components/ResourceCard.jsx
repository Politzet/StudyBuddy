function ResourceCard({ article, isDark = false }) {
  const fallbackDescription =
    'No description available for this study resource.'

  return (
    <article
      className={`overflow-hidden rounded-lg border shadow-sm ${
        isDark
          ? 'border-[#5f4a3f] bg-[#2f241f]/90'
          : 'border-[#d9c7b8] bg-[#fffaf4]/95'
      }`}
    >
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
          <p
            className={`mb-2 text-xs font-semibold uppercase tracking-wide ${
              isDark ? 'text-[#d9bfa9]' : 'text-[#8b6b57]'
            }`}
          >
            Related to: {article.sourceCourse}
          </p>
        ) : null}
        <h3 className={`text-base font-semibold ${isDark ? 'text-[#fff4ea]' : 'text-[#453434]'}`}>
          Study Resource: {article.title}
        </h3>
        <p className={`mt-2 text-sm ${isDark ? 'text-[#eadccf]' : 'text-[#6b5447]'}`}>
          Description: {article.description || fallbackDescription}
        </p>
        <a
          href={article.url}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex rounded-md bg-[#8b6b57] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#785845]"
        >
          Read More
        </a>
      </div>
    </article>
  )
}

export default ResourceCard
