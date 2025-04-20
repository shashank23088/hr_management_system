const express = require('express')
const router = express.Router()
const Employee = require('../models/Employee')
const { auth } = require('../middleware/auth')

// @route   GET api/employees
// @desc    Get all employees
// @access  Private
router.get('/', auth, (req, res) => {
  Employee.find()
    .populate('team', 'name')
    .then(employees => res.json(employees))
    .catch(err => {
      console.error(err.message)
      res.status(500).send('Server Error')
    })
})

// @route   POST api/employees
// @desc    Create an employee
// @access  Private
router.post('/', auth, (req, res) => {
  const { name, email, position, team } = req.body

  const employee = new Employee({
    name,
    email,
    position,
    team
  })

  employee.save()
    .then(employee => res.json(employee))
    .catch(err => {
      console.error(err.message)
      res.status(500).send('Server Error')
    })
})

// @route   PUT api/employees/:id
// @desc    Update an employee
// @access  Private
router.put('/:id', auth, (req, res) => {
  const { name, email, position, team } = req.body

  Employee.findById(req.params.id)
    .then(employee => {
      if (!employee) {
        return res.status(404).json({ msg: 'Employee not found' })
      }

      employee.name = name || employee.name
      employee.email = email || employee.email
      employee.position = position || employee.position
      employee.team = team || employee.team

      return employee.save()
    })
    .then(employee => res.json(employee))
    .catch(err => {
      console.error(err.message)
      res.status(500).send('Server Error')
    })
})

// @route   DELETE api/employees/:id
// @desc    Delete an employee
// @access  Private
router.delete('/:id', auth, (req, res) => {
  Employee.findById(req.params.id)
    .then(employee => {
      if (!employee) {
        return res.status(404).json({ msg: 'Employee not found' })
      }
      return employee.deleteOne()
    })
    .then(() => res.json({ msg: 'Employee removed' }))
    .catch(err => {
      console.error(err.message)
      res.status(500).send('Server Error')
    })
})

// @route   GET api/employees/me
// @desc    Get current employee profile
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const employee = await Employee.findById(req.user.id)
      .populate('team', 'name')
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' })
    }

    res.json(employee)
  } catch (err) {
    console.error('Error fetching employee profile:', err.message)
    res.status(500).send('Server Error')
  }
})

// @route   GET api/employees/:id
// @desc    Get employee by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('team', 'name')
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' })
    }

    res.json(employee)
  } catch (err) {
    console.error('Error fetching employee:', err.message)
    res.status(500).send('Server Error')
  }
})

// @route   GET api/employees/user/:userId
// @desc    Get employee by user ID
// @access  Private
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.params.userId })
      .populate('team', 'name');
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Only allow HR or the employee themselves to access their data
    if (req.user.role !== 'hr' && req.user.id !== req.params.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(employee);
  } catch (err) {
    console.error('Error fetching employee by user ID:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router 