import React from 'react';
import { Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import Employees from './hr/Employees';
import Teams from './hr/Teams';
import Salary from './hr/Salary';
import Attendance from './hr/Attendance';
import Tasks from './hr/Tasks';
import Tickets from './hr/Tickets';
import Performance from './hr/Performance';

const HRDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-4">
          <h1 className="text-2xl font-bold text-gray-800">HR Dashboard</h1>
        </div>
        <nav className="mt-4">
          <Link
            to="/hr/employees"
            className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            Employees
          </Link>
          <Link
            to="/hr/teams"
            className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            Teams
          </Link>
          <Link
            to="/hr/salary"
            className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            Salary
          </Link>
          <Link
            to="/hr/attendance"
            className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            Attendance
          </Link>
          <Link
            to="/hr/tasks"
            className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            Tasks
          </Link>
          <Link
            to="/hr/tickets"
            className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            Tickets
          </Link>
          <Link
            to="/hr/performance"
            className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            Performance
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
        <Routes>
          <Route path="/employees" element={<Employees />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/salary" element={<Salary />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/performance" element={<Performance />} />
          <Route path="/" element={<Navigate to="/hr/employees" replace />} />
          <Route path="*" element={<Navigate to="/hr/employees" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default HRDashboard; 