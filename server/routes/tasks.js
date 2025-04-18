const express = require('express')
const router = express.Router()
const Task = require('../models/Task')
const { auth } = require('../middleware/auth')

// @route   GET api/tasks
// @desc    Get all tasks
// @access  Private
router.get('/', auth, (req, res) => {
  Task.find()
    .populate('assignedTo', 'name email')
    .populate('team', 'name')
    .then(tasks => res.json(tasks))
    .catch(err => {
      console.error(err.message)
      res.status(500).send('Server Error')
    })
})

// @route   GET api/tasks/employee/:employeeId
// @desc    Get tasks assigned to a specific employee
// @access  Private
router.get('/employee/:employeeId', auth, async (req, res) => {
  try {
    // Only allow HR or the employee themselves to access their tasks
    if (req.user.role !== 'hr' && req.user.id !== req.params.employeeId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const tasks = await Task.find({ assignedTo: req.params.employeeId })
      .populate('team', 'name')
      .sort({ dueDate: 1 });

    res.json(tasks);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/tasks
// @desc    Create a task
// @access  Private
router.post('/', auth, (req, res) => {
  const { title, description, dueDate, priority, status, assignedTo, team } = req.body

  const task = new Task({
    title,
    description,
    dueDate,
    priority,
    status,
    assignedTo,
    team
  })

  task.save()
    .then(task => res.json(task))
    .catch(err => {
      console.error(err.message)
      res.status(500).send('Server Error')
    })
})

// @route   PUT api/tasks/:id
// @desc    Update a task
// @access  Private
router.put('/:id', auth, (req, res) => {
  const { title, description, dueDate, priority, status, assignedTo, team } = req.body

  Task.findById(req.params.id)
    .then(task => {
      if (!task) {
        return res.status(404).json({ msg: 'Task not found' })
      }

      task.title = title || task.title
      task.description = description || task.description
      task.dueDate = dueDate || task.dueDate
      task.priority = priority || task.priority
      task.status = status || task.status
      task.assignedTo = assignedTo || task.assignedTo
      task.team = team || task.team

      return task.save()
    })
    .then(task => res.json(task))
    .catch(err => {
      console.error(err.message)
      res.status(500).send('Server Error')
    })
})

// @route   DELETE api/tasks/:id
// @desc    Delete a task
// @access  Private
router.delete('/:id', auth, (req, res) => {
  Task.findById(req.params.id)
    .then(task => {
      if (!task) {
        return res.status(404).json({ msg: 'Task not found' })
      }
      return task.deleteOne()
    })
    .then(() => res.json({ msg: 'Task removed' }))
    .catch(err => {
      console.error(err.message)
      res.status(500).send('Server Error')
    })
})

module.exports = router 