import { configureStore } from '@reduxjs/toolkit'
import userReducer from './userSlice'
import dashboardReducer from './dashboardSlice'

const store = configureStore({
  reducer: {
    user: userReducer,
    dashboard: dashboardReducer,
  },
})

export default store
