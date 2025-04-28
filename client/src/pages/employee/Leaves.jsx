import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import api from '../../utils/axios'
import { toast } from 'react-toastify'
import { FaComment } from 'react-icons/fa'

const Leaves = () => {
  const { user } = useSelector((state) => state.auth)
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    type: 'vacation',
    reason: ''
  })
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [selectedLeave, setSelectedLeave] = useState(null)
  const [newComment, setNewComment] = useState('')

  useEffect(() => {
    fetchLeaves()
  }, [user])

  const fetchLeaves = async () => {
    if (!user) {
      setError('User data not available')
      setLoading(false)
      return
    }

    // Get the correct employee ID (either user.id or user._id)
    const employeeId = user._id || user.id
    if (!employeeId) {
      console.error('User object:', user)
      setError('Employee ID not found in user data')
      setLoading(false)
      return
    }

    try {
      console.log('User data:', user)
      console.log('Fetching leaves for employee ID:', employeeId)
      const response = await api.get(`/api/leaves/employee/${employeeId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      console.log('Leaves response:', response.data)
      setLeaves(Array.isArray(response.data) ? response.data : [])
      setLoading(false)
    } catch (err) {
      console.error('Failed to fetch leaves:', err)
      setError(err.response?.data?.message || err.message || 'Failed to fetch leaves')
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!user) {
      setError('User data not available')
      return
    }
    
    // Get the correct employee ID (either user.id or user._id)
    const employeeId = user._id || user.id
    if (!employeeId) {
      console.error('User object:', user)
      setError('Employee ID not found in user data')
      return
    }
    
    try {
      const response = await api.post('/api/leaves', {
        ...formData,
        employee: employeeId
      })
      setLeaves([response.data, ...leaves])
      setShowModal(false)
      setFormData({
        startDate: '',
        endDate: '',
        type: 'vacation',
        reason: ''
      })
      toast.success('Leave request submitted successfully')
    } catch (err) {
      console.error('Failed to submit leave request:', err)
      toast.error(err.response?.data?.message || 'Failed to submit leave request')
    }
  }

  const handleDelete = async (leaveId) => {
    if (!window.confirm('Are you sure you want to delete this leave request?')) return
    
    try {
      await api.delete(`/api/leaves/${leaveId}`)
      setLeaves(leaves.filter(leave => leave._id !== leaveId))
      toast.success('Leave request deleted successfully')
    } catch (err) {
      console.error('Failed to delete leave request:', err)
      toast.error(err.response?.data?.message || 'Failed to delete leave request')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await api.post(`/api/leaves/${selectedLeave._id}/comments`, {
        text: newComment
      });

      setLeaves(leaves.map(leave => 
        leave._id === response.data._id ? response.data : leave
      ));
      setSelectedLeave(response.data);
      setNewComment('');
      toast.success('Comment added successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add comment');
    }
  };

  if (loading) return <div className="p-4 text-center">Loading leaves...</div>
  if (error) return <div className="p-4 text-red-500 text-center">{error}</div>
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Leaves</h1>
        <button
          onClick={() => {
            setShowModal(true);
            setFormData({
              startDate: '',
              endDate: '',
              type: 'vacation',
              reason: ''
            });
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Request Leave
        </button>
      </div>

      {leaves.length === 0 ? (
        <div className="bg-white shadow-md rounded-lg p-8 text-center">
          <div className="text-gray-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No leave records found</h3>
          <p className="text-gray-500">You haven't applied for any leaves yet.</p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leaves.map((leave) => (
                  <tr key={leave._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {leave.type.charAt(0).toUpperCase() + leave.type.slice(1)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(leave.startDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(leave.endDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{leave.reason}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(leave.status)}`}>
                        {leave.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-3">
                      {leave.status === 'pending' && (
                        <button
                          onClick={() => handleDelete(leave._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      )}
                        <button
                          onClick={() => {
                            setSelectedLeave(leave);
                            setShowCommentModal(true);
                          }}
                          className="flex items-center text-blue-600 hover:text-blue-700"
                        >
                          <FaComment className="mr-1" />
                          {leave.comments?.length || 0}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Leave Request Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Request Leave</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Leave Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  required
                >
                  <option value="vacation">Vacation</option>
                  <option value="sick">Sick Leave</option>
                  <option value="personal">Personal Leave</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Reason
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  rows="3"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Comments Modal */}
      {showCommentModal && selectedLeave && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Comments</h2>
              <button
                onClick={() => {
                  setShowCommentModal(false);
                  setNewComment('');
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div className="max-h-60 overflow-y-auto space-y-2">
                {selectedLeave.comments?.map((comment) => (
                  <div key={comment._id} className="bg-gray-50 p-3 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {comment.user?.name || comment.user?.email || 'Unknown User'}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">{comment.text}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(comment.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
                {!selectedLeave.comments?.length && (
                  <p className="text-gray-500 text-center py-4">No comments yet</p>
                )}
              </div>
              <form onSubmit={handleAddComment} className="mt-4">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Add a comment..."
                  required
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Add Comment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Leaves 