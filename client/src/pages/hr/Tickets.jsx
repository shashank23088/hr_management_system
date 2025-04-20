import React, { useState, useEffect } from 'react';
import api from '../../utils/axios';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FaSpinner, FaTrash } from 'react-icons/fa';

const Tickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [response, setResponse] = useState('');
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState(null);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!user?.id) {
      setError('User data not available');
      setLoading(false);
      return;
    }
    fetchTickets();
  }, [user]);

  const fetchTickets = async () => {
    try {
      console.log('Fetching tickets with user:', user.id);
      const response = await api.get('/api/tickets');
      setTickets(response.data);
      setLoading(false);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error fetching tickets';
      console.error('Error fetching tickets:', err);
      setError(errorMessage);
      setLoading(false);
      toast.error(errorMessage);
    }
  };

  const handleResponseSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Submitting response:', {
        ticketId: selectedTicket._id,
        response,
        status: 'resolved'
      });
      
      const result = await api.post(`/api/tickets/${selectedTicket._id}/response`, {
        response,
        status: 'resolved'
      });
      
      console.log('Response submission result:', result.data);
      
      toast.success('Response submitted successfully');
      setShowResponseModal(false);
      setResponse('');
      setSelectedTicket(null);
      fetchTickets();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error submitting response';
      console.error('Error submitting response:', err);
      toast.error(errorMessage);
    }
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      await api.put(`/api/tickets/${ticketId}`, {
        status: newStatus,
      });
      toast.success('Ticket status updated successfully');
      fetchTickets();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error updating ticket status';
      console.error('Error updating ticket status:', err);
      toast.error(errorMessage);
    }
  };

  const handleDeleteClick = (ticket) => {
    setTicketToDelete(ticket);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/api/tickets/${ticketToDelete._id}`);
      toast.success('Ticket deleted successfully');
      setShowDeleteModal(false);
      setTicketToDelete(null);
      fetchTickets(); // Refresh the list
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error deleting ticket';
      console.error('Error deleting ticket:', err);
      toast.error(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Support Tickets</h1>
      
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tickets.map((ticket) => (
              <tr key={ticket._id}>
                <td className="px-6 py-4 whitespace-nowrap">{ticket.title}</td>
                <td className="px-6 py-4">{ticket.description}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {ticket.employee?.name || 'Unknown Employee'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                    ${ticket.priority === 'high' ? 'bg-red-100 text-red-800' :
                      ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'}`}>
                    {ticket.priority}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={ticket.status}
                    onChange={(e) => handleStatusChange(ticket._id, e.target.value)}
                    className="block w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(ticket.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap space-x-2">
                  <button
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setShowResponseModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-900 mr-2"
                  >
                    Respond
                  </button>
                  <button
                    onClick={() => handleDeleteClick(ticket)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <FaTrash className="inline" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Response Modal */}
      {showResponseModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Respond to Ticket
              </h3>
              <form onSubmit={handleResponseSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Response
                  </label>
                  <textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows="4"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowResponseModal(false);
                      setSelectedTicket(null);
                      setResponse('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Submit Response
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Confirm Delete
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Are you sure you want to delete this ticket? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setTicketToDelete(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tickets; 