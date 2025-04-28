import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import api from '../../utils/axios';
import toast, { Toaster } from 'react-hot-toast';
import { FaComment, FaTrash } from 'react-icons/fa';

const Tasks = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [commentModal, setCommentModal] = useState({ show: false, taskId: null, mode: 'add' });
  const [comment, setComment] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!user || !user.id) {
        setError('User data not available');
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching tasks for user:', user);
        const response = await api.get(`/api/tasks/employee/${user.id}`);
        console.log('Tasks response:', response.data);
        
        if (Array.isArray(response.data)) {
          setTasks(response.data);
        } else {
          console.warn('Unexpected response format:', response.data);
          setTasks([]);
        }
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch tasks:', err.response || err);
        setError(
          err.response?.data?.message || 
          err.message || 
          'Failed to fetch tasks'
        );
        setLoading(false);
      }
    };

    fetchTasks();
  }, [user]);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task._id === taskId ? { ...task, status: newStatus, loading: true } : task
        )
      );

      console.log('Updating task status:', { taskId, newStatus });
      const response = await api.put(`/api/tasks/${taskId}/status`, { status: newStatus });
      
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task._id === taskId ? { ...response.data, loading: false } : task
        )
      );

      toast.success('Task status updated successfully');
    } catch (err) {
      console.error('Failed to update task status:', err.response || err);
      
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task._id === taskId ? { ...task, status: task.status, loading: false } : task
        )
      );
      
      toast.error(err.response?.data?.message || 'Failed to update task status');
    }
  };

  const handleViewComments = async (task) => {
    try {
      const response = await api.get(`/api/tasks/${task._id}`);
      setSelectedTask(response.data);
      setCommentModal({ show: true, taskId: task._id, mode: 'view' });
    } catch (err) {
      toast.error('Failed to load comments');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task._id === commentModal.taskId ? { ...task, commentLoading: true } : task
        )
      );

      const response = await api.post(`/api/tasks/${commentModal.taskId}/comments`, { 
        comment: comment.trim() 
      });
      
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task._id === commentModal.taskId ? { ...response.data, commentLoading: false } : task
        )
      );
      
      setSelectedTask(response.data);
      setComment('');
      toast.success('Comment added successfully');
    } catch (err) {
      console.error('Failed to add comment:', err.response || err);
      
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task._id === commentModal.taskId ? { ...task, commentLoading: false } : task
        )
      );
      
      toast.error(err.response?.data?.message || 'Failed to add comment');
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.status === filter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  if (error) return (
    <div className="p-4 text-center">
      <div className="text-red-500 mb-2">{error}</div>
      <button 
        onClick={() => window.location.reload()}
        className="text-blue-600 hover:text-blue-800 underline"
      >
        Try Again
      </button>
    </div>
  );

  if (tasks.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Tasks</h1>
        </div>
        <div className="bg-white shadow-md rounded-lg p-8 text-center">
          <div className="text-gray-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks assigned</h3>
          <p className="text-gray-500">You currently don't have any tasks assigned to you.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Toaster position="top-right" />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Tasks</h1>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="all">All Tasks</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Due Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Comments
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTasks.map((task) => (
              <tr key={task._id || Math.random().toString()}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {task.title || 'Untitled Task'}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{task.description || 'No description'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not set'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(task.status)}`}>
                    {task.status ? task.status.replace('_', ' ').toUpperCase() : 'PENDING'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleViewComments(task)}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                  >
                    <FaComment />
                    <span>{task.comments?.length || 0}</span>
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <select
                    value={task.status || 'pending'}
                    onChange={(e) => handleStatusChange(task._id, e.target.value)}
                    disabled={task.loading}
                    className={`mr-2 rounded-md border border-gray-300 px-2 py-1 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                      task.loading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                  {task.loading && (
                    <span className="ml-2 inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></span>
                  )}
                  <button
                    onClick={() => {
                      setSelectedTask(task);
                      setCommentModal({ show: true, taskId: task._id, mode: 'add' });
                    }}
                    className="text-indigo-600 hover:text-indigo-900 ml-2"
                  >
                    Add Comment
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Comment Modal */}
      {commentModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">
                {commentModal.mode === 'add' ? 'Add Comment' : 'Comments'} - {selectedTask?.title}
              </h2>
              <button
                onClick={() => {
                  setCommentModal({ show: false, taskId: null, mode: 'add' });
                  setComment('');
                  setSelectedTask(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            {/* Comments List */}
            {commentModal.mode === 'view' && (
              <div className="mb-6 space-y-4">
                {selectedTask?.comments?.length > 0 ? (
                  selectedTask.comments.map((comment) => (
                    <div key={comment._id} className="bg-gray-50 p-4 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-600">
                          By: {comment.user?.name || comment.user?.email || 'Unknown User'}
                        </p>
                        <p className="text-sm text-gray-400">
                          {new Date(comment.createdAt).toLocaleString()}
                        </p>
                        <p className="mt-2">{comment.text}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500">No comments yet</p>
                )}
              </div>
            )}

            {/* Add Comment Form */}
            {(commentModal.mode === 'add' || commentModal.mode === 'view') && (
              <form onSubmit={handleAddComment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Add a Comment
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    rows="4"
                    required
                    disabled={tasks.find(t => t._id === commentModal.taskId)?.commentLoading}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={tasks.find(t => t._id === commentModal.taskId)?.commentLoading}
                  >
                    {tasks.find(t => t._id === commentModal.taskId)?.commentLoading ? (
                      <span className="flex items-center">
                        <span className="mr-2">Submitting</span>
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                      </span>
                    ) : (
                      'Add Comment'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks; 