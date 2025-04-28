const express = require('express')
const router = express.Router()
const Attendance = require('../models/Attendance')
const { auth, isHR } = require('../middleware/auth')
const Employee = require('../models/Employee')

// @route   GET api/attendance
// @desc    Get all attendance records
// @access  Private (HR only)
router.get('/', auth, isHR, async (req, res) => {
  try {
    const { month, year, employee, status } = req.query;
    let query = {};
    
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      query.date = { $gte: startDate, $lte: endDate };
    }

    if (employee && employee !== 'all') {
      query.employee = employee;
    }

    if (status && status !== 'all') {
      query.status = status;
    }
    
    const attendanceRecords = await Attendance.find(query)
      .populate('employee', 'name email department position')
      .sort({ date: -1 });
    
    res.json(attendanceRecords);
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    res.status(500).json({ message: error.message });
  }
})

// @route   GET api/attendance/employee/:employeeId
// @desc    Get attendance records for a specific employee
// @access  Private
router.get('/employee/:employeeId', auth, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { month, year, date } = req.query;
    
    // For debugging
    console.log('User from auth middleware:', req.user);
    console.log('Requested employeeId:', employeeId);
    
    // Check if the user is the same as the requested employee or is HR
    const isAuthorized = req.user.role?.toLowerCase() === 'hr' || req.user.id.toString() === employeeId;
    
    if (!isAuthorized) {
      // Check if the user is trying to access their own employee record by a different ID
      const employee = await Employee.findOne({ user: req.user.id });
      
      if (!employee || employee._id.toString() !== employeeId) {
        console.log('Access denied - User ID does not match employee user or HR role');
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    
    let query = { employee: employeeId };
    
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      query.date = { $gte: startDate, $lte: endDate };
    } else if (date) {
      // If specific date is provided (for today's status)
      const specificDate = new Date(date);
      const nextDay = new Date(specificDate);
      nextDay.setDate(nextDay.getDate() + 1);
      query.date = { $gte: specificDate, $lt: nextDay };
    }
    
    const attendanceRecords = await Attendance.find(query)
      .populate('employee', 'name email department position')
      .sort({ date: -1 });
      
    res.json(attendanceRecords);
  } catch (error) {
    console.error('Error fetching employee attendance:', error);
    res.status(500).json({ message: error.message });
  }
})

// @route   POST api/attendance
// @desc    Create an attendance record
// @access  Private (HR only)
router.post('/', auth, isHR, async (req, res) => {
  try {
    const { employee, date, checkIn, checkOut } = req.body;
    
    // Format the date to remove time component
    const formattedDate = new Date(date);
    formattedDate.setHours(0, 0, 0, 0);
    
    // Check if attendance record already exists for this employee and date
    const existingRecord = await Attendance.findOne({
      employee,
      date: formattedDate
    });
    
    if (existingRecord) {
      return res.status(400).json({ message: 'Attendance record already exists for this date' });
    }
    
    // Calculate work hours
    let workHours = 0;
    if (checkIn && checkOut) {
      const checkInTime = new Date(`2000-01-01T${checkIn}`);
      const checkOutTime = new Date(`2000-01-01T${checkOut}`);
      if (checkOutTime > checkInTime) {
        const diffMs = checkOutTime - checkInTime;
        workHours = Math.round((diffMs / 3600000) * 100) / 100; // Round to 2 decimal places
      }
    }

    // Calculate status based on check-in time
    const checkInDateTime = new Date(`2000-01-01T${checkIn}`);
    const hour = checkInDateTime.getHours();
    const minutes = checkInDateTime.getMinutes();
    const totalMinutes = hour * 60 + minutes;
    
    // Define time thresholds
    const startTime = 9 * 60; // 09:00 in minutes
    const lateThreshold = 10 * 60; // 10:00 in minutes
    
    // Determine status based on check-in time
    let status;
    if (totalMinutes < startTime) {
      // Before 09:00 - Present
      status = 'Present';
    } else if (totalMinutes < lateThreshold) {
      // Between 09:00 and 10:00 - Late
      status = 'Late';
    } else {
      // After 10:00 - Half-day
      status = 'Half-day';
    }
    
    const attendanceRecord = new Attendance({
      employee,
      date: formattedDate,
      status,
      checkIn: checkIn ? new Date(`${date}T${checkIn}`) : null,
      checkOut: checkOut ? new Date(`${date}T${checkOut}`) : null,
      workHours
    });
    
    const savedRecord = await attendanceRecord.save();
    const populatedRecord = await Attendance.findById(savedRecord._id)
      .populate('employee', 'name email');
    
    res.status(201).json(populatedRecord);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
})

// @route   POST api/attendance/check-in
// @desc    Check in for today
// @access  Private
router.post('/check-in', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find the employee record associated with this user
    const employee = await Employee.findOne({ user: userId });
    
    if (!employee) {
      console.log('Employee record not found for user ID:', userId);
      return res.status(404).json({ message: 'Employee record not found for this user' });
    }
    
    const employeeId = employee._id;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Check if an attendance record exists for today
    let attendanceRecord = await Attendance.findOne({
      employee: employeeId,
      date: today
    });
    
    if (attendanceRecord) {
      // If already checked in
      if (attendanceRecord.checkIn) {
        return res.status(400).json({ message: 'You have already checked in today' });
      }
    } else {
      // Create a new attendance record if none exists
      attendanceRecord = new Attendance({
        employee: employeeId,
        date: today,
        status: 'Present'
      });
    }
    
    // Set check-in time
    attendanceRecord.checkIn = now;
    
    // Get current hour and minutes for precise time comparison
    const hour = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hour * 60 + minutes;
    
    // Define time thresholds
    const startTime = 9 * 60; // 09:00 in minutes
    const lateThreshold = 10 * 60; // 10:00 in minutes
    
    // Determine status based on check-in time
    if (totalMinutes < startTime) {
      // Before 09:00 - Present
      attendanceRecord.status = 'Present';
    } else if (totalMinutes < lateThreshold) {
      // Between 09:00 and 10:00 - Late
      attendanceRecord.status = 'Late';
    } else {
      // After 10:00 - Half-day
      attendanceRecord.status = 'Half-day';
    }
    
    await attendanceRecord.save();
    
    // Get the populated record
    const populatedRecord = await Attendance.findById(attendanceRecord._id)
      .populate('employee', 'name email department position');
    
    // Prepare status message
    let statusMessage = 'Checked in successfully';
    if (attendanceRecord.status === 'Late') {
      statusMessage = 'Checked in late. Please try to arrive before 09:00';
    } else if (attendanceRecord.status === 'Half-day') {
      statusMessage = 'Checked in as half-day due to late arrival after 10:00';
    }
    
    res.status(200).json({ 
      message: statusMessage,
      time: now,
      status: attendanceRecord.status,
      record: populatedRecord
    });
  } catch (error) {
    console.error('Error checking in:', error);
    res.status(500).json({ message: error.message });
  }
})

