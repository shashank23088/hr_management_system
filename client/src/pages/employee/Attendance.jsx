import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../../utils/axios';
import { FaCalendarCheck, FaCalendarTimes, FaClock } from 'react-icons/fa';

const Attendance = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [todayRecord, setTodayRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  
  const { user } = useSelector(state => state.auth);
  
  // Fetch attendance records for the current month
  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/api/attendance/employee/${user.id}?month=${month}&year=${year}`);
      
      setAttendanceRecords(response.data);
      
      // Check if there's a record for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todaysRecord = response.data.find(record => {
        const recordDate = new Date(record.date);
        recordDate.setHours(0, 0, 0, 0);
        return recordDate.getTime() === today.getTime();
      });
      
      setTodayRecord(todaysRecord || null);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch attendance records');
      setLoading(false);
      console.error(err);
    }
  };
  
  useEffect(() => {
    if (user?.id) {
      fetchAttendanceRecords();
    }
  }, [user?.id, month, year]);
  
  const handleCheckIn = async () => {
    try {
      setCheckingIn(true);
      setError(null);
      
      const response = await api.post('/api/attendance/check-in');
      
      // Refresh attendance records
      fetchAttendanceRecords();
      setCheckingIn(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to check in');
      setCheckingIn(false);
      console.error(err);
    }
  };
  
  const handleCheckOut = async () => {
    try {
      setCheckingOut(true);
      setError(null);
      
      const response = await api.post('/api/attendance/check-out');
      
      // Refresh attendance records
      fetchAttendanceRecords();
      setCheckingOut(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to check out');
      setCheckingOut(false);
      console.error(err);
    }
  };
  
  // Helper function to format date
  const formatDate = (dateString) => {
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Helper function to format time
  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Get status badge color
  const getStatusColor = (status) => {
    switch(status) {
      case 'Present':
        return 'bg-green-100 text-green-800';
      case 'Absent':
        return 'bg-red-100 text-red-800';
      case 'Late':
        return 'bg-orange-100 text-orange-800';
      case 'Half-day':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Generate month options
  const months = [
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
  
  // Generate year options (current year and 2 years back)
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];
  
  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Attendance</h1>
      
      {/* Check In/Out Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Today's Attendance</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
          <div className="mb-4 sm:mb-0">
            <p className="text-gray-700">
              {todayRecord ? (
                <>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(todayRecord.status)}`}>
                    {todayRecord.status}
                  </span>
                  {todayRecord.checkIn && (
                    <span className="ml-2">
                      Check In: {formatTime(todayRecord.checkIn)}
                    </span>
                  )}
                  {todayRecord.checkOut && (
                    <span className="ml-2">
                      Check Out: {formatTime(todayRecord.checkOut)}
                    </span>
                  )}
                  {todayRecord.workHours > 0 && (
                    <span className="ml-2">
                      Hours worked: {todayRecord.workHours}
                    </span>
                  )}
                </>
              ) : (
                'No attendance record for today'
              )}
            </p>
          </div>
          
          <div className="flex space-x-4">
            <button 
              onClick={handleCheckIn}
              disabled={checkingIn || (todayRecord && todayRecord.checkIn)}
              className={`flex items-center px-4 py-2 font-medium rounded-md ${
                checkingIn || (todayRecord && todayRecord.checkIn)
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <FaCalendarCheck className="mr-2" />
              {checkingIn ? 'Checking in...' : 'Check In'}
            </button>
            
            <button 
              onClick={handleCheckOut}
              disabled={
                checkingOut || 
                !todayRecord || 
                !todayRecord.checkIn || 
                (todayRecord && todayRecord.checkOut)
              }
              className={`flex items-center px-4 py-2 font-medium rounded-md ${
                checkingOut || !todayRecord || !todayRecord.checkIn || (todayRecord && todayRecord.checkOut)
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              <FaClock className="mr-2" />
              {checkingOut ? 'Checking out...' : 'Check Out'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              id="month"
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="rounded-md border border-gray-300 p-2"
            >
              {months.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              id="year"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="rounded-md border border-gray-300 p-2"
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Attendance Records Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours Worked</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center">Loading...</td>
                </tr>
              ) : attendanceRecords.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center">No attendance records found</td>
                </tr>
              ) : (
                attendanceRecords.map((record) => (
                  <tr key={record._id}>
                    <td className="px-6 py-4 whitespace-nowrap">{formatDate(record.date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatTime(record.checkIn)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatTime(record.checkOut)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.workHours > 0 ? `${record.workHours} hours` : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Attendance; 