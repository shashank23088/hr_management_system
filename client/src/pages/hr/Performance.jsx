import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import axios from '../../utils/axios'
import { toast } from 'react-toastify'

const Performance = () => {
  const [reviews, setReviews] = useState([])
  const [employees, setEmployees] = useState([])
  const [employeeTasks, setEmployeeTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [tasksLoading, setTasksLoading] = useState(false)
  const [error, setError] = useState(null)
  const [newReview, setNewReview] = useState({
    employee: '',
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
        const [employeesRes, tasksRes, reviewsRes] = await Promise.all([
          axios.get('/api/employees'),
          axios.get('/api/tasks'),
          axios.get('/api/performance')
        ])
        setEmployees(employeesRes.data || [])
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

  const fetchEmployeeTasks = async (employeeId) => {
    try {
      setTasksLoading(true);
      console.log('Fetching tasks for employee ID:', employeeId);
      
      const response = await axios.get(`/api/tasks/employee/${employeeId}`);
      console.log('Raw API response:', response);
      
      if (response.data && Array.isArray(response.data)) {
        console.log('Tasks data received:', response.data);
        // Filter out tasks that already have reviews
        const availableTasks = response.data.filter(task => 
          !reviews.some(review => review.task?._id === task._id)
        );
        setEmployeeTasks(availableTasks);
        
        if (availableTasks.length === 0) {
          console.log('No available tasks for employee');
          toast.warning('No available tasks for this employee');
        }
      } else {
        console.error('Unexpected response format:', response.data);
        setEmployeeTasks([]);
        toast.error('Invalid task data format received');
      }
    } catch (err) {
      console.error('Error fetching employee tasks:', err);
      console.error('Error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data
      });
      setEmployeeTasks([]);
      toast.error(err.response?.data?.message || 'Failed to fetch employee tasks');
    } finally {
      setTasksLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!user?.id) {
      const errorMessage = 'User data not available'
      setError(errorMessage)
      toast.error(errorMessage)
      return
    }

    const selectedTask = employeeTasks.find(task => task._id === newReview.task);
    if (!selectedTask) {
      toast.error('Please select a valid task');
      return;
    }

    try {
      const reviewData = {
        ...newReview,
        team: selectedTask.team._id, // Get team ID from the selected task
        ratedBy: user.id
      }
      console.log('Submitting review:', reviewData)
      const response = await axios.post('/api/performance', reviewData)
      setReviews([...reviews, response.data])
      setNewReview({
        employee: '',
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Performance Reviews</h1>
        <button
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors duration-200 flex items-center gap-2"
          onClick={() => document.getElementById('createReviewModal').showModal()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Review
        </button>
      </div>

      <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Task
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Feedback
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reviews.map((review) => (
                <tr key={review._id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {review.employee?.name || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {review.employee?.email || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 font-medium">
                      {review.task?.title || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {review.team?.name || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${review.rating >= 4 ? 'bg-green-100 text-green-800' :
                          review.rating >= 3 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'}`}>
                        {review.rating}/5
                      </span>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            review.rating >= 4 ? 'bg-green-500' :
                            review.rating >= 3 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${(review.rating / 5) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-h-20 overflow-y-auto bg-gray-50 rounded-lg p-3">
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
      </div>

      {/* Create Review Modal */}
      <dialog id="createReviewModal" className="modal max-w-3xl w-full p-0 rounded-xl shadow-xl">
        <div className="bg-white rounded-xl">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">Add Performance Review</h3>
          </div>
          
          <div className="p-6 max-h-[80vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Employee</label>
                  <select
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={newReview.employee}
                    onChange={(e) => {
                      const employeeId = e.target.value;
                      setNewReview({ 
                        ...newReview, 
                        employee: employeeId,
                        task: ''
                      });
                      if (employeeId) {
                        fetchEmployeeTasks(employeeId);
                      } else {
                        setEmployeeTasks([]);
                      }
                    }}
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
                  <label className="block text-sm font-medium text-gray-700">Task & Team</label>
                  <select
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={newReview.task}
                    onChange={(e) => setNewReview({ ...newReview, task: e.target.value })}
                    required
                    disabled={!newReview.employee || tasksLoading}
                  >
                    <option value="">Select Task</option>
                    {employeeTasks.map((task) => (
                      <option key={task._id} value={task._id}>
                        {task.title} ({task.team?.name || 'No Team'})
                      </option>
                    ))}
                  </select>
                  {tasksLoading && (
                    <p className="mt-1 text-sm text-blue-500">Loading tasks...</p>
                  )}
                  {!tasksLoading && newReview.employee && employeeTasks.length === 0 && (
                    <p className="mt-1 text-sm text-yellow-500">No available tasks for this employee</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Rating</label>
                <div className="mt-1 flex items-center space-x-4">
                  <div className="flex-1 relative">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                      value={newReview.rating}
                      onChange={(e) => setNewReview({ ...newReview, rating: parseInt(e.target.value) })}
                      required
                      style={{
                        background: `linear-gradient(to right, ${
                          newReview.rating >= 4 ? '#10B981' :  // emerald-500
                          newReview.rating >= 3 ? '#F59E0B' :  // amber-500
                          '#DC2626'                            // red-600
                        } ${((newReview.rating - 1) / 4) * 100}%, #E5E7EB ${((newReview.rating - 1) / 4) * 100}%)`,
                        height: '8px',
                        borderRadius: '9999px'
                      }}
                    />
                    <div className="absolute -bottom-6 left-0 right-0 flex justify-between">
                      <span className="text-sm text-gray-600">Poor</span>
                      <span className="text-sm text-gray-600">Excellent</span>
                    </div>
                  </div>
                  <span className={`text-sm font-medium px-2 py-1 rounded ${
                    newReview.rating >= 4 ? 'bg-emerald-100 text-emerald-800' :
                    newReview.rating >= 3 ? 'bg-amber-100 text-amber-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {newReview.rating}/5
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Feedback</label>
                <textarea
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={newReview.feedback}
                  onChange={(e) => setNewReview({ ...newReview, feedback: e.target.value })}
                  required
                  rows="4"
                  placeholder="Provide detailed feedback about the employee's performance on this task..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Goals</label>
                <textarea
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={newReview.goals}
                  onChange={(e) => setNewReview({ ...newReview, goals: e.target.value })}
                  required
                  rows="3"
                  placeholder="Set specific goals for future improvement..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Strengths</label>
                  <textarea
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={newReview.strengths}
                    onChange={(e) => setNewReview({ ...newReview, strengths: e.target.value })}
                    required
                    rows="3"
                    placeholder="List key strengths demonstrated..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Areas for Improvement</label>
                  <textarea
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={newReview.areasForImprovement}
                    onChange={(e) => setNewReview({ ...newReview, areasForImprovement: e.target.value })}
                    required
                    rows="3"
                    placeholder="Identify areas that need improvement..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={() => document.getElementById('createReviewModal').close()}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      </dialog>
    </div>
  )
}

export default Performance 