// @route   POST api/attendance/check-out
// @desc    Check out for today
// @access  Private
router.post('/check-out', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find the employee record associated with this user
    const employee = await Employee.findOne({ user: userId });
    
    if (!employee) {
      console.log('Employee record not found for user ID:', userId);
      return res.status(404).json({ message: 'Employee record not found for this user' });
    }
    
    const employeeId = employee._id;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Find today's attendance record
    const attendanceRecord = await Attendance.findOne({
      employee: employeeId,
      date: today
    });
    
    if (!attendanceRecord) {
      return res.status(404).json({ message: 'No check-in record found for today' });
    }
    
    if (!attendanceRecord.checkIn) {
      return res.status(400).json({ message: 'You must check in before checking out' });
    }
    
    if (attendanceRecord.checkOut) {
      return res.status(400).json({ message: 'You have already checked out today' });
    }
    
    // Set check-out time
    attendanceRecord.checkOut = now;
    
    // Calculate work hours
    const checkInTime = new Date(attendanceRecord.checkIn);
    const workHours = (now - checkInTime) / (1000 * 60 * 60); // Convert ms to hours
    attendanceRecord.workHours = Math.round(workHours * 100) / 100; // Round to 2 decimal places for better minutes accuracy
    
    await attendanceRecord.save();
    
    // Get the populated record
    const populatedRecord = await Attendance.findById(attendanceRecord._id)
      .populate('employee', 'name email department position');
    
    res.status(200).json({ 
      message: 'Checked out successfully', 
      time: now,
      workHours: attendanceRecord.workHours,
      record: populatedRecord
    });
  } catch (error) {
    console.error('Error checking out:', error);
    res.status(500).json({ message: error.message });
  }
})

// @route   PUT api/attendance/:id
// @desc    Update an attendance record
// @access  Private (HR only)
router.put('/:id', auth, isHR, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, checkIn, checkOut, workHours } = req.body;
    
    const attendanceRecord = await Attendance.findById(id);
    
    if (!attendanceRecord) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    
    if (status) attendanceRecord.status = status;
    if (checkIn) attendanceRecord.checkIn = new Date(checkIn);
    if (checkOut) attendanceRecord.checkOut = new Date(checkOut);
    
    // If both check-in and check-out are provided, recalculate work hours
    if (checkIn && checkOut) {
      const checkInTime = new Date(checkIn);
      const checkOutTime = new Date(checkOut);
      const calculatedWorkHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);
      attendanceRecord.workHours = Math.round(calculatedWorkHours * 100) / 100;
    } else if (workHours !== undefined) {
      attendanceRecord.workHours = Math.round(workHours * 100) / 100;
    }
    
    await attendanceRecord.save();
    res.json(attendanceRecord);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
})

// @route   DELETE api/attendance/:id
// @desc    Delete an attendance record
// @access  Private (HR only)
router.delete('/:id', auth, isHR, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await Attendance.findByIdAndDelete(id);
    
    if (!result) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    
    res.json({ message: 'Attendance record deleted successfully' });
  } catch (error) {
    console.error('Error deleting attendance record:', error);
    res.status(500).json({ message: error.message });
  }
})

module.exports = router 