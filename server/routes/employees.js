const express = require('express')
const router = express.Router()
const Employee = require('../models/Employee')
const User = require('../models/User')
const bcrypt = require('bcryptjs')
const { auth, isHR } = require('../middleware/auth')

// @route   GET api/employees
// @desc    Get all employees
// @access  Private
router.get('/', auth, (req, res) => {
  Employee.find()
    .populate('team', 'name')
    .populate('user', 'email name role')
    .then(employees => res.json(employees))
    .catch(err => {
      console.error('GET /api/employees error:', err.message)
      res.status(500).send('Server Error')
    })
})

// @route   POST api/employees
// @desc    Create an employee AND corresponding user
// @access  Private/HR
router.post('/', [auth, isHR], async (req, res) => {
  const { name, email, position, team, department, joiningDate, salary } = req.body
  const defaultPassword = process.env.DEFAULT_EMPLOYEE_PASSWORD || 'password123'

  try {
    let existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' })
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(defaultPassword, salt)

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: 'employee'
    })
    const savedUser = await newUser.save()

    const newEmployee = new Employee({
      user: savedUser._id,
      name,
      email,
      position,
      team,
      department,
      joiningDate,
      salary
    })
    const savedEmployee = await newEmployee.save()
    
    await savedEmployee.populate('team', 'name')

    res.status(201).json(savedEmployee)

  } catch (err) {
    console.error('POST /api/employees error:', err)
    if (savedUser && !savedEmployee) {
      await User.findByIdAndDelete(savedUser._id)
    }
    res.status(500).json({ message: 'Error creating employee: ' + err.message })
  }
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
    const requestedUserId = req.params.userId;
    const loggedInUserId = req.user._id.toString(); // Use _id and ensure string
    const loggedInUserRole = req.user.role;

    console.log(`Employee Route: GET /user/${requestedUserId}. Logged in User: ${loggedInUserId}, Role: ${loggedInUserRole}`);

    const employee = await Employee.findOne({ user: requestedUserId })
      .populate('team', 'name');
    
    if (!employee) {
      console.log(`Employee Route: Employee not found for User ID: ${requestedUserId}`);
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Log the comparison IDs
    console.log(`Employee Route: Permission Check -> Role: ${loggedInUserRole}, LoggedInID: ${loggedInUserId}, RequestedID: ${requestedUserId}`);

    // Only allow HR or the employee themselves to access their data
    if (loggedInUserRole !== 'hr' && loggedInUserId !== requestedUserId) {
      console.log(`Employee Route: Access DENIED.`);
      return res.status(403).json({ message: 'Access denied' });
    }

    console.log(`Employee Route: Access GRANTED.`);
    res.json(employee);
  } catch (err) {
    console.error('Error fetching employee by user ID:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router 