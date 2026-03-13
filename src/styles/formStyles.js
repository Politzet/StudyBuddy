export const getFormInputClass = (isDark) =>
  `rounded-md border px-3 py-2 ${
    isDark
      ? 'border-[#6a5448] bg-[#2d221d] text-[#f6ede6]'
      : 'border-[#d2c0b1] bg-[#fffaf6] text-[#453434]'
  }`
