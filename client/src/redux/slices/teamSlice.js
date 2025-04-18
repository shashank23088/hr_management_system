import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../utils/axios'

// Async thunks
export const fetchTeams = createAsyncThunk(
  'teams/fetchTeams',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/teams')
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch teams' })
    }
  }
)

export const createTeam = createAsyncThunk(
  'teams/createTeam',
  async (teamData, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/teams', teamData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to create team' })
    }
  }
)

export const updateTeam = createAsyncThunk(
  'teams/updateTeam',
  async ({ id, teamData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/teams/${id}`, teamData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to update team' })
    }
  }
)

const teamSlice = createSlice({
  name: 'teams',
  initialState: {
    records: [],
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
      // Fetch Teams
      .addCase(fetchTeams.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTeams.fulfilled, (state, action) => {
        state.loading = false
        state.records = action.payload
      })
      .addCase(fetchTeams.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload?.message || 'Failed to fetch teams'
      })
      // Create Team
      .addCase(createTeam.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createTeam.fulfilled, (state, action) => {
        state.loading = false
        state.records.push(action.payload)
      })
      .addCase(createTeam.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload?.message || 'Failed to create team'
      })
      // Update Team
      .addCase(updateTeam.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateTeam.fulfilled, (state, action) => {
        state.loading = false
        const index = state.records.findIndex(team => team._id === action.payload._id)
        if (index !== -1) {
          state.records[index] = action.payload
        }
      })
      .addCase(updateTeam.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload?.message || 'Failed to update team'
      })
  },
})

export const { clearError } = teamSlice.actions
export default teamSlice.reducer 