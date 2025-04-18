const express = require('express')
const router = express.Router()
const Leave = require('../models/Leave')
const { auth } = require('../middleware/auth')

// @route   GET api/leaves
// @desc    Get all leave records
// @access  Private
router.get('/', auth, (req, res) => {
  Leave.find()
    .populate('employee', 'name email')
    .populate('approvedBy', 'name email')
    .then(leaves => res.json(leaves))
    .catch(err => {
      console.error(err.message)
      res.status(500).send('Server Error')
    })
})

// @route   POST api/leaves
// @desc    Create a leave record
// @access  Private
router.post('/', auth, (req, res) => {
  const { employee, startDate, endDate, reason } = req.body

  const leave = new Leave({
    employee,
    startDate,
    endDate,
    reason,
    status: 'pending'
  })

  leave.save()
    .then(leave => res.json(leave))
    .catch(err => {
      console.error(err.message)
      res.status(500).send('Server Error')
    })
})

// @route   PUT api/leaves/:id
// @desc    Update a leave record
// @access  Private
router.put('/:id', auth, (req, res) => {
  const { status } = req.body

  Leave.findById(req.params.id)
    .then(leave => {
      if (!leave) {
        return res.status(404).json({ msg: 'Leave record not found' })
      }

      leave.status = status || leave.status
      leave.approvedBy = req.user.id

      return leave.save()
    })
    .then(leave => res.json(leave))
    .catch(err => {
      console.error(err.message)
      res.status(500).send('Server Error')
    })
})

module.exports = router 