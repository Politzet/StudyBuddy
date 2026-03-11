import { useEffect, useState } from 'react'

function getInitialValue(key, initialValue) {
  if (typeof window === 'undefined') {
    return typeof initialValue === 'function' ? initialValue() : initialValue
  }

  try {
    const storedValue = window.localStorage.getItem(key)

    if (storedValue !== null) {
      return JSON.parse(storedValue)
    }
  } catch (error) {
    console.error('Failed reading localStorage key:', key, error)
  }

  return typeof initialValue === 'function' ? initialValue() : initialValue
}

function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => getInitialValue(key, initialValue))

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('Failed writing localStorage key:', key, error)
    }
  }, [key, value])

  return [value, setValue]
}

export default useLocalStorage
