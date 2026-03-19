import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'

function CustomDropdown({
  options = [],
  value = '',
  onChange,
  placeholder = 'Select',
  isDark = false,
  className = '',
  disabled = false,
  stylePreset = 'openCalendar',
}) {
  const MotionDiv = motion.div
  const [isOpen, setIsOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState(null)
  const rootRef = useRef(null)
  const buttonRef = useRef(null)
  const menuRef = useRef(null)

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
  const triggerToneClass =
    stylePreset === 'openCalendar'
      ? isDark
        ? 'border-[#a68467]/55 bg-[#4a372b]/55 text-[#f6e9d5] hover:bg-[#5a4335]/70'
        : 'border-[#c2a485]/70 bg-[#f6ecdf]/65 text-[#5a3f2f] hover:bg-[#efe2d2]/80'
      : isDark
        ? 'border-[#8b6a4d] bg-[#2d241e] text-[#f1dfb3] hover:bg-[#382c24]'
        : 'border-[#d2c0b1] bg-[#f4eae0] text-[#2a3748] hover:bg-[#f0e1d2]'
  const menuToneClass =
    stylePreset === 'openCalendar'
      ? isDark
        ? 'border-[#a68467]/55 bg-[#4a372b]/55'
        : 'border-[#c2a485]/70 bg-[#f6ecdf]/65'
      : isDark
        ? 'border-[#8b6a4d] bg-[#2d241e]'
        : 'border-[#d7c5b7] bg-[#f4eae0]'
  const selectedOptionClass =
    stylePreset === 'openCalendar'
      ? isDark
        ? 'bg-[#6c4f3e]/85 text-[#f6e9d5]'
        : 'bg-[#9a7459]/95 text-[#fff7ee]'
      : 'bg-[#8b6b57] text-white'
  const regularOptionClass =
    stylePreset === 'openCalendar'
      ? isDark
        ? 'text-[#f5e7db] hover:bg-[#3a2d26]'
        : 'text-[#5a463b] hover:bg-[#f1e2d5]'
      : isDark
        ? 'text-[#f5e7db] hover:bg-[#3a2d26]'
        : 'text-[#5a463b] hover:bg-[#f1e2d5]'

  const syncMenuPosition = () => {
    if (!buttonRef.current) {
      return
    }

    const rect = buttonRef.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight || 0
    const gap = 8

    // Always open below the trigger (product preference). Use maxHeight + scroll if near
    // the bottom of the viewport.
    setMenuStyle({
      top: Math.max(8, rect.bottom + gap),
      left: rect.left,
      width: rect.width,
      maxHeight: Math.max(140, Math.min(320, viewportHeight - rect.bottom - 12)),
    })
  }

  const closeMenu = () => setIsOpen(false)

  useEffect(() => {
    const handlePointerDown = (event) => {
      const target = event.target
      if (rootRef.current?.contains(target)) {
        return
      }
      if (menuRef.current?.contains(target)) {
        return
      }
      closeMenu()
    }
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        closeMenu()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handleViewportChange = () => {
      const buttonRect = buttonRef.current?.getBoundingClientRect()
      if (!buttonRect) {
        closeMenu()
        return
      }

      const viewportHeight = window.innerHeight || 0
      const viewportWidth = window.innerWidth || 0
      const isOutOfViewport =
        buttonRect.bottom <= 0 ||
        buttonRect.top >= viewportHeight ||
        buttonRect.right <= 0 ||
        buttonRect.left >= viewportWidth

      if (isOutOfViewport) {
        closeMenu()
        return
      }

      syncMenuPosition()
    }

    window.addEventListener('resize', handleViewportChange)
    window.addEventListener('scroll', handleViewportChange, true)
    return () => {
      window.removeEventListener('resize', handleViewportChange)
      window.removeEventListener('scroll', handleViewportChange, true)
    }
  }, [isOpen])

  const openMenu = () => {
    if (!buttonRef.current) {
      setIsOpen(true)
      return
    }

    syncMenuPosition()
    setIsOpen(true)
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (isOpen) {
            closeMenu()
          } else {
            openMenu()
          }
        }}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={`academy-btn flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm font-medium shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[#d6b76f]/35 ${triggerToneClass} ${
          disabled ? 'cursor-not-allowed opacity-60' : ''
        }`}
      >
        <span className="truncate">{buttonLabel}</span>
        <span className="ml-3 text-xs">▾</span>
      </button>

      {menuStyle && !disabled && typeof document !== 'undefined'
        ? createPortal(
            <AnimatePresence onExitComplete={() => setMenuStyle(null)}>
              {isOpen ? (
                <MotionDiv
                  ref={menuRef}
                  initial={{
                    opacity: 0,
                    y: -8,
                    scaleY: 0.65,
                    clipPath: 'inset(0 0 100% 0 round 12px)',
                    transformOrigin: 'top center',
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scaleY: 1,
                    clipPath: 'inset(0 0 0% 0 round 12px)',
                    transformOrigin: 'top center',
                  }}
                  exit={{
                    opacity: 0,
                    y: -6,
                    scaleY: 0.85,
                    clipPath: 'inset(0 0 100% 0 round 12px)',
                    transformOrigin: 'top center',
                  }}
                  transition={{ duration: 0.22, ease: [0.22, 0.7, 0.25, 1] }}
                  className={`fixed z-[180] overflow-auto rounded-lg border p-1 shadow-2xl ${menuToneClass}`}
                  role="menu"
                  style={{
                    top: `${menuStyle.top}px`,
                    left: `${menuStyle.left}px`,
                    width: `${menuStyle.width}px`,
                    maxHeight: `${menuStyle.maxHeight}px`,
                  }}
                >
                  {normalizedOptions.map((option) => (
                    <button
                      key={String(option.value)}
                      type="button"
                      role="menuitem"
                      disabled={option.disabled}
                      onClick={() => {
                        onChange?.(option.value)
                        closeMenu()
                      }}
                      className={`block w-full rounded-md px-3 py-2 text-left text-sm ${
                        String(value) === String(option.value)
                          ? selectedOptionClass
                          : regularOptionClass
                      } ${option.disabled ? 'cursor-not-allowed opacity-60' : ''}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </MotionDiv>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </div>
  )
}

export default CustomDropdown
