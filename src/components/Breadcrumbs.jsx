import { Link, useLocation } from 'react-router-dom'

const LABELS = {
  home: 'Home',
  tasks: 'Tasks',
  exams: 'Exams',
  tests: 'Tests',
  projects: 'Projects',
  other: 'Other',
  'moodle-sync': 'Moodle Sync',
  api: 'Resources',
}

function Breadcrumbs({ isDark = false }) {
  const location = useLocation()
  const segments = location.pathname.split('/').filter(Boolean)

  if (segments.length === 0) {
    return null
  }

  return (
    <nav
      className={`mb-4 text-sm ${isDark ? 'text-[#eadccf]' : 'text-[#6b5447]'}`}
      aria-label="Breadcrumb"
    >
      <ol className="flex flex-wrap items-center gap-2">
        <li>
          <Link to="/home" className="underline-offset-2 hover:underline">
            Home
          </Link>
        </li>
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1
          const href = `/${segments.slice(0, index + 1).join('/')}`
          const label = LABELS[segment] || segment

          return (
            <li key={href} className="flex items-center gap-2">
              <span>/</span>
              {isLast ? (
                <span className="font-semibold">{label}</span>
              ) : (
                <Link to={href} className="underline-offset-2 hover:underline">
                  {label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export default Breadcrumbs
