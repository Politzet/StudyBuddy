function FormCard({ isDark = false, onSubmit, title, className = 'mt-6', children, actions, toneClass = '' }) {
  const defaultToneClass = isDark
    ? 'border-[#5a463b] bg-[#1f1612]/80'
    : 'border-[#d9c7b8] bg-[#fffaf4]/85'
  return (
    <form
      onSubmit={onSubmit}
      className={`${className} rounded-xl border p-4 ${toneClass || defaultToneClass}`}
    >
      {title ? <h3 className="mb-3 text-lg font-semibold">{title}</h3> : null}
      {children}
      {actions ? <div className="mt-4 flex gap-2">{actions}</div> : null}
    </form>
  )
}

export default FormCard
