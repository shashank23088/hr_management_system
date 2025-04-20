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
    console.log('User requesting tasks:', req.user);
    console.log('Requested employee ID:', req.params.employeeId);

    // First, try to find the employee associated with the user
    const Employee = require('../models/Employee');
    const employee = await Employee.findOne({ user: req.user.id });
    
    console.log('Found employee:', employee);

    // Convert IDs to strings for comparison
    const requestedId = req.params.employeeId;
    const userId = req.user.id?.toString();
    const employeeId = employee?._id?.toString();

    console.log('Comparing IDs:', {
      requestedId,
      userId,
      employeeId,
      userRole: req.user.role
    });

    // Allow access if:
    // 1. User is HR
    // 2. User is requesting their own tasks (matching either their user ID or employee ID)
    if (req.user.role !== 'hr' && 
        requestedId !== employeeId && 
        requestedId !== userId) {
      console.log('Access denied');
      return res.status(403).json({ 
        message: 'Access denied',
        debug: {
          requestedId,
          userId,
          employeeId,
          userRole: req.user.role
        }
      });
    }

    // Find tasks assigned to either the employee ID or user ID
    const tasks = await Task.find({
      $or: [
        { assignedTo: requestedId },
        { assignedTo: employeeId }
      ]
    })
      .populate('team', 'name')
      .populate('assignedTo', 'name email')
      .sort({ dueDate: 1 });

    console.log('Found tasks:', tasks);
    res.json(tasks);
  } catch (err) {
    console.error('Error in /tasks/employee/:employeeId:', err);
    res.status(500).json({ 
      message: 'Server Error',
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// @route   GET api/tasks/:id
// @desc    Get a single task with populated comments
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('team', 'name')
      .populate('assignedTo', 'name email')
      .populate('comments.user', 'name email');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (err) {
    console.error('Error fetching task:', err);
    res.status(500).json({ message: 'Server Error' });
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

// @route   PUT api/tasks/:id/status
// @desc    Update a task's status
// @access  Private
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    console.log('Updating task status:', { taskId: req.params.id, newStatus: status });

    // Convert status to match the model's enum
    const normalizedStatus = status.replace('_', '-');

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Verify the user has permission to update this task
    const employee = await require('../models/Employee').findOne({ user: req.user.id });
    if (req.user.role !== 'hr' && 
        task.assignedTo.toString() !== employee?._id.toString() && 
        task.assignedTo.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    task.status = normalizedStatus;
    await task.save();

    // Return the updated task with populated fields
    const updatedTask = await Task.findById(task._id)
      .populate('team', 'name')
      .populate('assignedTo', 'name email');

    res.json(updatedTask);
  } catch (err) {
    console.error('Error updating task status:', err);
    res.status(500).json({ 
      message: 'Failed to update task status',
      error: err.message 
    });
  }
});

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

// @route   POST api/tasks/:id/comments
// @desc    Add a comment to a task
// @access  Private
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { comment } = req.body;
    console.log('Adding comment to task:', { taskId: req.params.id, comment });

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Verify the user has permission to comment on this task
    const employee = await require('../models/Employee').findOne({ user: req.user.id });
    if (req.user.role !== 'hr' && 
        task.assignedTo.toString() !== employee?._id.toString() && 
        task.assignedTo.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to comment on this task' });
    }

    // Add the comment
    task.comments.unshift({
      text: comment,
      user: req.user.id
    });

    await task.save();

    // Return the updated task with populated fields
    const updatedTask = await Task.findById(task._id)
      .populate('team', 'name')
      .populate('assignedTo', 'name email')
      .populate('comments.user', 'name email');

    res.json(updatedTask);
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).json({ 
      message: 'Failed to add comment',
      error: err.message 
    });
  }
});

// @route   DELETE api/tasks/:id/comments/:commentId
// @desc    Delete a comment from a task
// @access  Private
router.delete('/:id/comments/:commentId', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Find the comment
    const comment = task.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Verify the user has permission to delete the comment
    if (comment.user.toString() !== req.user.id && req.user.role !== 'hr') {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    // Remove the comment
    comment.remove();
    await task.save();

    // Return the updated task with populated fields
    const updatedTask = await Task.findById(task._id)
      .populate('team', 'name')
      .populate('assignedTo', 'name email')
      .populate('comments.user', 'name email');

    res.json(updatedTask);
  } catch (err) {
    console.error('Error deleting comment:', err);
    res.status(500).json({ 
      message: 'Failed to delete comment',
      error: err.message 
    });
  }
});

module.exports = router 