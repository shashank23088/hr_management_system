import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../utils/axios'

// Async thunks
export const fetchAttendance = createAsyncThunk(
  'attendance/fetchAttendance',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/attendance')
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch attendance' })
    }
  }
)

export const markAttendance = createAsyncThunk(
  'attendance/markAttendance',
  async (attendanceData = {}, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/attendance', attendanceData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to mark attendance' })
    }
  }
)

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState: {
    records: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Attendance
      .addCase(fetchAttendance.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAttendance.fulfilled, (state, action) => {
        state.loading = false
        state.records = action.payload
      })
      .addCase(fetchAttendance.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Mark Attendance
      .addCase(markAttendance.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(markAttendance.fulfilled, (state, action) => {
        state.loading = false
        state.records.push(action.payload)
      })
      .addCase(markAttendance.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export default attendanceSlice.reducer 