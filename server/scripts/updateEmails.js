require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const User = require('../models/User');
const Employee = require('../models/Employee');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('Database Connection Error:', err.message);
    process.exit(1);
  }
};

const updateEmails = async () => {
  try {
    await connectDB();

    // Email mapping with correct current emails
    const emailUpdates = [
      {
        name: 'Jane Smith',
        oldEmail: 'jane@company.com',
        newEmail: 'karanbir23042@iiitd.ac.in'
      },
      {
        name: 'Mohit Vani',
        oldEmail: 'mohit@company.com',
        newEmail: 'shashank.0901sharma@gmail.com'
      },
      {
        name: 'Shashank Sharma',
        oldEmail: 'shashank@company.com',
        newEmail: 'shashank23088@iiitd.ac.in'
      }
    ];

    console.log('Starting email updates...');

    // Update each email
    for (const update of emailUpdates) {
      console.log(`\nProcessing update for ${update.name}...`);
      console.log(`Looking for email: ${update.oldEmail}`);
      
      // Update User collection
      const user = await User.findOneAndUpdate(
        { email: update.oldEmail },
        { email: update.newEmail },
        { new: true }
      );

      if (user) {
        console.log(`✓ Updated user email for ${update.name} to ${update.newEmail}`);
        
        // If this user is an employee, update the associated employee record
        if (user.role === 'employee') {
          // Find employee and update only the email field
          const employee = await Employee.findOneAndUpdate(
            { user: user._id },
            { email: update.newEmail },
            { new: true }
          );
          
          if (employee) {
            console.log(`✓ Updated employee email for ${update.name} to ${update.newEmail}`);
          }
        }
      } else {
        console.log(`✗ No user found with email ${update.oldEmail}`);
        
        // Try to find any user with a similar email to help debugging
        const similarUsers = await User.find({ 
          email: { $regex: new RegExp(update.name.split(' ')[0], 'i') } 
        });
        
        if (similarUsers.length > 0) {
          console.log('Found similar users:');
          similarUsers.forEach(u => console.log(`- ${u.email}`));
        }
      }
    }

    // Verify updates
    console.log('\nVerifying updates...');
    for (const update of emailUpdates) {
      const user = await User.findOne({ email: update.newEmail });
      if (user) {
        console.log(`✓ Verified: ${update.name}'s email is now ${update.newEmail}`);
        
        if (user.role === 'employee') {
          const employee = await Employee.findOne({ user: user._id });
          if (employee && employee.email === update.newEmail) {
            console.log(`✓ Verified: Employee record also updated for ${update.name}`);
          }
        }
      } else {
        console.log(`✗ Warning: Could not verify update for ${update.name}`);
      }
    }

    console.log('\nEmail update completed');
    process.exit(0);
  } catch (error) {
    console.error('Error updating emails:', error);
    process.exit(1);
  }
};

updateEmails(); 