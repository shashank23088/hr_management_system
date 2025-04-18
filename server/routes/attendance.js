const express = require('express')
const router = express.Router()
const Attendance = require('../models/Attendance')
const { auth, isHR } = require('../middleware/auth')

// @route   GET api/attendance
// @desc    Get all attendance records
// @access  Private (HR only)
router.get('/', auth, isHR, async (req, res) => {
  try {
    const { month, year, employee, status } = req.query;
    let query = {};
    
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      query.date = { $gte: startDate, $lte: endDate };
    }

    if (employee && employee !== 'all') {
      query.employee = employee;
    }

    if (status && status !== 'all') {
      query.status = status;
    }
    
    const attendanceRecords = await Attendance.find(query)
      .populate('employee', 'name email')
      .sort({ date: -1 });
    
    res.json(attendanceRecords);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
})

// @route   GET api/attendance/employee/:employeeId
// @desc    Get attendance records for a specific employee
// @access  Private
router.get('/employee/:employeeId', auth, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { month, year } = req.query;
    
    // Only allow HR or the employee themselves to access their records
    if (req.user.role?.toLowerCase() !== 'hr' && req.user.id !== employeeId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    let query = { employee: employeeId };
    
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      query.date = { $gte: startDate, $lte: endDate };
    }
    
    const attendanceRecords = await Attendance.find(query)
      .populate('employee', 'name email')
      .sort({ date: -1 });
    res.json(attendanceRecords);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
})

// @route   POST api/attendance
// @desc    Create an attendance record
// @access  Private (HR only)
router.post('/', auth, isHR, async (req, res) => {
  try {
    const { employee, date, status, checkIn, checkOut } = req.body;
    
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
    
    let workHours = 0;
    if (checkIn && checkOut) {
      const checkInTime = new Date(`2000-01-01T${checkIn}`);
      const checkOutTime = new Date(`2000-01-01T${checkOut}`);
      if (checkOutTime > checkInTime) {
        const diffMs = checkOutTime - checkInTime;
        workHours = Math.round((diffMs / 3600000) * 10) / 10;
      }
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
    const employeeId = req.user.id;
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
    
    // Determine status based on time of day
    const hour = now.getHours();
    if (hour >= 9 && hour < 10) {
      attendanceRecord.status = 'Late';
    } else if (hour < 9) {
      attendanceRecord.status = 'Present';
    } else {
      attendanceRecord.status = 'Half-day';
    }
    
    await attendanceRecord.save();
    res.status(200).json({ 
      message: 'Checked in successfully', 
      time: now,
      status: attendanceRecord.status
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
})

// @route   POST api/attendance/check-out
// @desc    Check out for today
// @access  Private
router.post('/check-out', auth, async (req, res) => {
  try {
    const employeeId = req.user.id;
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
    attendanceRecord.workHours = parseFloat(workHours.toFixed(2));
    
    await attendanceRecord.save();
    res.status(200).json({ 
      message: 'Checked out successfully', 
      time: now,
      workHours: attendanceRecord.workHours
    });
  } catch (error) {
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
      attendanceRecord.workHours = parseFloat(calculatedWorkHours.toFixed(2));
    } else if (workHours !== undefined) {
      attendanceRecord.workHours = workHours;
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
    const attendanceRecord = await Attendance.findById(id);
    
    if (!attendanceRecord) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    
    await attendanceRecord.remove();
    res.json({ message: 'Attendance record deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
})

module.exports = router 