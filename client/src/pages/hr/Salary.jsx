import { useEffect, useState } from 'react'
import axios from '../../utils/axios'
import { toast } from 'react-toastify'

const Salary = () => {
  const [salaries, setSalaries] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [newSalary, setNewSalary] = useState({
    employee: '',
    amount: '',
    bonus: '',
    bonusReason: '',
    date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [salariesRes, employeesRes] = await Promise.all([
          axios.get('/api/salaries'),
          axios.get('/api/employees')
        ])
        setSalaries(salariesRes.data || [])
        setEmployees(employeesRes.data || [])
        setLoading(false)
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching data')
        setLoading(false)
        toast.error(err.response?.data?.message || 'Error fetching data')
      }
    }

    fetchData()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await axios.post('/api/salaries', newSalary)
      setSalaries([...salaries, response.data])
      setNewSalary({
        employee: '',
        amount: '',
        bonus: '',
        bonusReason: '',
        date: new Date().toISOString().split('T')[0]
      })
      document.getElementById('createSalaryModal').close()
      toast.success('Salary record added successfully')
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating salary record')
      toast.error(err.response?.data?.message || 'Error creating salary record')
    }
  }

  if (loading) return <div className="text-center mt-8">Loading...</div>
  if (error) return <div className="text-center mt-8 text-red-500">{error}</div>

  return (
    <div className="container mx-auto px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Salary Management</h1>
        <button
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          onClick={() => document.getElementById('createSalaryModal').showModal()}
        >
          Add Salary
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Employee
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bonus
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {salaries.map((salary) => (
              <tr key={salary._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {salary.employee?.name || 'N/A'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    ${Number(salary.amount).toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {salary.bonus > 0 ? `$${Number(salary.bonus).toLocaleString()}` : '-'}
                    {salary.bonusReason && (
                      <span className="text-xs text-gray-400 ml-2">({salary.bonusReason})</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {new Date(salary.date).toLocaleDateString()}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Salary Modal */}
      <dialog id="createSalaryModal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">Add New Salary</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Employee</label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={newSalary.employee}
                onChange={(e) => setNewSalary({ ...newSalary, employee: e.target.value })}
                required
              >
                <option value="">Select Employee</option>
                {employees.map(employee => (
                  <option key={employee._id} value={employee._id}>
                    {employee.name} - {employee.position}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount</label>
              <input
                type="number"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={newSalary.amount}
                onChange={(e) => setNewSalary({ ...newSalary, amount: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Bonus</label>
              <input
                type="number"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={newSalary.bonus}
                onChange={(e) => setNewSalary({ ...newSalary, bonus: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Bonus Reason</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={newSalary.bonusReason}
                onChange={(e) => setNewSalary({ ...newSalary, bonusReason: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={newSalary.date}
                onChange={(e) => setNewSalary({ ...newSalary, date: e.target.value })}
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                className="btn"
                onClick={() => document.getElementById('createSalaryModal').close()}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Add
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  )
}

export default Salary 