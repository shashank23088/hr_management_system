import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { verifyToken } from './redux/slices/authSlice';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import HRDashboard from './pages/HRDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import PrivateRoute from './components/PrivateRoute';

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const location = useLocation();
  
  useEffect(() => {
    // Verify token on app startup
    dispatch(verifyToken());
  }, [dispatch]);

  // Redirect to appropriate dashboard based on role
  const getDefaultRoute = () => {
    if (!isAuthenticated) return '/login';
    return user?.role?.toLowerCase() === 'hr' ? '/hr/dashboard' : '/employee/dashboard';
  };

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route
        path="/hr/*"
        element={
          <PrivateRoute role="hr">
            <HRDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/employee/*"
        element={
          <PrivateRoute role="employee">
            <EmployeeDashboard />
          </PrivateRoute>
        }
      />
      <Route 
        path="/" 
        element={<Navigate to={getDefaultRoute()} replace state={{ from: location }} />} 
      />
      <Route 
        path="*" 
        element={<Navigate to={getDefaultRoute()} replace state={{ from: location }} />} 
      />
    </Routes>
  );
}

export default App; 