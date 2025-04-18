import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  employees: [],
  loading: false,
  error: null
}

const employeeSlice = createSlice({
  name: 'employee',
  initialState,
  reducers: {
    setEmployees: (state, action) => {
      state.employees = action.payload
      state.loading = false
      state.error = null
    },
    setLoading: (state) => {
      state.loading = true
      state.error = null
    },
    setError: (state, action) => {
      state.loading = false
      state.error = action.payload
    }
  }
})

export const { setEmployees, setLoading, setError } = employeeSlice.actions
export default employeeSlice.reducer 