import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import api from '../../utils/axios'
import { toast } from 'react-toastify'
import { FaComment, FaReply } from 'react-icons/fa'

const Tickets = () => {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    priority: 'medium'
  })
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [responseModalOpen, setResponseModalOpen] = useState(false)

  const { user } = useSelector((state) => state.auth)

  useEffect(() => {
    const fetchTickets = async () => {
      if (!user || !user.id) {
        setError('User data not available')
        setLoading(false)
        return
      }

      try {
        console.log('Fetching tickets for employee ID:', user.id)
        const response = await api.get(`/api/tickets/employee/${user.id}`)
        console.log('Raw tickets response:', response)
        console.log('Tickets data:', response.data)
        
        // Log each ticket's response data
        response.data.forEach(ticket => {
          console.log(`Ticket ${ticket._id} response data:`, {
            response: ticket.response,
            respondedBy: ticket.respondedBy,
            respondedAt: ticket.respondedAt,
            status: ticket.status
          })
        })

        setTickets(response.data)
        setLoading(false)
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'Failed to fetch tickets'
        console.error('Error fetching tickets:', err)
        setError(errorMessage)
        setLoading(false)
        toast.error(errorMessage)
      }
    }

    fetchTickets()
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await api.post('/api/tickets', {
        ...newTicket,
        employee: user.id
      })
      setTickets([response.data, ...tickets])
      setModalOpen(false)
      setNewTicket({
        title: '',
        description: '',
        priority: 'medium'
      })
      toast.success('Ticket created successfully')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create ticket')
    }
  }

  const openModal = () => {
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setNewTicket({
      title: '',
      description: '',
      priority: 'medium'
    })
  }

  const openResponseModal = async (ticket) => {
    try {
      // Fetch fresh ticket data before showing modal
      const response = await api.get(`/api/tickets/${ticket._id}`)
      console.log('Fetched ticket for modal:', response.data)
      setSelectedTicket(response.data)
      setResponseModalOpen(true)
    } catch (err) {
      console.error('Error fetching ticket details:', err)
      toast.error('Failed to load ticket details')
    }
  }

  const closeResponseModal = () => {
    setSelectedTicket(null)
    setResponseModalOpen(false)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-800'
      case 'in-progress':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-green-100 text-green-800'
    }
  }

  // Add a function to refresh tickets
  const refreshTickets = async () => {
    try {
      const response = await api.get(`/api/tickets/employee/${user.id}`)
      console.log('Refreshed tickets data:', response.data)
      setTickets(response.data)
    } catch (err) {
      console.error('Error refreshing tickets:', err)
      toast.error('Failed to refresh tickets')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Support Tickets</h1>
        <button
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          onClick={openModal}
        >
          Create Ticket
        </button>
      </div>

      {tickets.length === 0 ? (
        <div className="bg-white shadow-md rounded-lg p-6 text-center">
          <p className="text-gray-600">You haven't created any tickets yet.</p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Response
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tickets.map((ticket) => (
                <tr key={ticket._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {ticket.title}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 line-clamp-2">
                      {ticket.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}
                    >
                      {ticket.priority.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(ticket.status)}`}
                    >
                      {ticket.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {ticket.response && ticket.respondedBy ? (
                      <button
                        onClick={() => openResponseModal(ticket)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                      >
                        <FaComment />
                        <span>View Response</span>
                      </button>
                    ) : (
                      <span className="text-gray-500 text-sm">No response yet</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Ticket Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Create New Ticket</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={newTicket.title}
                  onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  rows="4"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Priority</label>
                <select
                  value={newTicket.priority}
                  onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                >
                  Create Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Response Modal */}
      {responseModalOpen && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold mb-2">{selectedTicket.title}</h2>
                <p className="text-sm text-gray-600 mb-4">{selectedTicket.description}</p>
                <div className="flex gap-4 mb-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(selectedTicket.priority)}`}>
                    {selectedTicket.priority.toUpperCase()}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedTicket.status)}`}>
                    {selectedTicket.status.toUpperCase()}
                  </span>
                </div>
              </div>
              <button
                onClick={closeResponseModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-start gap-2 mb-2">
                <FaReply className="text-blue-600 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-900">HR Response</p>
                  <p className="text-xs text-gray-500 mb-2">
                    {selectedTicket.respondedBy ? `By: ${selectedTicket.respondedBy.name || selectedTicket.respondedBy.email}` : ''} 
                    {selectedTicket.respondedAt ? ` • ${new Date(selectedTicket.respondedAt).toLocaleString()}` : ''}
                  </p>
                </div>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{selectedTicket.response}</p>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={closeResponseModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Tickets 