import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../../utils/axios';
import { FaStar, FaRegThumbsUp, FaRegThumbsDown, FaBullseye, FaComments } from 'react-icons/fa';

const Performance = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useSelector((state) => state.auth);
  
  useEffect(() => {
    const fetchReviews = async () => {
      if (!user || !user.id) {
        setError('User data not available');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log(`Fetching performance reviews for employee ID: ${user.id}`);
        // The backend route uses employee ID, which should be user.id for employees
        const response = await api.get(`/api/performance/employee/${user.id}`);
        console.log('Performance API Response:', response.data);
        setReviews(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error('Error fetching performance reviews:', err.response || err);
        const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch performance reviews';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReviews();
  }, [user]);
  
  const renderStars = (rating) => {
    const totalStars = 5;
    return (
      <div className="flex items-center">
        {[...Array(totalStars)].map((_, index) => (
        <FaStar 
            key={index}
            className={index < rating ? 'text-yellow-400' : 'text-gray-300'}
        />
        ))}
        <span className="ml-2 text-sm font-medium text-gray-600">({rating}/{totalStars})</span>
      </div>
    );
  };
    
  if (loading) {
  return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg">
        <div className="text-red-600 font-medium text-center">{error}</div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg text-center">
        <FaStar className="mx-auto text-4xl text-gray-400 mb-3" />
        <h3 className="text-lg font-medium text-gray-700">No Performance Reviews Found</h3>
        <p className="text-gray-500 mt-1">Your performance reviews will appear here once submitted by HR.</p>
        </div>
    );
  }
                  
                  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Performance Reviews</h1>
      <div className="space-y-6">
        {reviews.map((review) => (
          <div key={review._id} className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-gray-800">
                  Task: {review.task?.title || 'N/A'}
                </h2>
                <p className="text-sm text-gray-600">
                  Team: {review.team?.name || 'N/A'}
                </p>
                <p className="text-sm text-gray-500">
                  Reviewed by: {review.ratedBy?.name || 'HR'} • {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                {renderStars(review.rating)}
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                  ${review.rating >= 4 ? 'bg-green-100 text-green-800' :
                    review.rating >= 3 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'}`}>
                  {review.rating}/5
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {review.feedback && (
                  <div>
                    <h3 className="text-md font-semibold text-gray-700 flex items-center mb-2">
                      <FaComments className="mr-2 text-blue-500" /> Overall Feedback
                    </h3>
                    <div className="bg-blue-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                      <p className="text-gray-600 text-sm">{review.feedback}</p>
                    </div>
                  </div>
                )}
                {review.strengths && (
                  <div>
                    <h3 className="text-md font-semibold text-gray-700 flex items-center mb-2">
                      <FaRegThumbsUp className="mr-2 text-green-500" /> Strengths
                    </h3>
                    <div className="bg-green-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                      <p className="text-gray-600 text-sm">{review.strengths}</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                {review.areasForImprovement && (
                  <div>
                    <h3 className="text-md font-semibold text-gray-700 flex items-center mb-2">
                      <FaRegThumbsDown className="mr-2 text-red-500" /> Areas for Improvement
                    </h3>
                    <div className="bg-red-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                      <p className="text-gray-600 text-sm">{review.areasForImprovement}</p>
                    </div>
                  </div>
                )}
                {review.goals && (
                  <div>
                    <h3 className="text-md font-semibold text-gray-700 flex items-center mb-2">
                      <FaBullseye className="mr-2 text-purple-500" /> Goals
                    </h3>
                    <div className="bg-purple-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                      <p className="text-gray-600 text-sm">{review.goals}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Performance; 