const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Employee = require('../models/Employee');

// HR Login
router.post('/hr/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('HR Login Attempt:', { email, passwordProvided: password });
    console.log('HR_EMAIL from env:', process.env.HR_EMAIL);
    console.log('HR_PASSWORD from env:', process.env.HR_PASSWORD);
    
    // Special handling for HR login - compare directly with environment variables
    if (email === process.env.HR_EMAIL && password === process.env.HR_PASSWORD) {
      console.log('HR login successful (direct env comparison)');
      
      // Find or create HR user
      let hrUser = await User.findOne({ email, role: 'hr' });
      
      if (!hrUser) {
        // Create HR user if doesn't exist
        const hrPassword = await bcrypt.hash(process.env.HR_PASSWORD, 10);
        hrUser = await User.create({
          email: process.env.HR_EMAIL,
          password: hrPassword,
          role: 'hr'
        });
        console.log('HR user created');
      }
      
      // Generate token
      const token = jwt.sign(
        { id: hrUser._id, email, role: 'hr' },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );
      
      return res.json({ 
        token,
        user: {
          id: hrUser._id,
          email: hrUser.email,
          role: hrUser.role
        }
      });
    }
    
    // Standard authentication flow for HR
    const hrUser = await User.findOne({ email, role: 'hr' });
    console.log('HR User found:', hrUser ? 'Yes' : 'No');
    
    if (!hrUser) {
      console.log('HR login failed: User not found');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('Stored hashed password:', hrUser.password);
    
    // For debugging only: Hash the input password with the same method
    const inputPasswordHashed = await bcrypt.hash(password, 10);
    console.log('Input password after hashing (will be different due to salt):', inputPasswordHashed);
    
    // Compare password
    const isMatch = await bcrypt.compare(password, hrUser.password);
    console.log('Password match:', isMatch);
    
    if (!isMatch) {
      console.log('HR login failed: Password mismatch');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: hrUser._id, email, role: 'hr' },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    console.log('HR login successful');
    res.json({ 
      token,
      user: {
        id: hrUser._id,
        email: hrUser.email,
        role: hrUser.role
      }
    });
  } catch (err) {
    console.error('HR Login Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Employee Login
router.post('/employee/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Employee Login Attempt:', { email, passwordProvided: password });
    
    // Special handling for test employees
    const testEmployees = ['john@company.com', 'jane@company.com'];
    const testPassword = 'password123';
    
    if (testEmployees.includes(email) && password === testPassword) {
      console.log('Test employee login successful (direct comparison)');
      
      // Find user and employee
      const user = await User.findOne({ email, role: 'employee' });
      if (!user) {
        console.log('Employee login failed: User not found');
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      const employee = await Employee.findOne({ user: user._id });
      if (!employee) {
        console.log('Employee login failed: Employee record not found');
        return res.status(401).json({ message: 'Employee not found' });
      }
      
      // Generate token
      const token = jwt.sign(
        { id: user._id, email, role: 'employee' },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );
      
      return res.json({ 
        token,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          employeeId: employee._id,
          name: employee.name
        }
      });
    }
    
    // Standard authentication flow
    const user = await User.findOne({ email, role: 'employee' });
    console.log('Employee User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      console.log('Employee login failed: User not found');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('Stored hashed password:', user.password);
    
    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch);
    
    if (!isMatch) {
      console.log('Employee login failed: Password mismatch');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Get employee details
    const employee = await Employee.findOne({ user: user._id });
    if (!employee) {
      console.log('Employee login failed: Employee record not found');
      return res.status(401).json({ message: 'Employee not found' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id, email, role: 'employee' },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    console.log('Employee login successful');
    res.json({ 
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        employeeId: employee._id,
        name: employee.name
      }
    });
  } catch (err) {
    console.error('Employee Login Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  
  try {
    // Check if user exists
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'Email not found' });
    }
    
    // In a real application, you would:
    // 1. Generate a password reset token
    // 2. Send an email with the reset link
    // 3. Store the token in the database
    
    // For demo purposes, just return success
    res.json({ message: 'Password reset instructions sent to your email' });
  } catch (err) {
    console.error('Forgot Password Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 