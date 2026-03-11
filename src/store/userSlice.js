import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  user: null,
  isLoggedIn: false,
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
  },
})

export const { login, logout, updateUsername } = userSlice.actions
export default userSlice.reducer
