import { createSlice } from '@reduxjs/toolkit'

const AUTH_STORAGE_KEY = 'studybuddy_auth'
const USER_SCOPED_STORAGE_KEYS = ['add-task-form', 'tasks-course-filter']

const loadAuthState = () => {
  try {
    if (typeof window === 'undefined') {
      return { user: null, isLoggedIn: false }
    }
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) {
      return { user: null, isLoggedIn: false }
    }
    const parsed = JSON.parse(raw)
    if (parsed?.user && parsed?.isLoggedIn) {
      return { user: parsed.user, isLoggedIn: true }
    }
    return { user: null, isLoggedIn: false }
  } catch {
    return { user: null, isLoggedIn: false }
  }
}

const persistAuthState = (user, isLoggedIn) => {
  try {
    if (typeof window === 'undefined') {
      return
    }
    if (!isLoggedIn || !user) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY)
      return
    }
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, isLoggedIn: true }))
  } catch {
    // Ignore storage errors to avoid blocking auth flow.
  }
}

const clearUserScopedStorage = () => {
  try {
    if (typeof window === 'undefined') {
      return
    }
    USER_SCOPED_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key))
  } catch {
    // Ignore storage clear errors to avoid blocking auth flow.
  }
}

const persistedAuth = loadAuthState()

const initialState = {
  user: persistedAuth.user,
  isLoggedIn: persistedAuth.isLoggedIn,
  lastTaskAdded: '',
  auth: {
    isLoading: false,
    isAuthenticated: persistedAuth.isLoggedIn,
  },
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    login: (state, action) => {
      const previousUserId = state.user?.id ? String(state.user.id) : ''
      const nextUserId = action.payload?.id ? String(action.payload.id) : ''
      if (nextUserId && previousUserId !== nextUserId) {
        clearUserScopedStorage()
      }
      state.user = action.payload
      state.isLoggedIn = true
      state.auth.isAuthenticated = true
      persistAuthState(state.user, state.isLoggedIn)
    },
    logout: (state) => {
      state.user = null
      state.isLoggedIn = false
      state.auth.isAuthenticated = false
      state.auth.isLoading = false
      persistAuthState(null, false)
    },
    updateUsername: (state, action) => {
      if (state.user) {
        state.user.name = action.payload
        persistAuthState(state.user, state.isLoggedIn)
      }
    },
    setLastTaskAdded: (state, action) => {
      state.lastTaskAdded = action.payload
    },
    setAuthLoading: (state, action) => {
      state.auth.isLoading = Boolean(action.payload)
    },
  },
})

export const { login, logout, updateUsername, setLastTaskAdded, setAuthLoading } =
  userSlice.actions
export default userSlice.reducer
