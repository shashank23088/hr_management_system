import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';

const Sidebar = ({ role }) => {
  const location = useLocation();
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
  };

  const isActiveRoute = (path) => {
    return location.pathname.includes(path) ? 'bg-gray-100 text-blue-600' : '';
  };

  const hrLinks = [
    { path: '/hr/employees', label: 'Employees' },
    { path: '/hr/teams', label: 'Teams' },
    { path: '/hr/salaries', label: 'Salaries' },
    { path: '/hr/attendance', label: 'Attendance' },
    { path: '/hr/leaves', label: 'Leaves' },
    { path: '/hr/tasks', label: 'Tasks' },
    { path: '/hr/tickets', label: 'Tickets' },
    { path: '/hr/performance', label: 'Performance' },
    { path: '/hr/change-password', label: 'Change Password' }
  ];

  const employeeLinks = [
    { path: '/employee/profile', label: 'Profile' },
    { path: '/employee/attendance', label: 'Attendance' },
    { path: '/employee/leaves', label: 'Leaves' },
    { path: '/employee/tasks', label: 'Tasks' },
    { path: '/employee/tickets', label: 'Tickets' },
    { path: '/employee/performance', label: 'Performance' },
    { path: '/employee/change-password', label: 'Change Password' }
  ];

  const links = role === 'hr' ? hrLinks : employeeLinks;

  return (
    <div className="w-64 bg-white shadow-lg">
      <div className="p-4">
        <h1 className="text-2xl font-bold text-gray-800">
          {role === 'hr' ? 'HR Dashboard' : 'Employee Dashboard'}
        </h1>
      </div>
      <nav className="mt-4">
        {links.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`block px-4 py-2 text-gray-700 hover:bg-gray-100 ${isActiveRoute(link.path)}`}
          >
            {link.label}
          </Link>
        ))}
        <button
          onClick={handleLogout}
          className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
        >
          Logout
        </button>
      </nav>
    </div>
  );
};

export default Sidebar; 