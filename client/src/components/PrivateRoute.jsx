import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';

const PrivateRoute = ({ children, role }) => {
  const { isAuthenticated, user, token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  // If we have a token but no user data, something's wrong - log out
  useEffect(() => {
    if (isAuthenticated && token && !user) {
      console.error('User data missing but token exists - logging out');
      dispatch(logout());
    }
  }, [isAuthenticated, user, token, dispatch]);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Case-insensitive role comparison
  if (role && user?.role?.toLowerCase() !== role.toLowerCase()) {
    console.log(`Access denied: Required role ${role}, user has role ${user?.role}`);
    return <Navigate to="/login" />;
  }

  return children;
};

export default PrivateRoute; 