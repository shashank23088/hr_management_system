import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../../utils/axios';
import { FaCalendarCheck, FaUserClock, FaFilter, FaDownload, FaTrash, FaEdit, FaHourglassHalf } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const Attendance = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [newAttendance, setNewAttendance] = useState({
    employee: '',
    date: new Date().toISOString().split('T')[0],
    checkIn: '',
    checkOut: '',
    workHours: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user } = useSelector(state => state.auth);
  
  // Fetch attendance records
  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let url = `/api/attendance?month=${month}&year=${year}`;
      if (selectedEmployee !== 'all') {
        url += `&employee=${selectedEmployee}`;
      }
      if (selectedStatus !== 'all') {
        url += `&status=${selectedStatus}`;
      }
      
      const response = await api.get(url);
      setAttendanceRecords(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch attendance records');
      setLoading(false);
      console.error('Error fetching attendance:', err);
    }
  };
  
  // Fetch employees for dropdown
  const fetchEmployees = async () => {
    try {
      const response = await api.get('/api/employees');
      setEmployees(response.data);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
      setError(err.response?.data?.message || 'Failed to fetch employees');
    }
  };
  
  useEffect(() => {
    if (user?.id) {
      fetchAttendanceRecords();
      fetchEmployees();
    }
  }, [user?.id, month, year, selectedEmployee, selectedStatus]);
  
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
  
  // Helper function to format work hours as "X hours Y minutes"
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
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAttendance(prev => {
      const updated = { ...prev, [name]: value };
      
      // If check-in or check-out time changes, calculate work hours
      if (name === 'checkIn' || name === 'checkOut') {
        if (updated.checkIn && updated.checkOut) {
          const checkInTime = new Date(`2000-01-01T${updated.checkIn}`);
          const checkOutTime = new Date(`2000-01-01T${updated.checkOut}`);
          if (checkOutTime > checkInTime) {
            const diffMs = checkOutTime - checkInTime;
            const diffHrs = Math.round((diffMs / 3600000) * 100) / 100;
            updated.workHours = diffHrs;
          }
        }
      }
      
      return updated;
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const response = await api.post('/api/attendance', {
        employee: newAttendance.employee,
        date: newAttendance.date,
        checkIn: newAttendance.checkIn,
        checkOut: newAttendance.checkOut
      });
      
      setAttendanceRecords([...attendanceRecords, response.data]);
      handleClose();
      toast.success('Attendance record added successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error adding attendance record');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle delete confirmation
  const handleDeleteClick = (record) => {
    setRecordToDelete(record);
    setShowDeleteModal(true);
  };

  // Handle delete attendance record
  const handleDeleteConfirm = async () => {
    if (!recordToDelete) return;
    
    try {
      setLoading(true);
      setError(null);
      
      await api.delete(`/api/attendance/${recordToDelete._id}`);
      
      // Remove the deleted record from state
      setAttendanceRecords(prevRecords => 
        prevRecords.filter(record => record._id !== recordToDelete._id)
      );
      
      setShowDeleteModal(false);
      setRecordToDelete(null);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete attendance record');
      setLoading(false);
      console.error('Error deleting attendance record:', err);
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
  
  // Export attendance data to CSV
  const exportToCSV = () => {
    if (attendanceRecords.length === 0) return;
    
    const headers = ['Employee Name', 'Date', 'Status', 'Check In', 'Check Out', 'Work Hours'];
    
    const csvData = attendanceRecords.map(record => {
      return [
        record.employee?.name || 'N/A',
        formatDate(record.date),
        record.status,
        formatTime(record.checkIn),
        formatTime(record.checkOut),
        formatWorkHours(record.workHours)
      ].join(',');
    });
    
    const csvContent = [headers.join(','), ...csvData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `attendance_${year}_${month}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Attendance Management</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <FaCalendarCheck className="mr-2" />
            Add Attendance
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            disabled={attendanceRecords.length === 0}
          >
            <FaDownload className="mr-2" />
            Export CSV
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor="employee" className="block text-sm font-medium text-gray-700 mb-1">
              Employee
            </label>
            <select
              id="employee"
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="rounded-md border border-gray-300 p-2 min-w-[200px]"
            >
              <option value="all">All Employees</option>
              {employees.map(emp => (
                <option key={emp._id} value={emp._id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-1">
              Month
            </label>
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
            <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
              Year
            </label>
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
          
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-md border border-gray-300 p-2"
            >
              <option value="all">All Status</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Late">Late</option>
              <option value="Half-day">Half-day</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Attendance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Total Records</p>
              <p className="text-2xl font-bold">{attendanceRecords.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <FaUserClock className="text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Present</p>
              <p className="text-2xl font-bold">
                {attendanceRecords.filter(record => record.status === 'Present').length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <FaCalendarCheck className="text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Absent</p>
              <p className="text-2xl font-bold">
                {attendanceRecords.filter(record => record.status === 'Absent').length}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <FaCalendarCheck className="text-red-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Late</p>
              <p className="text-2xl font-bold">
                {attendanceRecords.filter(record => record.status === 'Late').length}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <FaCalendarCheck className="text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Half-day</p>
              <p className="text-2xl font-bold">
                {attendanceRecords.filter(record => record.status === 'Half-day').length}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <FaHourglassHalf className="text-yellow-600" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Attendance Records Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours Worked</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center">Loading...</td>
                </tr>
              ) : attendanceRecords.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center">No attendance records found</td>
                </tr>
              ) : (
                attendanceRecords.map((record) => {
                  return (
                    <tr key={record._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.employee?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{formatDate(record.date)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{formatTime(record.checkIn)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{formatTime(record.checkOut)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatWorkHours(record.workHours)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button 
                          onClick={() => handleDeleteClick(record)} 
                          className="text-red-600 hover:text-red-900 mr-3"
                          title="Delete record"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Add Attendance Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">Add Attendance Record</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="employee" className="block text-sm font-medium text-gray-700 mb-1">
                    Employee
                  </label>
                  <select
                    id="employee"
                    name="employee"
                    value={newAttendance.employee}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-md border border-gray-300 p-2"
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp._id} value={emp._id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={newAttendance.date}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-md border border-gray-300 p-2"
                  />
                </div>
                
                <div>
                  <label htmlFor="checkIn" className="block text-sm font-medium text-gray-700 mb-1">
                    Check In Time
                  </label>
                  <input
                    type="time"
                    id="checkIn"
                    name="checkIn"
                    value={newAttendance.checkIn}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-md border border-gray-300 p-2"
                  />
                </div>
                
                <div>
                  <label htmlFor="checkOut" className="block text-sm font-medium text-gray-700 mb-1">
                    Check Out Time
                  </label>
                  <input
                    type="time"
                    id="checkOut"
                    name="checkOut"
                    value={newAttendance.checkOut}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-md border border-gray-300 p-2"
                  />
                </div>
                
                {error && (
                  <div className="text-red-500 text-sm">
                    {error}
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">Confirm Delete</h2>
            
            <p className="mb-4">
              Are you sure you want to delete the attendance record for{" "}
              <span className="font-medium">{recordToDelete?.employee?.name || 'this employee'}</span> on{" "}
              <span className="font-medium">{recordToDelete ? formatDate(recordToDelete.date) : ''}</span>?
            </p>
            
            {error && (
              <div className="text-red-500 text-sm mb-4">
                {error}
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setRecordToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance; 