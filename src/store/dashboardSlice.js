import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  selectedCategory: 'tasks',
  latestSyncAt: '',
  lastCreatedItem: null,
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
    markItemCreated: (state, action) => {
      state.lastCreatedItem = action.payload
    },
    clearLastCreatedItem: (state) => {
      state.lastCreatedItem = null
    },
  },
})

export const { setSelectedCategory, setLatestSyncAt, markItemCreated, clearLastCreatedItem } =
  dashboardSlice.actions
export default dashboardSlice.reducer
