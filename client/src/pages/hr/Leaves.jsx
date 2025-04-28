import React, { useEffect, useState } from 'react';
import api from '../../utils/axios';
import { toast } from 'react-toastify';
import { FaComment, FaCheck, FaTimes } from 'react-icons/fa';
import { formatDate } from '../../utils/dateUtils';

const Leaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
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
      const response = await api.put(`/api/leaves/${selectedLeave._id}/status`, {
        status,
        approvalNotes
      });

      setLeaves(leaves.map(leave => 
        leave._id === response.data._id ? response.data : leave
      ));

      setShowApprovalModal(false);
      setSelectedLeave(null);
      setApprovalNotes('');
      toast.success(`Leave request ${status}`);
    } catch (err) {
      console.error('Failed to update leave status:', err);
      toast.error(err.response?.data?.message || 'Failed to update leave status');
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
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add comment');
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {leave.status === 'pending' && (
                      <button
                        onClick={() => {
                          setSelectedLeave(leave);
                          setShowApprovalModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Review
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedLeave(leave);
                        setShowCommentModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-700 flex items-center"
                    >
                      <FaComment className="mr-1" />
                      {leave.comments?.length || 0}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approval Modal */}
      {showApprovalModal && selectedLeave && (
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
                  placeholder="Add approval/rejection notes..."
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleApproval('rejected')}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  <FaTimes className="inline mr-1" />
                  Reject
                </button>
                <button
                  onClick={() => handleApproval('approved')}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                  <FaCheck className="inline mr-1" />
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comments Modal */}
      {showCommentModal && selectedLeave && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Comments</h2>
            <div className="space-y-4">
              <div className="max-h-60 overflow-y-auto space-y-2">
                {selectedLeave.comments?.map((comment) => (
                  <div key={comment._id} className="bg-gray-50 p-3 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {comment.user?.name || comment.user?.email || 'Unknown User'}
                      </p>
                      <p className="text-sm text-gray-600">{comment.text}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(comment.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
                {!selectedLeave.comments?.length && (
                  <p className="text-gray-500 text-center">No comments yet</p>
                )}
              </div>
          
              <form onSubmit={handleAddComment}>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  rows="2"
                  placeholder="Add a comment..."
                  required
                />
                <div className="flex justify-end space-x-2 mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCommentModal(false);
                      setNewComment('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Add Comment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaves; 