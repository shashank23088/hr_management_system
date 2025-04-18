import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

// Async thunks
export const fetchLeaves = createAsyncThunk(
  'leave/fetchLeaves',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState()
      const response = await fetch('/api/leaves', {
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

export const fetchEmployeeLeaves = createAsyncThunk(
  'leave/fetchEmployeeLeaves',
  async (employeeId, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState()
      const response = await fetch(`/api/leaves/employee/${employeeId}`, {
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

export const createLeave = createAsyncThunk(
  'leave/createLeave',
  async (leaveData, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState()
      const response = await fetch('/api/leaves', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.user.token}`
        },
        body: JSON.stringify(leaveData)
      })
      const data = await response.json()
      return data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const updateLeaveStatus = createAsyncThunk(
  'leave/updateLeaveStatus',
  async ({ id, status }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState()
      const response = await fetch(`/api/leaves/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.user.token}`
        },
        body: JSON.stringify({ status })
      })
      const data = await response.json()
      return data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

const leaveSlice = createSlice({
  name: 'leave',
  initialState: {
    records: [],
    employeeLeaves: [],
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
      // Fetch All Leaves
      .addCase(fetchLeaves.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchLeaves.fulfilled, (state, action) => {
        state.loading = false
        state.records = action.payload
      })
      .addCase(fetchLeaves.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Fetch Employee Leaves
      .addCase(fetchEmployeeLeaves.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchEmployeeLeaves.fulfilled, (state, action) => {
        state.loading = false
        state.employeeLeaves = action.payload
      })
      .addCase(fetchEmployeeLeaves.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Create Leave
      .addCase(createLeave.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createLeave.fulfilled, (state, action) => {
        state.loading = false
        state.records.push(action.payload)
        state.employeeLeaves.push(action.payload)
      })
      .addCase(createLeave.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Update Leave Status
      .addCase(updateLeaveStatus.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateLeaveStatus.fulfilled, (state, action) => {
        state.loading = false
        const index = state.records.findIndex(record => record._id === action.payload._id)
        if (index !== -1) {
          state.records[index] = action.payload
        }
        const employeeIndex = state.employeeLeaves.findIndex(record => record._id === action.payload._id)
        if (employeeIndex !== -1) {
          state.employeeLeaves[employeeIndex] = action.payload
        }
      })
      .addCase(updateLeaveStatus.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  }
})

export const { clearError } = leaveSlice.actions
export default leaveSlice.reducer 