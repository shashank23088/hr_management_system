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
  const { name, email, position, team, department, joiningDate, baseSalary } = req.body
  const defaultPassword = process.env.DEFAULT_EMPLOYEE_PASSWORD || 'password123'
  
  let savedUser = null
  let savedEmployee = null

  try {
    // 1. Check if user already exists
    let existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' })
    }

    // 2. Create the User record
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
      baseSalary,
      totalSalary: baseSalary // Initially total salary equals base salary
    })
    savedEmployee = await newEmployee.save()

    // 4. Create the initial Salary record
    const initialSalary = new Salary({
      employee: savedEmployee._id,
      amount: baseSalary,
      date: joiningDate
    })
    const savedInitialSalary = await initialSalary.save()
    console.log(`POST /api/employees: Initial Salary record CREATED with ID: ${savedInitialSalary._id} for Employee ID: ${savedEmployee._id}`)

    // Populate the team name for the response
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
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, email, position, department, joiningDate, baseSalary } = req.body;

    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Update employee fields
    if (name) employee.name = name;
    if (email) employee.email = email;
    if (position) employee.position = position;
    if (department) employee.department = department;
    if (joiningDate) employee.joiningDate = joiningDate;
    
    // Handle base salary update
    if (baseSalary) {
      // Calculate the difference between new and old base salary
      const salaryDifference = baseSalary - employee.baseSalary;
      
      // Update base salary
      employee.baseSalary = baseSalary;
      
      // Update total salary by adding the difference
      employee.totalSalary = employee.totalSalary + salaryDifference;

      // Create a new salary record for the change
      const newSalaryRecord = new Salary({
        employee: employee._id,
        amount: baseSalary,
        date: new Date(),
        raiseReason: 'Base salary update'
      });
      await newSalaryRecord.save();
    }

    // Save the updated employee
    await employee.save();

    // Fetch the updated employee with populated fields
    const updatedEmployee = await Employee.findById(employee._id)
      .populate('team', 'name')
      .populate('user', 'email name role');

    // Also update the associated user's name if it changed
    if (name && employee.user) {
      await User.findByIdAndUpdate(employee.user, { name });
    }

    res.json(updatedEmployee);
  } catch (err) {
    console.error('Error updating employee:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

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
// @desc    Get employee by ID with latest salary info
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('team', 'name')
      .populate('user', 'email name role');

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Get the latest salary record
    const latestSalary = await Salary.findOne({ employee: employee._id })
      .sort({ date: -1 });

    // Combine employee data with latest salary info
    const employeeData = employee.toObject();
    if (latestSalary) {
      employeeData.currentSalary = latestSalary.amount;
      employeeData.lastRaise = latestSalary.raise || 0;
      employeeData.lastRaiseReason = latestSalary.raiseReason;
      employeeData.lastSalaryUpdate = latestSalary.date;
    }

    res.json(employeeData);
  } catch (err) {
    console.error('Error fetching employee:', err);
    res.status(500).send('Server Error');
  }
});

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