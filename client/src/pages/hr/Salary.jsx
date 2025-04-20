import { useEffect, useState } from 'react'
import axios from '../../utils/axios'
import { toast } from 'react-toastify'
import { FaEdit, FaTrash } from 'react-icons/fa'

const Salary = () => {
  const [salaries, setSalaries] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editingSalary, setEditingSalary] = useState(null)
  const [formData, setFormData] = useState({
    employee: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    raise: '',
    raiseReason: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [salariesRes, employeesRes] = await Promise.all([
        axios.get('/api/salaries'),
        axios.get('/api/employees')
      ])
      setSalaries(salariesRes.data)
      setEmployees(employeesRes.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching data')
      toast.error(err.response?.data?.message || 'Error fetching data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const dataToSubmit = {
        ...formData,
        raise: formData.raise || undefined,
        raiseReason: formData.raiseReason || undefined
      }

      if (editingSalary) {
        const response = await axios.put(`/api/salaries/${editingSalary._id}`, dataToSubmit)
        setSalaries(salaries.map(s => s._id === response.data._id ? response.data : s))
        toast.success('Salary record updated')
      } else {
        const response = await axios.post('/api/salaries', dataToSubmit)
        setSalaries([response.data, ...salaries])
        toast.success('Salary record added')
      }
      handleCloseModal()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving salary record')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this salary record?')) return

    try {
      await axios.delete(`/api/salaries/${id}`)
      setSalaries(salaries.filter(s => s._id !== id))
      toast.success('Salary record deleted')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting salary record')
    }
  }

  const handleEdit = (salary) => {
    setEditingSalary(salary)
    setFormData({
      employee: salary.employee._id,
      amount: salary.amount,
      date: new Date(salary.date).toISOString().split('T')[0],
      raise: salary.raise || '',
      raiseReason: salary.raiseReason || ''
    })
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingSalary(null)
    setFormData({
      employee: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      raise: '',
      raiseReason: ''
    })
  }

  const formatRaise = (raise, reason) => {
    if (!raise) return null;
    return (
      <div className="text-sm">
        <span className={raise > 0 ? 'text-green-600' : 'text-red-600'}>
          {raise > 0 ? '+' : ''}{Number(raise).toLocaleString()}
        </span>
        {reason && (
          <span className="text-gray-500 ml-2">({reason})</span>
        )}
      </div>
    );
  };

  if (loading) return <div className="text-center mt-8">Loading...</div>
  if (error) return <div className="text-center mt-8 text-red-500">{error}</div>

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Salary Management</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add Salary
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Raise</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {salaries.map((salary) => (
              <tr key={salary._id}>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{salary.employee?.name}</div>
                  <div className="text-xs text-gray-500">{salary.employee?.position}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">${Number(salary.amount).toLocaleString()}</div>
                </td>
                <td className="px-6 py-4">
                  {formatRaise(salary.raise, salary.raiseReason)}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{new Date(salary.date).toLocaleDateString()}</div>
                </td>
                <td className="px-6 py-4 space-x-3">
                  <button onClick={() => handleEdit(salary)} className="text-blue-600 hover:text-blue-900">
                    <FaEdit className="inline" />
                  </button>
                  <button onClick={() => handleDelete(salary._id)} className="text-red-600 hover:text-red-900">
                    <FaTrash className="inline" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal for Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">
              {editingSalary ? 'Edit Salary Record' : 'Add Salary Record'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Employee</label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  value={formData.employee}
                  onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
                  required
                  disabled={editingSalary}
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} - {emp.position}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount</label>
                <input
                  type="number"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Raise Amount
                  <span className="text-xs text-gray-500 ml-1">(optional)</span>
                </label>
                <input
                  type="number"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  value={formData.raise}
                  onChange={(e) => setFormData({ ...formData, raise: e.target.value })}
                  placeholder="Enter raise amount"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Reason for Raise
                  <span className="text-xs text-gray-500 ml-1">(optional)</span>
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  value={formData.raiseReason}
                  onChange={(e) => setFormData({ ...formData, raiseReason: e.target.value })}
                  placeholder="e.g., Annual raise, Performance bonus"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  {editingSalary ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Salary 