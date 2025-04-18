import React from 'react';
import { Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import Profile from './employee/Profile';
import Teams from './employee/Teams';
import Salary from './employee/Salary';
import Tasks from './employee/Tasks';
import Tickets from './employee/Tickets';
import Leaves from './employee/Leaves';
import { markAttendance } from '../redux/slices/attendanceSlice';

const EmployeeDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleAttendance = async () => {
    await dispatch(markAttendance());
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-4">
          <h1 className="text-2xl font-bold text-gray-800">Employee Dashboard</h1>
        </div>
        <nav className="mt-4">
          <Link
            to="profile"
            className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            Profile
          </Link>
          <Link
            to="teams"
            className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            Teams
          </Link>
          <Link
            to="salary"
            className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            Salary
          </Link>
          <Link
            to="tasks"
            className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            Tasks
          </Link>
          <Link
            to="tickets"
            className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            Tickets
          </Link>
          <Link
            to="leaves"
            className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            Leaves
          </Link>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            Logout
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Attendance Button */}
        <div className="absolute top-4 right-4">
          <button
            onClick={handleAttendance}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md shadow-sm"
          >
            Mark Attendance
          </button>
        </div>

        <div className="p-8">
          <Routes>
            <Route path="profile" element={<Profile />} />
            <Route path="teams" element={<Teams />} />
            <Route path="salary" element={<Salary />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="tickets" element={<Tickets />} />
            <Route path="leaves" element={<Leaves />} />
            <Route index element={<Profile />} />
            <Route path="*" element={<Navigate to="profile" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard; 