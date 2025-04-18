import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import api from '../../utils/axios'

const Leaves = () => {
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [newLeave, setNewLeave] = useState({
    startDate: '',
    endDate: '',
    reason: '',
    type: 'casual'
  })

  const { user } = useSelector((state) => state.auth)

  useEffect(() => {
    const fetchLeaves = async () => {
      if (!user || !user.employeeId) {
        setError('User data not available')
        setLoading(false)
        return
      }

      try {
        console.log('Fetching leaves for employee ID:', user.employeeId)
        const response = await api.get(`/api/leaves/employee/${user.employeeId}`)
        setLeaves(Array.isArray(response.data) ? response.data : [])
        setLoading(false)
      } catch (err) {
        console.error('Failed to fetch leaves:', err)
        setError(err.response?.data?.message || err.message || 'Failed to fetch leaves')
        setLoading(false)
      }
    }

    fetchLeaves()
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!user || !user.employeeId) {
      setError('User data not available')
      return
    }
    
    try {
      const response = await api.post('/api/leaves', {
        ...newLeave,
        employee: user.employeeId
      })
      
      setLeaves([...leaves, response.data])
      setNewLeave({
        startDate: '',
        endDate: '',
        reason: '',
        type: 'casual'
      })
      document.getElementById('createLeaveModal').close()
    } catch (err) {
      console.error('Failed to create leave request:', err)
      setError(err.response?.data?.message || err.message || 'Failed to create leave request')
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

  if (loading) return <div className="p-4 text-center">Loading leaves...</div>
  if (error) return <div className="p-4 text-red-500 text-center">{error}</div>
  if (leaves.length === 0) return <div className="p-4 text-center">No leave records found.</div>

  return (
    <div className="container mx-auto px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Leave Management</h1>
        <button
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          onClick={() => document.getElementById('createLeaveModal').showModal()}
        >
          Request Leave
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  End Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaves.map((leave) => (
                <tr key={leave._id || Math.random().toString()}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {leave.type || 'Not specified'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {leave.startDate ? new Date(leave.startDate).toLocaleDateString() : 'Not set'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {leave.endDate ? new Date(leave.endDate).toLocaleDateString() : 'Not set'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {leave.reason || 'No reason provided'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(leave.status)}`}
                    >
                      {leave.status || 'pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Leave Modal */}
      <dialog id="createLeaveModal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">Request Leave</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={newLeave.type}
                onChange={(e) => setNewLeave({ ...newLeave, type: e.target.value })}
                required
              >
                <option value="casual">Casual</option>
                <option value="sick">Sick</option>
                <option value="annual">Annual</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={newLeave.startDate}
                onChange={(e) => setNewLeave({ ...newLeave, startDate: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={newLeave.endDate}
                onChange={(e) => setNewLeave({ ...newLeave, endDate: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Reason</label>
              <textarea
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={newLeave.reason}
                onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })}
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                onClick={() => document.getElementById('createLeaveModal').close()}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  )
}

export default Leaves 