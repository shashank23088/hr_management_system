const express = require('express')
const router = express.Router()
const Performance = require('../models/Performance')
const { auth, isHR } = require('../middleware/auth')

// @route   GET api/performance
// @desc    Get all performance records (HR only)
// @access  Private
router.get('/', auth, isHR, async (req, res) => {
  try {
    const performances = await Performance.find()
      .populate('employee', 'name email')
      .populate('team', 'name')
      .populate('task', 'title')
      .populate('ratedBy', 'name email')
      .sort({ createdAt: -1 })
    
    res.json(performances)
  } catch (err) {
    console.error('Error fetching performance records:', err)
    res.status(500).json({ message: 'Server Error' })
  }
})

// @route   GET api/performance/employee/:employeeId
// @desc    Get performance records for a specific employee
// @access  Private
router.get('/employee/:employeeId', auth, async (req, res) => {
  try {
    // Only allow HR or the employee themselves to access their records
    if (req.user.role?.toLowerCase() !== 'hr' && req.user.id !== req.params.employeeId) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const performances = await Performance.find({ employee: req.params.employeeId })
      .populate('team', 'name')
      .populate('task', 'title')
      .populate('ratedBy', 'name email')
      .sort({ createdAt: -1 })
    
    res.json(performances)
  } catch (err) {
    console.error('Error fetching employee performance records:', err)
    res.status(500).json({ message: 'Server Error' })
  }
})

// @route   POST api/performance
// @desc    Create a performance record (HR only)
// @access  Private
router.post('/', auth, isHR, async (req, res) => {
  try {
    const { employee, team, task, rating, feedback, goals, strengths, areasForImprovement } = req.body

    const performance = new Performance({
      employee,
      team,
      task,
      rating,
      feedback,
      goals,
      strengths,
      areasForImprovement,
      ratedBy: req.user.id
    })

    const savedPerformance = await performance.save()
    const populatedPerformance = await Performance.findById(savedPerformance._id)
      .populate('employee', 'name email')
      .populate('team', 'name')
      .populate('task', 'title')
      .populate('ratedBy', 'name email')

    res.status(201).json(populatedPerformance)
  } catch (err) {
    console.error('Error creating performance record:', err)
    res.status(400).json({ message: err.message })
  }
})

// @route   PUT api/performance/:id
// @desc    Update a performance record (HR only)
// @access  Private
router.put('/:id', auth, isHR, async (req, res) => {
  try {
    const performance = await Performance.findById(req.params.id)
    if (!performance) {
      return res.status(404).json({ message: 'Performance record not found' })
    }

    const { rating, feedback, goals, strengths, areasForImprovement } = req.body
    
    if (rating) performance.rating = rating
    if (feedback) performance.feedback = feedback
    if (goals) performance.goals = goals
    if (strengths) performance.strengths = strengths
    if (areasForImprovement) performance.areasForImprovement = areasForImprovement

    const updatedPerformance = await performance.save()
    const populatedPerformance = await Performance.findById(updatedPerformance._id)
      .populate('employee', 'name email')
      .populate('team', 'name')
      .populate('task', 'title')
      .populate('ratedBy', 'name email')

    res.json(populatedPerformance)
  } catch (err) {
    console.error('Error updating performance record:', err)
    res.status(400).json({ message: err.message })
  }
})

// @route   DELETE api/performance/:id
// @desc    Delete a performance record (HR only)
// @access  Private
router.delete('/:id', auth, isHR, async (req, res) => {
  try {
    const performance = await Performance.findById(req.params.id)
    if (!performance) {
      return res.status(404).json({ message: 'Performance record not found' })
    }

    await performance.deleteOne()
    res.json({ message: 'Performance record removed' })
  } catch (err) {
    console.error('Error deleting performance record:', err)
    res.status(500).json({ message: 'Server Error' })
  }
})

module.exports = router 