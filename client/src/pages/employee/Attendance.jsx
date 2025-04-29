import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { FaClock, FaCalendarAlt, FaHourglassHalf } from 'react-icons/fa';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Attendance = () => {
  const { user, loading: authLoading, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [todayStatus, setTodayStatus] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  // Check authentication
  useEffect(() => {
    if (!authLoading && !token) {
      navigate('/login');
    }
  }, [authLoading, token, navigate]);

  // Fetch today's attendance status
  const fetchTodayStatus = async () => {
    if (!user?.employeeId || !token) return;
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const response = await axios.get(`/api/attendance/employee/${user.employeeId}`, {
        params: {
          date: today.toISOString()
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const todayRecord = response.data.find(record => {
        const recordDate = new Date(record.date);
        recordDate.setHours(0, 0, 0, 0);
        return recordDate.getTime() === today.getTime();
      });
      
      setTodayStatus(todayRecord || null);
    } catch (error) {
      console.error('Error fetching today status:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  // Fetch attendance history
  const fetchAttendanceHistory = async () => {
    if (!user?.employeeId || !token) return;
    
    try {
      setLoading(true);
      
      const response = await axios.get(`/api/attendance/employee/${user.employeeId}`, {
        params: {
          month,
          year
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setAttendanceHistory(response.data);
    } catch (error) {
      console.error('Error fetching attendance history:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when authentication is ready
  useEffect(() => {
    if (!authLoading && user?.employeeId && token) {
      fetchTodayStatus();
      fetchAttendanceHistory();
    }
  }, [authLoading, user, token, month, year]);

  // Handle check in
  const handleCheckIn = async () => {
    if (!user || !user.employeeId) {
      setMessage('User authentication required');
      setMessageType('error');
      return;
    }
    
    try {
      setLoading(true);
      
      // Get auth token from localStorage
      const token = localStorage.getItem('token');
      
      const response = await axios.post('/api/attendance/check-in', {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setMessage(response.data.message);
      setMessageType('success');
      fetchTodayStatus();
      setLoading(false);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error checking in');
      setMessageType('error');
      setLoading(false);
    }
  };

  // Handle check out
  const handleCheckOut = async () => {
    if (!user || !user.employeeId) {
      setMessage('User authentication required');
      setMessageType('error');
      return;
    }
    
    try {
      setLoading(true);
      
      // Get auth token from localStorage
      const token = localStorage.getItem('token');
      
      const response = await axios.post('/api/attendance/check-out', {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setMessage(response.data.message);
      setMessageType('success');
      fetchTodayStatus();
      setLoading(false);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error checking out');
      setMessageType('error');
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format time
  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format work hours as "X hours Y minutes"
  const formatWorkHours = (hours) => {
    if (!hours && hours !== 0) return 'N/A';
    
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    
    if (wholeHours === 0) {
      return `${minutes} minutes`;
    } else if (minutes === 0) {
      return `${wholeHours} ${wholeHours === 1 ? 'hour' : 'hours'}`;
    } else {
      return `${wholeHours} ${wholeHours === 1 ? 'hour' : 'hours'} ${minutes} minutes`;
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Present':
        return 'bg-green-100 text-green-800';
      case 'Absent':
        return 'bg-red-100 text-red-800';
      case 'Late':
        return 'bg-yellow-100 text-yellow-800';
      case 'Half-day':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Generate month options
  const monthOptions = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  // Generate year options (last 3 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear, currentYear - 1, currentYear - 2].map(year => ({
    value: year,
    label: year.toString()
  }));

  // Render loading state or authentication required message
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-red-500 mb-4">Authentication required</div>
        <div className="text-gray-600">Please log in to access your attendance records</div>
        <button
          onClick={() => navigate('/login')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Attendance</h1>
      
      {/* Message display */}
      {message && (
        <div className={`p-4 mb-6 rounded-lg ${messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
        </div>
      )}
      
      {/* Today's attendance card */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Today's Attendance</h2>
        <div className="flex flex-col md:flex-row md:justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-gray-600 mb-1">Date: <span className="font-medium">{formatDate(new Date())}</span></p>
            {todayStatus ? (
              <>
                <p className="text-gray-600 mb-1">
                  Status: 
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(todayStatus.status)}`}>
                    {todayStatus.status}
                  </span>
                </p>
                <p className="text-gray-600 mb-1">Check-in: <span className="font-medium">{formatTime(todayStatus.checkIn)}</span></p>
                <p className="text-gray-600">Check-out: <span className="font-medium">{formatTime(todayStatus.checkOut)}</span></p>
                {todayStatus.checkIn && todayStatus.checkOut && (
                  <p className="text-gray-600 mt-1">
                    Work Hours: <span className="font-medium">{formatWorkHours(todayStatus.workHours)}</span>
                  </p>
                )}
              </>
            ) : (
              <p className="text-gray-600">No attendance recorded yet</p>
            )}
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={handleCheckIn}
              disabled={loading || (todayStatus && todayStatus.checkIn)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                loading || (todayStatus && todayStatus.checkIn)
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <FaClock /> Check In
            </button>
            
            <button
              onClick={handleCheckOut}
              disabled={loading || !todayStatus || !todayStatus.checkIn || todayStatus.checkOut}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                loading || !todayStatus || !todayStatus.checkIn || todayStatus.checkOut
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              <FaClock /> Check Out
            </button>
          </div>
        </div>
      </div>
      
      {/* Attendance history section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Attendance History</h2>
          
          <div className="flex gap-4">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {monthOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {yearOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        ) : attendanceHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-3 text-left text-gray-600 border-b">Date</th>
                  <th className="p-3 text-left text-gray-600 border-b">Status</th>
                  <th className="p-3 text-left text-gray-600 border-b">Check In</th>
                  <th className="p-3 text-left text-gray-600 border-b">Check Out</th>
                  <th className="p-3 text-left text-gray-600 border-b">Work Hours</th>
                </tr>
              </thead>
              <tbody>
                {attendanceHistory.map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50">
                    <td className="p-3 border-b">{formatDate(record.date)}</td>
                    <td className="p-3 border-b">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="p-3 border-b">{formatTime(record.checkIn)}</td>
                    <td className="p-3 border-b">{formatTime(record.checkOut)}</td>
                    <td className="p-3 border-b">{formatWorkHours(record.workHours)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <FaCalendarAlt className="inline-block text-gray-400 text-4xl mb-2" />
            <p className="text-gray-600">No attendance records found for this month</p>
          </div>
        )}
        
        {/* Summary section */}
        {attendanceHistory.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <h3 className="text-lg font-medium mb-3">Monthly Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-blue-800 font-medium">Present Days</p>
                <p className="text-2xl font-bold text-blue-600">
                  {attendanceHistory.filter(record => record.status === 'Present').length}
                </p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-yellow-800 font-medium">Late Days</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {attendanceHistory.filter(record => record.status === 'Late').length}
                </p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-orange-800 font-medium">Half Days</p>
                <p className="text-2xl font-bold text-orange-600">
                  {attendanceHistory.filter(record => record.status === 'Half-day').length}
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-red-800 font-medium">Absent Days</p>
                <p className="text-2xl font-bold text-red-600">
                  {attendanceHistory.filter(record => record.status === 'Absent').length}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance; 