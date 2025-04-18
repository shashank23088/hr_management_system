import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setEmployees, setLoading, setError } from '../../redux/slices/employeeSlice'
import axios from 'axios'

const Employees = () => {
  const dispatch = useDispatch()
  const { employees, loading, error } = useSelector((state) => state.employees)
  const { token } = useSelector((state) => state.auth)

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        dispatch(setLoading())
        const response = await axios.get('/api/employees', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        dispatch(setEmployees(response.data))
      } catch (err) {
        dispatch(setError(err.response?.data?.message || err.message))
      }
    }

    fetchEmployees()
  }, [dispatch, token])

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
      <h1 className="text-2xl font-bold mb-4">Employees</h1>
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
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {employees && employees.map((employee) => (
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
                  <div className="text-sm text-gray-500">{employee.team?.name || 'N/A'}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Employees 