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
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✓ Connected to MongoDB successfully');

    // Clear all collections
    console.log('\nClearing collections...');
    
    const collections = [
      { name: 'Users', model: User },
      { name: 'Employees', model: Employee },
      { name: 'Teams', model: Team },
      { name: 'Tasks', model: Task },
      { name: 'Tickets', model: Ticket },
      { name: 'Performance', model: Performance },
      { name: 'Attendance', model: Attendance },
      { name: 'Leaves', model: Leave },
      { name: 'Salaries', model: Salary }
    ];

    for (const collection of collections) {
      try {
        const result = await collection.model.deleteMany({});
        console.log(`✓ ${collection.name} cleared (${result.deletedCount} documents)`);
      } catch (error) {
        console.error(`✗ Error clearing ${collection.name}:`, error.message);
      }
    }

    // Get all collections from the database
    const db = mongoose.connection.db;
    const allCollections = await db.listCollections().toArray();
    
    // Clear any additional collections that might exist
    for (const collection of allCollections) {
      const collectionName = collection.name;
      if (!collections.some(c => c.model.collection.name === collectionName)) {
        try {
          await db.collection(collectionName).deleteMany({});
          console.log(`✓ Additional collection "${collectionName}" cleared`);
        } catch (error) {
          console.error(`✗ Error clearing additional collection "${collectionName}":`, error.message);
        }
      }
    }

    console.log('\n✓ Database cleared successfully!');
    console.log('\nTo reinitialize the database with sample data, run: npm run init-db');
    
    process.exit(0);
  } catch (error) {
    console.error('Error clearing database:', error);
    process.exit(1);
  }
};

clearDB(); 