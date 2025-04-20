import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import axios from '../../utils/axios'
import { toast } from 'react-toastify'

const Performance = () => {
  const [reviews, setReviews] = useState([])
  const [employees, setEmployees] = useState([])
  const [teams, setTeams] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [newReview, setNewReview] = useState({
    employee: '',
    team: '',
    task: '',
    rating: 1,
    feedback: '',
    goals: '',
    strengths: '',
    areasForImprovement: ''
  })

  const { user } = useSelector((state) => state.auth)

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) {
        setError('User data not available')
        setLoading(false)
        return
      }

      try {
        console.log('Fetching data with user:', user.id)
        const [employeesRes, teamsRes, tasksRes, reviewsRes] = await Promise.all([
          axios.get('/api/employees'),
          axios.get('/api/teams'),
          axios.get('/api/tasks'),
          axios.get('/api/performance')
        ])
        setEmployees(employeesRes.data || [])
        setTeams(teamsRes.data || [])
        setTasks(tasksRes.data || [])
        setReviews(reviewsRes.data || [])
        setLoading(false)
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'Error fetching data'
        console.error('Error fetching data:', err)
        setError(errorMessage)
        setLoading(false)
        toast.error(errorMessage)
      }
    }

    fetchData()
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!user?.id) {
      const errorMessage = 'User data not available'
      setError(errorMessage)
      toast.error(errorMessage)
      return
    }

    try {
      const reviewData = {
        ...newReview,
        ratedBy: user.id
      }
      console.log('Submitting review:', reviewData)
      const response = await axios.post('/api/performance', reviewData)
      setReviews([...reviews, response.data])
      setNewReview({
        employee: '',
        team: '',
        task: '',
        rating: 1,
        feedback: '',
        goals: '',
        strengths: '',
        areasForImprovement: ''
      })
      document.getElementById('createReviewModal').close()
      toast.success('Performance review added successfully')
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error creating review'
      console.error('Error creating review:', err)
      setError(errorMessage)
      toast.error(errorMessage)
    }
  }

  if (loading) return <div className="text-center mt-8">Loading...</div>
  if (error) return <div className="text-center mt-8 text-red-500">{error}</div>

  return (
    <div className="container mx-auto px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Performance Reviews</h1>
        <button
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          onClick={() => document.getElementById('createReviewModal').showModal()}
        >
          Add Review
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
                Rating
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Feedback
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reviews.map((review) => (
              <tr key={review._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {review.employee?.name || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {review.employee?.email || 'N/A'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="text-sm text-gray-900 mr-2">
                      {review.rating}/5
                    </div>
                    <div className="w-24 bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-indigo-600 h-2.5 rounded-full"
                        style={{ width: `${(review.rating / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    {review.feedback}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'N/A'}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Review Modal */}
      <dialog id="createReviewModal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">Add Performance Review</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Employee</label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={newReview.employee}
                onChange={(e) => setNewReview({ ...newReview, employee: e.target.value })}
                required
              >
                <option value="">Select Employee</option>
                {employees.map((employee) => (
                  <option key={employee._id} value={employee._id}>
                    {employee.name} - {employee.position}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Team</label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={newReview.team}
                onChange={(e) => setNewReview({ ...newReview, team: e.target.value })}
                required
              >
                <option value="">Select Team</option>
                {teams.map((team) => (
                  <option key={team._id} value={team._id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Task</label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={newReview.task}
                onChange={(e) => setNewReview({ ...newReview, task: e.target.value })}
                required
              >
                <option value="">Select Task</option>
                {tasks.map((task) => (
                  <option key={task._id} value={task._id}>
                    {task.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Rating (1-5)</label>
              <input
                type="number"
                min="1"
                max="5"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={newReview.rating}
                onChange={(e) => setNewReview({ ...newReview, rating: parseInt(e.target.value) })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Feedback</label>
              <textarea
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={newReview.feedback}
                onChange={(e) => setNewReview({ ...newReview, feedback: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Goals</label>
              <textarea
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={newReview.goals}
                onChange={(e) => setNewReview({ ...newReview, goals: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Strengths</label>
              <textarea
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={newReview.strengths}
                onChange={(e) => setNewReview({ ...newReview, strengths: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Areas for Improvement</label>
              <textarea
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={newReview.areasForImprovement}
                onChange={(e) => setNewReview({ ...newReview, areasForImprovement: e.target.value })}
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                className="btn"
                onClick={() => document.getElementById('createReviewModal').close()}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Submit
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  )
}

export default Performance 