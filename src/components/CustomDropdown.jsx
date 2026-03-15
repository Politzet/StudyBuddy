import { useEffect, useMemo, useRef, useState } from 'react'

function CustomDropdown({
  options = [],
  value = '',
  onChange,
  placeholder = 'Select',
  isDark = false,
  className = '',
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef(null)

  const normalizedOptions = useMemo(
    () =>
      options.map((option) => ({
        value: option?.value ?? '',
        label: option?.label ?? String(option?.value ?? ''),
        disabled: Boolean(option?.disabled),
      })),
    [options],
  )

  const selected = normalizedOptions.find((option) => String(option.value) === String(value))
  const buttonLabel = selected?.label || placeholder

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setIsOpen(false)
      }
    }
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={`academy-btn flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm font-medium shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[#d6b76f]/35 ${
          isDark
            ? 'border-[#8b6a4d] bg-[#2d241e] text-[#f1dfb3] hover:bg-[#382c24]'
            : 'border-[#d2c0b1] bg-[#f4eae0] text-[#2a3748] hover:bg-[#f0e1d2]'
        } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
      >
        <span className="truncate">{buttonLabel}</span>
        <span className="ml-3 text-xs">▾</span>
      </button>

      {isOpen && !disabled ? (
        <div
          className={`absolute left-0 top-full z-[120] mt-2 max-h-64 w-full overflow-auto rounded-lg border p-1 shadow-2xl ${
            isDark ? 'border-[#8b6a4d] bg-[#2d241e]' : 'border-[#d7c5b7] bg-[#f4eae0]'
          }`}
          role="menu"
        >
          {normalizedOptions.map((option) => (
            <button
              key={String(option.value)}
              type="button"
              role="menuitem"
              disabled={option.disabled}
              onClick={() => {
                onChange?.(option.value)
                setIsOpen(false)
              }}
              className={`block w-full rounded-md px-3 py-2 text-left text-sm ${
                String(value) === String(option.value)
                  ? 'bg-[#8b6b57] text-white'
                  : isDark
                    ? 'text-[#f5e7db] hover:bg-[#3a2d26]'
                    : 'text-[#5a463b] hover:bg-[#f1e2d5]'
              } ${option.disabled ? 'cursor-not-allowed opacity-60' : ''}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default CustomDropdown
