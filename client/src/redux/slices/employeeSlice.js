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
    },
    updateEmployee: (state, action) => {
      const index = state.employees.findIndex(emp => emp._id === action.payload._id)
      if (index !== -1) {
        state.employees[index] = action.payload
      }
    },
    deleteEmployee: (state, action) => {
      state.employees = state.employees.filter(emp => emp._id !== action.payload)
    }
  }
})

export const { setEmployees, setLoading, setError, updateEmployee, deleteEmployee } = employeeSlice.actions
export default employeeSlice.reducer 