const mongoose = require('mongoose');
require('dotenv').config();

// Import all models
const User = require('../models/User');
const Employee = require('../models/Employee');
const Team = require('../models/Team');
const Task = require('../models/Task');
const Ticket = require('../models/Ticket');
const Performance = require('../models/Performance');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Salary = require('../models/Salary');

const clearDB = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB...');

    // Clear all collections
    console.log('Clearing collections...');
    
    await User.deleteMany({});
    console.log('✓ Users cleared');
    
    await Employee.deleteMany({});
    console.log('✓ Employees cleared');
    
    await Team.deleteMany({});
    console.log('✓ Teams cleared');
    
    await Task.deleteMany({});
    console.log('✓ Tasks cleared');
    
    await Ticket.deleteMany({});
    console.log('✓ Tickets cleared');
    
    await Performance.deleteMany({});
    console.log('✓ Performance records cleared');
    
    await Attendance.deleteMany({});
    console.log('✓ Attendance records cleared');
    
    await Leave.deleteMany({});
    console.log('✓ Leave records cleared');
    
    await Salary.deleteMany({});
    console.log('✓ Salary records cleared');

    console.log('\nAll data has been cleared successfully!');
    console.log('\nTo reinitialize the database with sample data, run: npm run init-db');
    
    process.exit(0);
  } catch (error) {
    console.error('Error clearing database:', error);
    process.exit(1);
  }
};

clearDB(); 