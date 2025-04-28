import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaComment, FaEye } from 'react-icons/fa';
import axios from '../../utils/axios';
import { toast } from 'react-toastify';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignedTo: '',
    team: '',
    priority: 'low',
    dueDate: '',
    status: 'pending'
  });
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [availableTeams, setAvailableTeams] = useState([]);
  const [availableTasks, setAvailableTasks] = useState([]);

  useEffect(() => {
    fetchTasks();
    fetchEmployees();
    fetchTeams();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get('/api/tasks');
      setTasks(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching tasks');
      setLoading(false);
      toast.error('Failed to fetch tasks');
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('/api/employees');
      setEmployees(response.data);
    } catch (err) {
      toast.error('Failed to fetch employees');
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await axios.get('/api/teams');
      setTeams(response.data);
    } catch (err) {
      toast.error('Failed to fetch teams');
    }
  };

  const fetchEmployeeTeams = async (employeeId) => {
    try {
      setTeamsLoading(true);
      console.log('Fetching teams for employee ID:', employeeId);
      
      const response = await axios.get(`/api/teams/employee/${employeeId}`);
      console.log('Raw API response:', response);
      
      if (response.data) {
        if (Array.isArray(response.data)) {
          console.log('Teams data received:', response.data);
          setAvailableTeams(response.data);
          
          if (response.data.length === 0) {
            console.log('No teams found for employee');
            toast.warning('No teams assigned to this employee');
          }
        } else {
          console.error('Unexpected response format:', response.data);
          setAvailableTeams([]);
          toast.error('Invalid team data format received');
        }
      } else {
        console.error('No data in response');
        setAvailableTeams([]);
        toast.error('No data received from server');
      }
    } catch (err) {
      console.error('Error fetching employee teams:', err);
      console.error('Error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data
      });
      setAvailableTeams([]);
      toast.error(err.response?.data?.message || 'Failed to fetch employee teams');
    } finally {
      setTeamsLoading(false);
    }
  };

  const fetchTeamTasks = async (teamId) => {
    try {
      // Clear previous tasks when team changes
      setAvailableTasks([]);
      setNewTask(prev => ({ ...prev, task: '' }));

      const response = await axios.get(`/api/teams/${teamId}/tasks`);
      if (response.data && Array.isArray(response.data)) {
        setAvailableTasks(response.data);
        console.log('Fetched tasks for team:', response.data);
      } else {
        console.error('Invalid tasks data format:', response.data);
        toast.error('Failed to fetch team tasks: Invalid data format');
      }
    } catch (err) {
      console.error('Failed to fetch team tasks:', err);
      toast.error(err.response?.data?.message || 'Failed to fetch team tasks');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTask) {
        await axios.put(`/api/tasks/${editingTask._id}`, newTask);
        toast.success('Task updated successfully');
      } else {
        await axios.post('/api/tasks', newTask);
        toast.success('Task created successfully');
      }
      setShowModal(false);
      setEditingTask(null);
      setNewTask({
        title: '',
        description: '',
        assignedTo: '',
        team: '',
        priority: 'low',
        dueDate: '',
        status: 'pending'
      });
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving task');
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setNewTask({
      title: task.title,
      description: task.description,
      assignedTo: task.assignedTo._id,
      team: task.team._id,
      priority: task.priority,
      dueDate: task.dueDate.split('T')[0],
      status: task.status
    });
    setShowModal(true);
  };

  const handleDelete = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await axios.delete(`/api/tasks/${taskId}`);
        toast.success('Task deleted successfully');
        fetchTasks();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Error deleting task');
      }
    }
  };

  const handleViewComments = async (task) => {
    try {
      const response = await axios.get(`/api/tasks/${task._id}`);
      setSelectedTask(response.data);
      setShowCommentsModal(true);
    } catch (err) {
      toast.error('Failed to load comments');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await axios.post(`/api/tasks/${selectedTask._id}/comments`, {
        comment: newComment.trim()
      });
      
      setTasks(tasks.map(task => 
        task._id === selectedTask._id ? response.data : task
      ));
      
      setSelectedTask(response.data);
      setNewComment('');
      toast.success('Comment added successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add comment');
    }
  };

  if (loading) return <div className="text-center mt-8">Loading...</div>;
  if (error) return <div className="text-center mt-8 text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Tasks Management</h1>
        <button
          onClick={() => {
            setEditingTask(null);
            setNewTask({
              title: '',
              description: '',
              assignedTo: '',
              team: '',
              priority: 'low',
              dueDate: '',
              status: 'pending'
            });
            setShowModal(true);
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <FaPlus /> Add Task
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left">Title</th>
              <th className="px-6 py-3 text-left">Assigned To</th>
              <th className="px-6 py-3 text-left">Team</th>
              <th className="px-6 py-3 text-left">Priority</th>
              <th className="px-6 py-3 text-left">Due Date</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Comments</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task._id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4">{task.title}</td>
                <td className="px-6 py-4">{task.assignedTo?.name || 'N/A'}</td>
                <td className="px-6 py-4">{task.team?.name || 'N/A'}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    task.priority === 'high' ? 'bg-red-100 text-red-800' :
                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {task.priority}
                  </span>
                </td>
                <td className="px-6 py-4">{new Date(task.dueDate).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    task.status === 'completed' ? 'bg-green-100 text-green-800' :
                    task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {task.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleViewComments(task)}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                  >
                    <FaComment />
                    <span>{task.comments?.length || 0}</span>
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(task)}
                      className="text-blue-500 hover:text-blue-700"
                      title="Edit Task"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(task._id)}
                      className="text-red-500 hover:text-red-700"
                      title="Delete Task"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
            <h2 className="text-xl font-semibold mb-4">
              {editingTask ? 'Edit Task' : 'Add New Task'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Employee</label>
                  <select
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={newTask.assignedTo}
                    onChange={(e) => {
                      const employeeId = e.target.value;
                      setNewTask({ 
                        ...newTask, 
                        assignedTo: employeeId,
                        team: '', // Reset team when employee changes
                        task: ''  // Reset task when employee changes
                      });
                      if (employeeId) {
                        fetchEmployeeTeams(employeeId);
                      } else {
                        setAvailableTeams([]);
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
                  <label className="block text-sm font-medium text-gray-700">Team</label>
                  <select
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={newTask.team}
                    onChange={(e) => {
                      const teamId = e.target.value;
                      setNewTask({ 
                        ...newTask, 
                        team: teamId,
                        task: '' // Reset task when team changes
                      });
                    }}
                    required
                    disabled={!newTask.assignedTo || teamsLoading}
                  >
                    <option value="">Select Team</option>
                    {availableTeams.map((team) => (
                      <option key={team._id} value={team._id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                  {teamsLoading && (
                    <p className="mt-1 text-sm text-blue-500">Loading teams...</p>
                  )}
                  {!teamsLoading && newTask.assignedTo && availableTeams.length === 0 && (
                    <p className="mt-1 text-sm text-yellow-500">No teams assigned to this employee</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full p-2 border rounded"
                  rows="3"
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={newTask.status}
                    onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {editingTask ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCommentsModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">
                Comments for Task: {selectedTask.title}
              </h2>
              <button
                onClick={() => {
                  setShowCommentsModal(false);
                  setSelectedTask(null);
                  setNewComment('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto mb-6">
              {selectedTask.comments?.length > 0 ? (
                selectedTask.comments.map((comment) => (
                  <div key={comment._id} className="bg-gray-50 p-4 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">
                        By: {comment.user?.name || comment.user?.email || 'Unknown User'}
                      </p>
                      <p className="text-sm text-gray-400">
                        {new Date(comment.createdAt).toLocaleString()}
                      </p>
                      <p className="mt-2 text-gray-800">{comment.text}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500">No comments yet</p>
              )}
            </div>

            <form onSubmit={handleAddComment}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add a Comment
                </label>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows="3"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCommentsModal(false);
                    setNewComment('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                >
                  Add Comment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks; 