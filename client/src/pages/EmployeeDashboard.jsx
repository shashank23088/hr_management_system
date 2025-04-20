import React from 'react';
import { Routes, Route, Link, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import Profile from './employee/Profile';
import Teams from './employee/Teams';
import Salary from './employee/Salary';
import Tasks from './employee/Tasks';
import Tickets from './employee/Tickets';
import Leaves from './employee/Leaves';
import Performance from './employee/Performance';

const EmployeeDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const isActiveRoute = (path) => {
    return location.pathname.endsWith(path) ? 'bg-gray-100 text-blue-600 font-medium' : '';
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">Employee Dashboard</h1>
        </div>
        <nav className="mt-4 py-4">
          <Link
            to="profile"
            className={`flex items-center px-6 py-3 text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors duration-200 ${isActiveRoute('profile')}`}
          >
            Profile
          </Link>
          <Link
            to="teams"
            className={`flex items-center px-6 py-3 text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors duration-200 ${isActiveRoute('teams')}`}
          >
            Teams
          </Link>
          <Link
            to="salary"
            className={`flex items-center px-6 py-3 text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors duration-200 ${isActiveRoute('salary')}`}
          >
            Salary
          </Link>
          <Link
            to="tasks"
            className={`flex items-center px-6 py-3 text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors duration-200 ${isActiveRoute('tasks')}`}
          >
            Tasks
          </Link>
          <Link
            to="tickets"
            className={`flex items-center px-6 py-3 text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors duration-200 ${isActiveRoute('tickets')}`}
          >
            Tickets
          </Link>
          <Link
            to="leaves"
            className={`flex items-center px-6 py-3 text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors duration-200 ${isActiveRoute('leaves')}`}
          >
            Leaves
          </Link>
          <Link
            to="performance"
            className={`flex items-center px-6 py-3 text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors duration-200 ${isActiveRoute('performance')}`}
          >
            Performance
          </Link>
          <div className="px-4 mt-4 border-t border-gray-200 pt-4">
            <button
              onClick={handleLogout}
              className="w-full px-2 py-2 text-left text-gray-700 hover:bg-red-50 hover:text-red-600 rounded transition-colors duration-200"
            >
              Logout
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <Routes>
            <Route path="profile" element={<Profile />} />
            <Route path="teams" element={<Teams />} />
            <Route path="salary" element={<Salary />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="tickets" element={<Tickets />} />
            <Route path="leaves" element={<Leaves />} />
            <Route path="performance" element={<Performance />} />
            <Route index element={<Profile />} />
            <Route path="*" element={<Navigate to="profile" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard; 