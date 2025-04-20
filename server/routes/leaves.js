const express = require('express')
const router = express.Router()
const Leave = require('../models/Leave')
const { auth, isHR } = require('../middleware/auth')

// @route   GET api/leaves
// @desc    Get all leaves (HR only)
// @access  Private/HR
router.get('/', [auth, isHR], async (req, res) => {
  try {
    const leaves = await Leave.find()
      // Restore field selection for efficiency
      .populate({ path: 'employee', select: 'name email' }) 
      .populate({ path: 'approvedBy', select: 'name email' })
      .populate({ path: 'comments.user', select: 'name email' })
      .sort({ createdAt: -1 });

    res.json(leaves);
  } catch (err) {
    console.error('Error fetching leaves:', err.message);
    res.status(500).send('Server Error');
  }
})

// @route   GET api/leaves/employee/:employeeId
// @desc    Get leaves for a specific employee
// @access  Private
router.get('/employee/:employeeId', auth, async (req, res) => {
  try {
    // Check if user is HR or the employee themselves
    const requestedId = req.params.employeeId;
    const userId = req.user._id.toString();

    if (!req.user.isHR && userId !== requestedId) {
      return res.status(403).json({ message: 'Not authorized to view these leaves' });
    }

    console.log('Fetching leaves for employee:', requestedId);
    
    const leaves = await Leave.find({ 
      $or: [
        { employee: requestedId },
        { 'employee._id': requestedId }
      ]
    })
    .populate('employee', 'name email')
    .populate('approvedBy', 'name email')
    .populate('comments.user', 'name email')
    .sort({ createdAt: -1 });

    console.log('Found leaves:', leaves.length);
    res.json(leaves);
  } catch (err) {
    console.error('Error fetching employee leaves:', err);
    res.status(500).json({ message: 'Server Error' });
  }
})

// @route   GET api/leaves/:id
// @desc    Get a single leave by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id)
      .populate('employee', 'name email')
      .populate('approvedBy', 'name email')
      .populate('comments.user', 'name email')
    
    if (!leave) {
      return res.status(404).json({ message: 'Leave not found' })
    }

    // Check if user is HR or the employee themselves
    if (!req.user.isHR && req.user._id.toString() !== leave.employee._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this leave' })
    }

    res.json(leave)
  } catch (err) {
    console.error('Error fetching leave:', err.message)
    res.status(500).send('Server Error')
  }
})

// @route   POST api/leaves
// @desc    Create a new leave request
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { startDate, endDate, type, reason } = req.body

    const leave = new Leave({
      employee: req.user.id,
      startDate,
      endDate,
      type,
      reason,
      status: 'pending'
    })

    const newLeave = await leave.save()
    await newLeave.populate('employee', 'name email')
    res.status(201).json(newLeave)
  } catch (err) {
    console.error('Error creating leave request:', err.message)
    res.status(400).json({ message: err.message })
  }
})

// @route   PUT api/leaves/:id/status
// @desc    Update leave status (HR only)
// @access  Private/HR
router.put('/:id/status', [auth, isHR], async (req, res) => {
  try {
    const { status, approvalNotes } = req.body;

    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ message: 'Leave not found' });
    }

    leave.status = status;
    leave.approvedBy = req.user.id;
    leave.approvalDate = Date.now();
    leave.approvalNotes = approvalNotes;

    const savedLeave = await leave.save(); // Save first

    // Re-fetch with population
    const populatedLeave = await Leave.findById(savedLeave._id)
        .populate('employee', 'name email')
        .populate('approvedBy', 'name email')
        .populate('comments.user', 'name email');

    res.json(populatedLeave); // Send populated document
  } catch (err) {
    console.error('Error updating leave status:', err.message);
    res.status(400).json({ message: err.message });
  }
});

// @route   POST api/leaves/:id/comments
// @desc    Add a comment to a leave request
// @access  Private
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ message: 'Leave not found' });
    }

    // Check authorization
    if (!req.user.isHR && req.user._id.toString() !== leave.employee.toString()) {
      return res.status(403).json({ message: 'Not authorized to comment on this leave' });
    }

    leave.comments.push({
      text: req.body.text,
      user: req.user._id
    });

    const savedLeave = await leave.save(); // Save first

    // Re-fetch with population
    const populatedLeave = await Leave.findById(savedLeave._id)
        .populate('employee', 'name email')
        .populate('approvedBy', 'name email')
        .populate('comments.user', 'name email');

    res.json(populatedLeave); // Send populated document
  } catch (err) {
    console.error('Error adding comment to leave:', err.message);
    res.status(400).json({ message: err.message });
  }
});

// @route   DELETE api/leaves/:id/comments/:commentId
// @desc    Delete a comment from a leave request
// @access  Private
router.delete('/:id/comments/:commentId', auth, async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ message: 'Leave not found' });
    }

    const comment = leave.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check authorization
    if (!req.user.isHR && req.user._id.toString() !== comment.user.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    comment.remove(); // Use Mongoose subdocument remove
    const savedLeave = await leave.save(); // Save the parent document

    // Re-fetch with population
    const populatedLeave = await Leave.findById(savedLeave._id)
        .populate('employee', 'name email')
        .populate('approvedBy', 'name email')
        .populate('comments.user', 'name email');

    res.json(populatedLeave); // Send populated document
  } catch (err) {
    console.error('Error deleting comment from leave:', err.message);
    res.status(400).json({ message: err.message });
  }
});

// @route   DELETE api/leaves/:id
// @desc    Delete a leave request (only if pending)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id)
    
    if (!leave) {
      return res.status(404).json({ message: 'Leave not found' })
    }

    // Only allow deletion if status is pending and user is HR or the employee themselves
    if (leave.status !== 'pending') {
      return res.status(400).json({ message: 'Can only delete pending leave requests' })
    }

    if (!req.user.isHR && req.user._id.toString() !== leave.employee.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this leave' })
    }

    await leave.remove()
    res.json({ message: 'Leave request deleted' })
  } catch (err) {
    console.error('Error deleting leave request:', err.message)
    res.status(500).json({ message: err.message })
  }
})

module.exports = router 