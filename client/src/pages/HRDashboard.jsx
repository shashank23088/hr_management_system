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
import Leaves from './hr/Leaves';
import Sidebar from '../components/Sidebar';
import ChangePassword from '../components/ChangePassword';

const HRDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar role="hr" />
      <main className="flex-1 overflow-y-auto p-8">
        <Routes>
          <Route path="/employees" element={<Employees />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/salaries" element={<Salary />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/leaves" element={<Leaves />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/performance" element={<Performance />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/" element={<Employees />} />
        </Routes>
      </main>
    </div>
  );
};

export default HRDashboard; 