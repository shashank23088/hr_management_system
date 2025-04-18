import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import api from '../../utils/axios'

const Profile = () => {
  const [employee, setEmployee] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useSelector((state) => state.auth)

  useEffect(() => {
    const fetchEmployee = async () => {
      if (!user || !user.employeeId) {
        setError('User data not available')
        setLoading(false)
        return
      }

      try {
        console.log('Fetching employee with ID:', user.employeeId)
        const response = await api.get(`/api/employees/${user.employeeId}`)
        setEmployee(response.data)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching employee data:', err)
        setError(err.response?.data?.message || err.message || 'Failed to fetch employee data')
        setLoading(false)
      }
    }

    fetchEmployee()
  }, [user])

  if (loading) return <div className="p-4">Loading...</div>
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>
  if (!employee) return <div className="p-4">No employee data found</div>

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">My Profile</h1>
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h2 className="text-lg font-semibold mb-2">Personal Information</h2>
            <p><span className="font-medium">Name:</span> {employee.name}</p>
            <p><span className="font-medium">Email:</span> {employee.email}</p>
            <p><span className="font-medium">Position:</span> {employee.position}</p>
            <p><span className="font-medium">Department:</span> {employee.department}</p>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-2">Employment Details</h2>
            <p><span className="font-medium">Joining Date:</span> {employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : 'N/A'}</p>
            <p><span className="font-medium">Salary:</span> ${employee.salary || 'N/A'}</p>
            <p><span className="font-medium">Status:</span> <span className={`px-2 py-1 rounded ${employee.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>{employee.status || 'N/A'}</span></p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile 