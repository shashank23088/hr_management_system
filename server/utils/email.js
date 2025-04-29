const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Create reusable transporter
const createTransporter = async () => {
  // Debug environment variables
  console.log('Checking email configuration...');
  console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'Not set');
  console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? 'Set' : 'Not set');

  // Verify required environment variables
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    throw new Error('Email configuration missing. Please set EMAIL_USER and EMAIL_PASSWORD in .env file');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  // Verify connection configuration
  try {
    await transporter.verify();
    console.log('Email service ready');
    return transporter;
  } catch (error) {
    console.error('Email configuration error:', error);
    throw new Error('Failed to configure email service. Please check your credentials.');
  }
};

// Send password reset OTP
const sendPasswordResetOTP = async (email, otp) => {
  try {
    const transporter = await createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; text-align: center;">Password Reset OTP</h1>
          <p style="color: #666; font-size: 16px;">You requested a password reset. Here is your OTP:</p>
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
            <h2 style="color: #007bff; letter-spacing: 5px; font-size: 32px; margin: 0;">${otp}</h2>
          </div>
          <p style="color: #666; font-size: 14px;">This OTP will expire in 15 minutes.</p>
          <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
        </div>
      `
    };

    console.log('Attempting to send email to:', email);
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset OTP sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Detailed error sending OTP:', error);
    if (error.code === 'EENVELOPE') {
      throw new Error('Invalid recipient email address');
    } else if (error.code === 'EAUTH') {
      throw new Error('Email authentication failed. Please check your credentials.');
    } else {
      throw new Error('Failed to send OTP email. Please try again later.');
    }
  }
};

module.exports = {
  sendPasswordResetOTP
}; 