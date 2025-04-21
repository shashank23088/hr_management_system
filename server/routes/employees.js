const express = require('express')
const router = express.Router()
const Employee = require('../models/Employee')
const User = require('../models/User')
const Salary = require('../models/Salary')
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
// @desc    Create an employee, corresponding user, AND initial salary record
// @access  Private/HR
router.post('/', [auth, isHR], async (req, res) => {
  const { name, email, position, team, department, joiningDate, salary } = req.body
  const defaultPassword = process.env.DEFAULT_EMPLOYEE_PASSWORD || 'password123'
  
  let savedUser = null
  let savedEmployee = null

  try {
    // 1. Check if user already exists
    let existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' })
    }

    // --- Start Transaction (Conceptual) --- 
    // In a production scenario, consider using MongoDB transactions here 
    // to ensure all three creations (User, Employee, Salary) succeed or fail together.

    // 2. Create the User record
    // Use a consistent salt for all default passwords
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(defaultPassword, salt)
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: 'employee'
    })
    savedUser = await newUser.save()

    // 3. Create the Employee record linked to the User
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
    savedEmployee = await newEmployee.save()

    // 4. Create the initial Salary record
    const initialSalary = new Salary({
      employee: savedEmployee._id,
      amount: salary,
      date: joiningDate
    })
    const savedInitialSalary = await initialSalary.save()
    console.log(`POST /api/employees: Initial Salary record CREATED with ID: ${savedInitialSalary._id} for Employee ID: ${savedEmployee._id}`)

    // --- End Transaction (Conceptual) --- 

    // Populate the team name for the response (Employee data)
    await savedEmployee.populate('team', 'name')

    res.status(201).json(savedEmployee)

  } catch (err) {
    console.error('Error in POST /api/employees:', err)
    res.status(500).send('Server Error')
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
// @desc    Delete an employee AND associated user and salary records
// @access  Private (HR Only - Add isHR middleware)
router.delete('/:id', [auth, isHR], async (req, res) => {
  const employeeId = req.params.id;
  try {
    // 1. Find the employee record
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ msg: 'Employee not found' });
    }

    const userId = employee.user; // Get the associated User ID

    // 2. Delete associated Salary records (if any)
    const salaryDeleteResult = await Salary.deleteMany({ employee: employeeId });
    console.log(`Deleted ${salaryDeleteResult.deletedCount} salary records for employee ${employeeId}`);

    // 3. Delete the Employee record
    await employee.deleteOne();
    console.log(`Deleted Employee record ${employeeId}`);

    // 4. Delete the associated User record (if found)
    if (userId) {
        const userDeleteResult = await User.findByIdAndDelete(userId);
        if (userDeleteResult) {
            console.log(`Deleted User record ${userId}`);
        } else {
             console.log(`User record ${userId} not found for deletion.`);
        }
    } else {
        console.log(`No associated User ID found on Employee ${employeeId} to delete.`);
    }

    res.json({ msg: 'Employee and associated data removed successfully' });

  } catch (err) {
    console.error(`Error deleting employee ${employeeId}:`, err);
    res.status(500).send('Server Error');
  }
});

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