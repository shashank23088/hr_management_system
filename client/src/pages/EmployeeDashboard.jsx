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
import ChangePassword from '../components/ChangePassword';
import Sidebar from '../components/Sidebar';
import Attendance from './employee/Attendance';

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
      <Sidebar role="employee" />
      <main className="flex-1 overflow-y-auto p-8">
        <Routes>
          <Route path="/profile" element={<Profile />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/leaves" element={<Leaves />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/performance" element={<Performance />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/" element={<Profile />} />
        </Routes>
      </main>
    </div>
  );
};

export default EmployeeDashboard; 