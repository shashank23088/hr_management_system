const express = require('express')
const router = express.Router()
const Performance = require('../models/Performance')
const { auth } = require('../middleware/auth')

// @route   GET api/performance
// @desc    Get all performance records
// @access  Private
router.get('/', auth, (req, res) => {
  Performance.find()
    .populate('employee', 'name email')
    .populate('team', 'name')
    .populate('task', 'title')
    .populate('ratedBy', 'name email')
    .then(performances => res.json(performances))
    .catch(err => {
      console.error(err.message)
      res.status(500).send('Server Error')
    })
})

// @route   POST api/performance
// @desc    Create a performance record
// @access  Private
router.post('/', auth, (req, res) => {
  const { employee, team, task, rating, feedback } = req.body

  const performance = new Performance({
    employee,
    team,
    task,
    rating,
    feedback,
    ratedBy: req.user.id
  })

  performance.save()
    .then(performance => res.json(performance))
    .catch(err => {
      console.error(err.message)
      res.status(500).send('Server Error')
    })
})

// @route   PUT api/performance/:id
// @desc    Update a performance record
// @access  Private
router.put('/:id', auth, (req, res) => {
  const { rating, feedback } = req.body

  Performance.findById(req.params.id)
    .then(performance => {
      if (!performance) {
        return res.status(404).json({ msg: 'Performance record not found' })
      }

      performance.rating = rating || performance.rating
      performance.feedback = feedback || performance.feedback

      return performance.save()
    })
    .then(performance => res.json(performance))
    .catch(err => {
      console.error(err.message)
      res.status(500).send('Server Error')
    })
})

// @route   DELETE api/performance/:id
// @desc    Delete a performance record
// @access  Private
router.delete('/:id', auth, (req, res) => {
  Performance.findById(req.params.id)
    .then(performance => {
      if (!performance) {
        return res.status(404).json({ msg: 'Performance record not found' })
      }
      return performance.deleteOne()
    })
    .then(() => res.json({ msg: 'Performance record removed' }))
    .catch(err => {
      console.error(err.message)
      res.status(500).send('Server Error')
    })
})

module.exports = router 