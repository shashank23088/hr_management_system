import React, { useEffect, useState } from 'react';
import api from '../../utils/axios';
import { toast } from 'react-toastify';
import { FaComment, FaTrash } from 'react-icons/fa';
import Modal from '../../components/Modal';
import { formatDate } from '../../utils/dateUtils';

const Leaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [approvalModal, setApprovalModal] = useState({ show: false, leave: null });
  const [approvalNotes, setApprovalNotes] = useState('');
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [statusModal, setStatusModal] = useState(false);
  const [commentModal, setCommentModal] = useState(false);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      const response = await api.get('/api/leaves');
      setLeaves(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch leaves:', err);
      setError(err.response?.data?.message || 'Failed to fetch leaves');
      setLoading(false);
    }
  };

  const handleApproval = async (status) => {
    try {
      const response = await api.put(`/api/leaves/${approvalModal.leave._id}/status`, {
        status,
        approvalNotes
      });

      setLeaves(leaves.map(leave => 
        leave._id === response.data._id ? response.data : leave
      ));

      setApprovalModal({ show: false, leave: null });
      setApprovalNotes('');
      toast.success(`Leave request ${status}`);
    } catch (err) {
      console.error('Failed to update leave status:', err);
      toast.error(err.response?.data?.message || 'Failed to update leave status');
    }
  };

  const handleViewComments = async (leave) => {
    try {
      const response = await api.get(`/api/leaves/${leave._id}`);
      setSelectedLeave(response.data);
      setCommentModal(true);
    } catch (error) {
      toast.error('Error fetching leave details');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await api.post(`/api/leaves/${selectedLeave._id}/comments`, {
        text: newComment
      });

      setLeaves(leaves.map(leave => 
        leave._id === response.data._id ? response.data : leave
      ));
      setSelectedLeave(response.data);
      setNewComment('');
      toast.success('Comment added successfully');
    } catch (error) {
      toast.error('Error adding comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const response = await api.delete(`/api/leaves/${selectedLeave._id}/comments/${commentId}`);
      
      setLeaves(leaves.map(leave => 
        leave._id === response.data._id ? response.data : leave
      ));
      setSelectedLeave(response.data);
      toast.success('Comment deleted successfully');
    } catch (error) {
      toast.error('Error deleting comment');
    }
  };

  const handleDeleteLeave = async (leaveId) => {
    if (!window.confirm('Are you sure you want to delete this leave request?')) return;

    try {
      await api.delete(`/api/leaves/${leaveId}`);
      setLeaves(leaves.filter(leave => leave._id !== leaveId));
      toast.success('Leave request deleted successfully');
    } catch (error) {
      toast.error('Error deleting leave request');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const filteredLeaves = leaves.filter(leave => {
    if (filter === 'all') return true;
    return leave.status === filter;
  });

  if (loading) return <div className="p-4 text-center">Loading leaves...</div>;
  if (error) return <div className="p-4 text-red-500 text-center">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Leave Management</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2"
        >
          <option value="all">All Requests</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comments</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLeaves.map((leave) => (
                <tr key={leave._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {leave.employee?.name || 'Unknown'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {leave.employee?.email || 'No email'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {leave.type.charAt(0).toUpperCase() + leave.type.slice(1)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(leave.startDate)}
                    </div>
                    <div className="text-sm text-gray-500">
                      to {formatDate(leave.endDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{leave.reason}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(leave.status)}`}>
                      {leave.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleViewComments(leave)}
                      className="text-indigo-600 hover:text-indigo-900 flex items-center"
                    >
                      <FaComment className="mr-1" />
                      {leave.comments?.length || 0}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {leave.status === 'pending' && (
                      <button
                        onClick={() => {
                          setSelectedLeave(leave);
                          setStatusModal(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Update Status
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteLeave(leave._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approval Modal */}
      {approvalModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Review Leave Request</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  rows="3"
                  placeholder="Add any notes about your decision (optional)"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setApprovalModal({ show: false, leave: null })}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleApproval('rejected')}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleApproval('approved')}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      <Modal
        isOpen={statusModal}
        onClose={() => {
          setStatusModal(false);
          setApprovalNotes('');
        }}
        title="Update Leave Status"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              rows="3"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => handleApproval('approved')}
              className="inline-flex justify-center rounded-md border border-transparent bg-green-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Approve
            </button>
            <button
              onClick={() => handleApproval('rejected')}
              className="inline-flex justify-center rounded-md border border-transparent bg-red-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Reject
            </button>
          </div>
        </div>
      </Modal>

      {/* Comments Modal */}
      <Modal
        isOpen={commentModal}
        onClose={() => {
          setCommentModal(false);
          setNewComment('');
        }}
        title="Leave Comments"
      >
        <div className="space-y-4">
          {/* Add Comment Form */}
          <form onSubmit={handleAddComment} className="space-y-2">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              rows="2"
            />
            <button
              type="submit"
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Add Comment
            </button>
          </form>

          {/* Comments List */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {selectedLeave?.comments?.map(comment => (
              <div key={comment._id} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-600">
                      By: {comment.user?.name || comment.user?.email}
                    </p>
                    <p className="mt-1">{comment.text}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(comment.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteComment(comment._id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Leaves; 