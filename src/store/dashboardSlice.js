import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  selectedCategory: 'tasks',
  latestSyncAt: '',
}

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload
    },
    setLatestSyncAt: (state, action) => {
      state.latestSyncAt = action.payload
    },
  },
})

export const { setSelectedCategory, setLatestSyncAt } = dashboardSlice.actions
export default dashboardSlice.reducer
