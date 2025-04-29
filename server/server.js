const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Debug environment variables
console.log('Environment Variables:');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'Not set');
console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? 'Set' : 'Not set');

const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const teamRoutes = require('./routes/teams');
const taskRoutes = require('./routes/tasks');
const ticketRoutes = require('./routes/tickets');
const performanceRoutes = require('./routes/performance');
const attendanceRoutes = require('./routes/attendance');
const leaveRoutes = require('./routes/leaves');
const salaryRoutes = require('./routes/salaries');

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/salaries', salaryRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/performance', performanceRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build/index.html'));
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 