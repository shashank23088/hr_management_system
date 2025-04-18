require('dotenv').config({ path: './.env' });
const initDB = require('../config/initDB');

// Display all relevant environment variables
console.log('========== ENVIRONMENT VARIABLES ==========');
console.log('MongoDB URI:', process.env.MONGO_URI);
console.log('HR Email:', process.env.HR_EMAIL);
console.log('HR Password:', process.env.HR_PASSWORD);
console.log('JWT Secret:', process.env.JWT_SECRET ? '[SET]' : '[NOT SET]');
console.log('=========================================');

initDB()
  .then(() => {
    console.log('Database initialization completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }); 