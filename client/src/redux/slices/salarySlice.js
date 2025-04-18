import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

// Async thunks
export const fetchSalaries = createAsyncThunk(
  'salary/fetchSalaries',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState()
      const response = await fetch('/api/salaries', {
        headers: {
          'Authorization': `Bearer ${auth.user.token}`
        }
      })
      const data = await response.json()
      return data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchEmployeeSalary = createAsyncThunk(
  'salary/fetchEmployeeSalary',
  async (employeeId, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState()
      const response = await fetch(`/api/salaries/employee/${employeeId}`, {
        headers: {
          'Authorization': `Bearer ${auth.user.token}`
        }
      })
      const data = await response.json()
      return data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const createSalary = createAsyncThunk(
  'salary/createSalary',
  async (salaryData, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState()
      const response = await fetch('/api/salaries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.user.token}`
        },
        body: JSON.stringify(salaryData)
      })
      const data = await response.json()
      return data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const updateSalary = createAsyncThunk(
  'salary/updateSalary',
  async ({ id, salaryData }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState()
      const response = await fetch(`/api/salaries/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.user.token}`
        },
        body: JSON.stringify(salaryData)
      })
      const data = await response.json()
      return data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

const salarySlice = createSlice({
  name: 'salary',
  initialState: {
    records: [],
    currentEmployeeSalary: null,
    loading: false,
    error: null
  },
  reducers: {
    clearError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch All Salaries
      .addCase(fetchSalaries.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchSalaries.fulfilled, (state, action) => {
        state.loading = false
        state.records = action.payload
      })
      .addCase(fetchSalaries.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Fetch Employee Salary
      .addCase(fetchEmployeeSalary.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchEmployeeSalary.fulfilled, (state, action) => {
        state.loading = false
        state.currentEmployeeSalary = action.payload
      })
      .addCase(fetchEmployeeSalary.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Create Salary
      .addCase(createSalary.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createSalary.fulfilled, (state, action) => {
        state.loading = false
        state.records.push(action.payload)
      })
      .addCase(createSalary.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Update Salary
      .addCase(updateSalary.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateSalary.fulfilled, (state, action) => {
        state.loading = false
        const index = state.records.findIndex(record => record._id === action.payload._id)
        if (index !== -1) {
          state.records[index] = action.payload
        }
      })
      .addCase(updateSalary.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  }
})

export const { clearError } = salarySlice.actions
export default salarySlice.reducer 