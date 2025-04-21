const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const resetPasswords = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('MongoDB connected');

    // Reset HR password
    const hrUser = await User.findOne({ role: 'hr' });
    if (hrUser) {
      hrUser.password = process.env.HR_PASSWORD;
      await hrUser.save();
      console.log('HR password reset');
    }

    // Reset all employee passwords to default
    const employees = await User.find({ role: 'employee' });
    const defaultPassword = process.env.DEFAULT_EMPLOYEE_PASSWORD || 'password123';
    
    for (const employee of employees) {
      employee.password = defaultPassword;
      await employee.save();
    }

    console.log(`Reset ${employees.length} employee passwords`);

    process.exit(0);
  } catch (error) {
    console.error('Error resetting passwords:', error);
    process.exit(1);
  }
};

resetPasswords(); 