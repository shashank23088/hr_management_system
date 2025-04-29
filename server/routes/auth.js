const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Employee = require('../models/Employee');
const { auth } = require('../middleware/auth');
const { sendPasswordResetEmail, sendPasswordResetOTP } = require('../utils/email');

// HR Login
router.post('/hr/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find HR user with password
    const hrUser = await User.findOne({ email, role: 'hr' }).select('+password');
    
    if (!hrUser) {
      return res.status(401).json({ message: 'Email not found or not registered as HR' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, hrUser.password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    // Generate token
    const token = jwt.sign(
      { id: hrUser._id, email, role: 'hr' },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

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
    
    const user = await User.findOne({ email, role: 'employee' }).select('+password');
    
    if (!user) {
      return res.status(401).json({ message: 'Email not found or not registered as employee' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    const employee = await Employee.findOne({ user: user._id });
    if (!employee) {
      return res.status(401).json({ message: 'Employee record not found' });
    }

    const token = jwt.sign(
      { id: user._id, email, role: 'employee' },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

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

// @route   POST api/auth/forgot-password
// @desc    Send password reset OTP
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    console.log('Attempting password reset for email:', email);
    
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(404).json({ message: 'Email not found' });
    }

    // Generate OTP
    console.log('Generating OTP for user');
    const otp = user.generateOTP();

    // Save the OTP and expiry
    try {
      await user.save();
      console.log('OTP saved to user record');
    } catch (saveError) {
      console.error('Error saving OTP:', saveError);
      return res.status(500).json({ message: 'Error saving OTP' });
    }

    try {
      // Send email with OTP
      console.log('Attempting to send OTP email');
      await sendPasswordResetOTP(email, otp);
      console.log('OTP email sent successfully');
      res.json({ message: 'OTP sent to your email' });
    } catch (emailError) {
      console.error('Detailed email error:', emailError);
      
      // Reset OTP fields since email failed
      user.resetOTP = undefined;
      user.resetOTPExpire = undefined;
      await user.save();
      
      return res.status(500).json({ 
        message: 'Failed to send OTP',
        error: emailError.message 
      });
    }
  } catch (err) {
    console.error('Forgot Password Error:', err);
    res.status(500).json({ 
      message: 'Server error',
      error: err.message 
    });
  }
});

// @route   POST api/auth/verify-otp
// @desc    Verify OTP and reset password
// @access  Public
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Validate input
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Please provide email, OTP and new password' });
    }

    // Find user with OTP fields
    const user = await User.findOne({ email })
      .select('+resetOTP +resetOTPExpire');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify OTP
    const isValid = await user.verifyOTP(otp);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Set new password
    user.password = newPassword;
    user.resetOTP = undefined;
    user.resetOTPExpire = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Reset Password Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Change Password
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide both current and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    // Get user with password
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update password - this will trigger the pre-save middleware in User model
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change Password Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 