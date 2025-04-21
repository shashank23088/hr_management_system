import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setEmployees, setLoading, setError } from '../../redux/slices/employeeSlice'
import api from '../../utils/axios'
import { toast } from 'react-toastify'
import { FaPlus } from 'react-icons/fa'

const Employees = () => {
  const dispatch = useDispatch()
  const { employees, loading, error } = useSelector((state) => state.employees)
  const { token } = useSelector((state) => state.auth)

  // State for the Add Employee Modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [newEmployeeData, setNewEmployeeData] = useState({
    name: '',
    email: '',
    position: '',
    department: '',
    joiningDate: '',
    salary: ''
    // team: null, // Optional: Add team selection later if needed
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchEmployees = async () => {
    try {
      dispatch(setLoading())
      const response = await api.get('/api/employees')
      dispatch(setEmployees(response.data))
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to fetch employees'
      dispatch(setError(errorMsg))
      toast.error(errorMsg) // Show fetch error
    }
  }

  useEffect(() => {
    // Initial fetch
    fetchEmployees()
  }, [dispatch]) // Removed token dependency as api utility handles it

  // Handle form field changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewEmployeeData(prev => ({ ...prev, [name]: value }))
  }

  // Handle form submission
  const handleAddEmployeeSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      console.log('Submitting new employee:', newEmployeeData)
      const response = await api.post('/api/employees', newEmployeeData)
      console.log('Add employee response:', response.data)
      
      toast.success('Employee added successfully!')
      setShowAddModal(false) // Close modal
      setNewEmployeeData({ name: '', email: '', position: '', department: '', joiningDate: '', salary: '' }) // Reset form
      fetchEmployees() // Refresh the employee list

    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to add employee'
      console.error('Error adding employee:', err.response || err)
      toast.error(`Error: ${errorMsg}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return (
    <div className="flex justify-center items-center h-full">
      <div className="text-lg">Loading...</div>
    </div>
  )
  
  if (error) return (
    <div className="flex justify-center items-center h-full">
      <div className="text-lg text-red-500">Error: {error}</div>
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Employees</h1>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-flex items-center"
        >
          <FaPlus className="mr-2"/>
          Add Employee
        </button>
      </div>
      
      {/* Existing Error Display */} 
      {error && !loading && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 border border-red-400 rounded">
          Error: {error}
        </div>
      )} 

      {/* Existing Loading Display */} 
      {loading && (
          <div className="text-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2">Loading Employees...</p>
          </div>
      )} 

      {/* Employee Table */} 
      {!loading && (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  {/* Consider adding Joining Date, Status etc. if needed */}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employees && employees.length > 0 ? employees.map((employee) => (
                  <tr key={employee._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{employee.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{employee.position}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {/* Display Department if available in fetched data */}
                      <div className="text-sm text-gray-500">{employee.department || 'N/A'}</div> 
                    </td>
                  </tr>
                )) : (
                    <tr>
                        <td colSpan="4" className="text-center py-10 text-gray-500">
                            No employees found.
                        </td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
      )}

      {/* Add Employee Modal */} 
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-lg w-full shadow-xl">
            <h2 className="text-xl font-bold mb-6">Add New Employee</h2>
            <form onSubmit={handleAddEmployeeSubmit} className="space-y-4">
              {/* Form Fields */} 
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                <input type="text" name="name" id="name" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" value={newEmployeeData.name} onChange={handleInputChange} />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                <input type="email" name="email" id="email" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" value={newEmployeeData.email} onChange={handleInputChange} />
              </div>
              <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-700">Position</label>
                <input type="text" name="position" id="position" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" value={newEmployeeData.position} onChange={handleInputChange} />
              </div>
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700">Department</label>
                <input type="text" name="department" id="department" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" value={newEmployeeData.department} onChange={handleInputChange} />
              </div>
              <div>
                <label htmlFor="joiningDate" className="block text-sm font-medium text-gray-700">Joining Date</label>
                <input type="date" name="joiningDate" id="joiningDate" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" value={newEmployeeData.joiningDate} onChange={handleInputChange} />
              </div>
              <div>
                <label htmlFor="salary" className="block text-sm font-medium text-gray-700">Salary</label>
                <input type="number" name="salary" id="salary" required min="0" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" value={newEmployeeData.salary} onChange={handleInputChange} />
              </div>
              
              {/* Action Buttons */} 
              <div className="flex justify-end space-x-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={isSubmitting}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                >
                  {isSubmitting ? 'Adding...' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Employees 