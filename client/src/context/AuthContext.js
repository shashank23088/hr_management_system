import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set axios default header on token change
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('Auth token set in headers:', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      console.log('Auth token removed from headers');
    }
  }, [token]);

  // Load user on initial load and token change
  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        
        // Check for token in localStorage
        if (!localStorage.getItem('token')) {
          setLoading(false);
          return;
        }
        
        // Load user data
        const userData = JSON.parse(localStorage.getItem('user'));
        if (userData) {
          setUser(userData);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading user:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        setError('Authentication error. Please login again.');
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  // Login function
  const login = async (formData, role) => {
    try {
      setLoading(true);
      setError(null);
      
      // Determine login endpoint based on role
      const endpoint = role === 'hr' ? '/api/auth/hr/login' : '/api/auth/employee/login';
      
      const res = await axios.post(endpoint, formData);
      
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setToken(res.data.token);
        setUser(res.data.user);
      }
      
      setLoading(false);
      return true;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed. Please try again.');
      setLoading(false);
      return false;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        error,
        login,
        logout,
        setError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider; 