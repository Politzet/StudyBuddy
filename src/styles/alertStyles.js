const ALERT_BASE_CLASS = 'mt-4 rounded-xl border px-4 py-3 text-sm'

const ALERT_STYLES = {
  error: {
    dark: 'border-[#7f4b4b] bg-[#3a1f1f]/85 text-[#f7d6d6]',
    light: 'border-[#e6b7b7] bg-[#fff1f1]/92 text-[#8f2f2f]',
  },
  success: {
    dark: 'border-[#5a7a61] bg-[#22382a]/85 text-[#d8f2df]',
    light: 'border-[#b9dfc2] bg-[#f1fff4]/92 text-[#2f6b3f]',
  },
}

export const getAlertClass = (type, isDark) => {
  const palette = ALERT_STYLES[type] || ALERT_STYLES.error
  return `${ALERT_BASE_CLASS} ${isDark ? palette.dark : palette.light}`
}

export const getAlertActionClass = (type) => {
  if (type === 'error') {
    return 'mt-3 rounded-md bg-[#6f3f3f] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#5d3434]'
  }

  return 'mt-3 rounded-md bg-[#8b6b57] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#785845]'
}
