import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

// Async thunks
export const fetchTickets = createAsyncThunk(
  'ticket/fetchTickets',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState()
      const response = await fetch('/api/tickets', {
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

export const fetchEmployeeTickets = createAsyncThunk(
  'ticket/fetchEmployeeTickets',
  async (employeeId, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState()
      const response = await fetch(`/api/tickets/employee/${employeeId}`, {
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

export const createTicket = createAsyncThunk(
  'ticket/createTicket',
  async (ticketData, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState()
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.user.token}`
        },
        body: JSON.stringify(ticketData)
      })
      const data = await response.json()
      return data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const updateTicketStatus = createAsyncThunk(
  'ticket/updateTicketStatus',
  async ({ id, status }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState()
      const response = await fetch(`/api/tickets/${id}`, {
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

export const addTicketComment = createAsyncThunk(
  'ticket/addTicketComment',
  async ({ id, comment }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState()
      const response = await fetch(`/api/tickets/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.user.token}`
        },
        body: JSON.stringify({ comment })
      })
      const data = await response.json()
      return data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

const ticketSlice = createSlice({
  name: 'ticket',
  initialState: {
    records: [],
    employeeTickets: [],
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
      // Fetch All Tickets
      .addCase(fetchTickets.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTickets.fulfilled, (state, action) => {
        state.loading = false
        state.records = action.payload
      })
      .addCase(fetchTickets.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Fetch Employee Tickets
      .addCase(fetchEmployeeTickets.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchEmployeeTickets.fulfilled, (state, action) => {
        state.loading = false
        state.employeeTickets = action.payload
      })
      .addCase(fetchEmployeeTickets.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Create Ticket
      .addCase(createTicket.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createTicket.fulfilled, (state, action) => {
        state.loading = false
        state.records.push(action.payload)
        state.employeeTickets.push(action.payload)
      })
      .addCase(createTicket.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Update Ticket Status
      .addCase(updateTicketStatus.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateTicketStatus.fulfilled, (state, action) => {
        state.loading = false
        const index = state.records.findIndex(record => record._id === action.payload._id)
        if (index !== -1) {
          state.records[index] = action.payload
        }
        const employeeIndex = state.employeeTickets.findIndex(record => record._id === action.payload._id)
        if (employeeIndex !== -1) {
          state.employeeTickets[employeeIndex] = action.payload
        }
      })
      .addCase(updateTicketStatus.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Add Ticket Comment
      .addCase(addTicketComment.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(addTicketComment.fulfilled, (state, action) => {
        state.loading = false
        const index = state.records.findIndex(record => record._id === action.payload._id)
        if (index !== -1) {
          state.records[index] = action.payload
        }
        const employeeIndex = state.employeeTickets.findIndex(record => record._id === action.payload._id)
        if (employeeIndex !== -1) {
          state.employeeTickets[employeeIndex] = action.payload
        }
      })
      .addCase(addTicketComment.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  }
})

export const { clearError } = ticketSlice.actions
export default ticketSlice.reducer 