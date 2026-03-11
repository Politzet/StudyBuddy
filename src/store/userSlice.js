import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  user: null,
  isLoggedIn: false,
  lastTaskAdded: '',
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    login: (state, action) => {
      state.user = action.payload
      state.isLoggedIn = true
    },
    logout: (state) => {
      state.user = null
      state.isLoggedIn = false
    },
    updateUsername: (state, action) => {
      if (state.user) {
        state.user.name = action.payload
      }
    },
    setLastTaskAdded: (state, action) => {
      state.lastTaskAdded = action.payload
    },
  },
})

export const { login, logout, updateUsername, setLastTaskAdded } =
  userSlice.actions
export default userSlice.reducer
