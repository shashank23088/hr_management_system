import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import api from '../../utils/axios'
import { FaMoneyBillWave } from 'react-icons/fa'

const Salary = () => {
  const [salaries, setSalaries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useSelector((state) => state.auth)

  useEffect(() => {
    const fetchSalary = async () => {
      if (!user || !user.id) {
        setError('User data not available')
        setLoading(false)
        return
      }

      try {
        // First, get the employee record
        const employeeResponse = await api.get(`/api/employees/user/${user.id}`);
        const employeeId = employeeResponse.data._id;

        console.log('Fetching salary for employee ID:', employeeId);
        const response = await api.get(`/api/salaries/employee/${employeeId}`);
        console.log('Salary API Response:', response.data);
        setSalaries(Array.isArray(response.data) ? response.data : []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching salary data:', err.response || err);
        const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch salary data';
        setError(errorMessage);
        setLoading(false);
      }
    }

    fetchSalary()
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg">
        <div className="text-red-600 font-medium text-center">{error}</div>
      </div>
    )
  }

  if (!salaries || salaries.length === 0) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg">
        <div className="text-gray-600 text-center">
          <FaMoneyBillWave className="mx-auto text-4xl mb-2 text-gray-400" />
          <p>No salary records found. Your salary information will appear here once it's been processed.</p>
        </div>
      </div>
    )
  }

  // Get the latest salary record
  const currentSalary = salaries[0]

  // Function to format currency
  const formatCurrency = (amount) => {
    return typeof amount === 'number' ? amount.toLocaleString() : amount;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">My Salary</h1>
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Current Total Salary</h2>
          <p className="text-4xl font-bold text-indigo-600">
            ${formatCurrency(Number(currentSalary.amount) + (Number(currentSalary.raise) || 0) + (Number(currentSalary.bonus) || 0))}
          </p>
          <p className="text-gray-600">Total Compensation</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
          <div>
            <h2 className="text-lg font-semibold mb-2">Base Salary</h2>
            <div className="flex flex-col">
              <p className="text-2xl font-bold text-gray-700">
                ${formatCurrency(currentSalary.amount)}
              </p>
              {currentSalary.raise > 0 && (
                <div className="mt-2">
                  <p className="text-lg font-semibold text-green-600">
                    +${formatCurrency(Number(currentSalary.raise))}
                  </p>
                  <p className="text-sm text-green-600">
                    Raise: {currentSalary.raiseReason}
                  </p>
                </div>
              )}
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-2">Bonus</h2>
            <p className="text-2xl font-bold text-green-600">
              ${formatCurrency(Number(currentSalary.bonus) || 0)}
            </p>
            {currentSalary.bonusReason && (
              <p className="text-sm text-gray-600 mt-1">
                {currentSalary.bonusReason}
              </p>
            )}
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-2">Payment History</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left text-gray-600">Date</th>
                  <th className="px-4 py-2 text-left text-gray-600">Base Salary</th>
                  <th className="px-4 py-2 text-left text-gray-600">Raise</th>
                  <th className="px-4 py-2 text-left text-gray-600">Bonus</th>
                  <th className="px-4 py-2 text-left text-gray-600">Total</th>
                  <th className="px-4 py-2 text-left text-gray-600">Details</th>
                </tr>
              </thead>
              <tbody>
                {salaries.map((salary) => (
                  <tr key={salary._id} className="border-t">
                    <td className="px-4 py-2">
                      {salary.date ? new Date(salary.date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-4 py-2">
                      ${formatCurrency(salary.amount)}
                    </td>
                    <td className="px-4 py-2 text-green-600">
                      {salary.raise > 0 ? `+$${formatCurrency(Number(salary.raise))}` : '-'}
                    </td>
                    <td className="px-4 py-2">
                      ${formatCurrency(Number(salary.bonus) || 0)}
                    </td>
                    <td className="px-4 py-2 font-semibold">
                      ${formatCurrency(Number(salary.amount) + (Number(salary.raise) || 0) + (Number(salary.bonus) || 0))}
                    </td>
                    <td className="px-4 py-2">
                      {[
                        salary.raise > 0 ? `Raise: ${salary.raiseReason}` : null,
                        salary.bonusReason
                      ].filter(Boolean).join(', ') || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Salary