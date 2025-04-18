import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import api from '../../utils/axios'

const Salary = () => {
  const [salary, setSalary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useSelector((state) => state.auth)

  useEffect(() => {
    const fetchSalary = async () => {
      if (!user || !user.employeeId) {
        setError('User data not available')
        setLoading(false)
        return
      }

      try {
        console.log('Fetching salary for employee ID:', user.employeeId)
        const response = await api.get(`/api/salaries/employee/${user.employeeId}`)
        setSalary(response.data)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching salary data:', err)
        setError(err.response?.data?.message || err.message || 'Failed to fetch salary data')
        setLoading(false)
      }
    }

    fetchSalary()
  }, [user])

  if (loading) return <div className="p-4">Loading salary information...</div>
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>
  if (!salary) return <div className="p-4">No salary data found</div>

  // Create a safe render function to handle potential missing properties
  const renderSalaryDetails = () => {
    // If salary data structure is not as expected, show a simpler view
    if (!salary.amount) {
      return (
        <div className="bg-white shadow-md rounded-lg p-6">
          <p>Salary information is incomplete or unavailable.</p>
        </div>
      )
    }

    return (
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h2 className="text-lg font-semibold mb-2">Salary Details</h2>
            <p className="text-3xl font-bold text-indigo-600">
              ${typeof salary.amount === 'number' ? salary.amount.toLocaleString() : salary.amount}
            </p>
            <p className="text-gray-600">Base Salary</p>
          </div>
          {salary.bonus > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Bonus</h2>
              <p className="text-2xl font-bold text-green-600">
                +${typeof salary.bonus === 'number' ? salary.bonus.toLocaleString() : salary.bonus}
              </p>
              <p className="text-gray-600">{salary.bonusReason || 'Performance bonus'}</p>
            </div>
          )}
        </div>
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Payment History</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Amount</th>
                  <th className="px-4 py-2 text-left">Bonus</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2">
                    {salary.date ? new Date(salary.date).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-4 py-2">
                    ${typeof salary.amount === 'number' ? salary.amount.toLocaleString() : salary.amount}
                  </td>
                  <td className="px-4 py-2">
                    {salary.bonus > 0 ? `$${typeof salary.bonus === 'number' ? salary.bonus.toLocaleString() : salary.bonus}` : '-'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">My Salary</h1>
      {renderSalaryDetails()}
    </div>
  )
}

export default Salary 