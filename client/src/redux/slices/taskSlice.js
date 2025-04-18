import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../utils/axios'

// Async thunks
export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/tasks')
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch tasks' })
    }
  }
)

export const fetchEmployeeTasks = createAsyncThunk(
  'tasks/fetchEmployeeTasks',
  async (employeeId, { rejectWithValue }) => {
    try {
      console.log('Fetching tasks for employee ID:', employeeId);
      const response = await api.get(`/api/tasks/employee/${employeeId}`);
      // Ensure we're dealing with an array
      const data = Array.isArray(response.data) ? response.data : [];
      return data;
    } catch (error) {
      console.error('Error fetching employee tasks:', error);
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch employee tasks' });
    }
  }
)

export const createTask = createAsyncThunk(
  'tasks/createTask',
  async (taskData, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/tasks', taskData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to create task' })
    }
  }
)

export const updateTaskStatus = createAsyncThunk(
  'tasks/updateTaskStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/tasks/${id}/status`, { status })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to update task status' })
    }
  }
)

export const addTaskComment = createAsyncThunk(
  'tasks/addTaskComment',
  async ({ id, comment }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/tasks/${id}/comments`, { comment })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to add comment' })
    }
  }
)

const taskSlice = createSlice({
  name: 'tasks',
  initialState: {
    records: [],
    employeeTasks: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch All Tasks
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false
        state.records = action.payload
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload?.message || 'Failed to fetch tasks'
      })
      // Fetch Employee Tasks
      .addCase(fetchEmployeeTasks.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchEmployeeTasks.fulfilled, (state, action) => {
        state.loading = false
        state.employeeTasks = action.payload
      })
      .addCase(fetchEmployeeTasks.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload?.message || 'Failed to fetch employee tasks'
      })
      // Create Task
      .addCase(createTask.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.loading = false
        state.records.push(action.payload)
      })
      .addCase(createTask.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload?.message || 'Failed to create task'
      })
      // Update Task Status
      .addCase(updateTaskStatus.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateTaskStatus.fulfilled, (state, action) => {
        state.loading = false
        // Update in records array
        const recordIndex = state.records.findIndex(task => task._id === action.payload._id)
        if (recordIndex !== -1) {
          state.records[recordIndex] = action.payload
        }
        // Update in employeeTasks array
        const employeeTaskIndex = state.employeeTasks.findIndex(task => task._id === action.payload._id)
        if (employeeTaskIndex !== -1) {
          state.employeeTasks[employeeTaskIndex] = action.payload
        }
      })
      .addCase(updateTaskStatus.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload?.message || 'Failed to update task status'
      })
      // Add Task Comment
      .addCase(addTaskComment.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(addTaskComment.fulfilled, (state, action) => {
        state.loading = false
        // Update in records array
        const recordIndex = state.records.findIndex(task => task._id === action.payload._id)
        if (recordIndex !== -1) {
          state.records[recordIndex] = action.payload
        }
        // Update in employeeTasks array
        const employeeTaskIndex = state.employeeTasks.findIndex(task => task._id === action.payload._id)
        if (employeeTaskIndex !== -1) {
          state.employeeTasks[employeeTaskIndex] = action.payload
        }
      })
      .addCase(addTaskComment.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload?.message || 'Failed to add comment'
      })
  },
})

export const { clearError } = taskSlice.actions
export default taskSlice.reducer 