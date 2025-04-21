const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const setupHR = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('MongoDB connected');

    // Check if HR user already exists
    const existingHR = await User.findOne({ role: 'hr' });
    if (existingHR) {
      console.log('HR user already exists');
      process.exit(0);
    }

    // Create HR user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(process.env.HR_PASSWORD, salt);

    const hrUser = await User.create({
      email: process.env.HR_EMAIL,
      password: hashedPassword,
      role: 'hr'
    });

    console.log('HR user created successfully:', hrUser.email);
    process.exit(0);
  } catch (error) {
    console.error('Error setting up HR user:', error);
    process.exit(1);
  }
};

setupHR(); 