const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Employee = require('../models/Employee');
const Team = require('../models/Team');

const initDB = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected...');
    console.log('Environment variables:');
    console.log('- MONGO_URI:', process.env.MONGO_URI);
    console.log('- HR_EMAIL:', process.env.HR_EMAIL);
    console.log('- HR_PASSWORD:', process.env.HR_PASSWORD ? '[SET]' : '[NOT SET]');

    // Clear existing data
    await User.deleteMany({});
    await Employee.deleteMany({});
    await Team.deleteMany({});
    console.log('Cleared existing data');

    // Create HR user
    const hrPassword = await bcrypt.hash(process.env.HR_PASSWORD, 10);
    console.log('HR password hashed');
    
    const hrUser = await User.create({
      email: process.env.HR_EMAIL,
      password: hrPassword,
      role: 'hr'
    });
    console.log('HR user created:', {
      id: hrUser._id,
      email: hrUser.email,
      role: hrUser.role
    });

    // Create sample employees
    const employee1Password = await bcrypt.hash('password123', 10);
    const employee1User = await User.create({
      email: 'john@company.com',
      password: employee1Password,
      role: 'employee'
    });

    const employee2Password = await bcrypt.hash('password123', 10);
    const employee2User = await User.create({
      email: 'jane@company.com',
      password: employee2Password,
      role: 'employee'
    });

    const employee1 = await Employee.create({
      user: employee1User._id,
      name: 'John Doe',
      email: 'john@company.com',
      position: 'Software Engineer',
      department: 'Engineering',
      joiningDate: new Date('2023-01-15'),
      salary: 75000,
      status: 'active'
    });

    const employee2 = await Employee.create({
      user: employee2User._id,
      name: 'Jane Smith',
      email: 'jane@company.com',
      position: 'Product Manager',
      department: 'Product',
      joiningDate: new Date('2023-02-01'),
      salary: 85000,
      status: 'active'
    });

    // Create sample team
    const team = await Team.create({
      name: 'Core Development',
      description: 'Main product development team',
      leader: employee1._id,
      members: [employee1._id, employee2._id]
    });

    // Update employees with team
    await Employee.updateMany(
      { _id: { $in: [employee1._id, employee2._id] } },
      { team: team._id }
    );

    console.log('Database initialized with sample data');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
};

module.exports = initDB; 