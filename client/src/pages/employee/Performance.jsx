import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { FaStar, FaChartLine, FaCheckCircle, FaClipboardList } from 'react-icons/fa';

const Performance = () => {
  const [performanceReviews, setPerformanceReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  
  const { user } = useSelector(state => state.auth);
  
  useEffect(() => {
    const fetchPerformanceReviews = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get(`/api/performance/employee/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });
        
        setPerformanceReviews(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch performance reviews');
        setLoading(false);
        console.error(err);
      }
    };
    
    fetchPerformanceReviews();
  }, [user.id, user.token]);
  
  // Helper function to format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Function to render stars based on rating
  const renderRatingStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FaStar 
          key={i} 
          className={i <= rating ? 'text-yellow-500' : 'text-gray-300'} 
        />
      );
    }
    return <div className="flex">{stars}</div>;
  };
  
  // Function to open details modal
  const openDetailsModal = (review) => {
    setSelectedReview(review);
    setShowDetailsModal(true);
  };
  
  // Function to get status from date
  const getStatus = (reviewDate) => {
    const now = new Date();
    const review = new Date(reviewDate);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    if (review > sixMonthsAgo) {
      return { label: 'Recent', className: 'bg-green-100 text-green-800' };
    } else {
      return { label: 'Past', className: 'bg-gray-100 text-gray-800' };
    }
  };
  
  return (
    <div className="px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Performance</h1>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Average Rating</p>
              <p className="text-2xl font-bold">
                {performanceReviews.length > 0 
                  ? (performanceReviews.reduce((sum, review) => sum + review.rating, 0) / performanceReviews.length).toFixed(1)
                  : 'N/A'}
              </p>
              {performanceReviews.length > 0 && (
                <div className="flex mt-1">
                  {renderRatingStars(Math.round(performanceReviews.reduce((sum, review) => sum + review.rating, 0) / performanceReviews.length))}
                </div>
              )}
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <FaChartLine className="text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Total Reviews</p>
              <p className="text-2xl font-bold">{performanceReviews.length}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <FaClipboardList className="text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Last Review</p>
              <p className="text-2xl font-bold">
                {performanceReviews.length > 0 
                  ? formatDate(performanceReviews.sort((a, b) => new Date(b.date) - new Date(a.date))[0].date)
                  : 'No reviews yet'}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <FaCheckCircle className="text-green-600" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Performance Reviews */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Performance Reviews</h2>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
            <div className="px-6 py-4 text-center">Loading...</div>
          ) : performanceReviews.length === 0 ? (
            <div className="px-6 py-4 text-center">No performance reviews found</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feedback</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {performanceReviews.sort((a, b) => new Date(b.date) - new Date(a.date)).map((review) => {
                  const status = getStatus(review.date);
                  
                  return (
                    <tr key={review._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatDate(review.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderRatingStars(review.rating)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 line-clamp-2">
                          {review.feedback}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => openDetailsModal(review)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
      
      {/* Details Modal */}
      {showDetailsModal && selectedReview && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                  Performance Review Details
                </h3>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-1">Date</p>
                  <p className="text-md">{formatDate(selectedReview.date)}</p>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-1">Rating</p>
                  <div className="flex items-center">
                    {renderRatingStars(selectedReview.rating)}
                    <span className="ml-2">{selectedReview.rating}/5</span>
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-1">Feedback</p>
                  <p className="text-md whitespace-pre-line">{selectedReview.feedback}</p>
                </div>
                
                {selectedReview.strengths && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-1">Strengths</p>
                    <p className="text-md whitespace-pre-line">{selectedReview.strengths}</p>
                  </div>
                )}
                
                {selectedReview.areasForImprovement && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-1">Areas for Improvement</p>
                    <p className="text-md whitespace-pre-line">{selectedReview.areasForImprovement}</p>
                  </div>
                )}
                
                {selectedReview.goals && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-1">Goals</p>
                    <p className="text-md whitespace-pre-line">{selectedReview.goals}</p>
                  </div>
                )}
                
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setShowDetailsModal(false)}
                    className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Performance; 