const express = require('express')
const router = express.Router()
const Salary = require('../models/Salary')
const Employee = require('../models/Employee')
const { auth } = require('../middleware/auth')

// @route   GET api/salaries
// @desc    Get all salary records
// @access  Private (HR Only)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'hr') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const salaries = await Salary.find()
      .sort({ date: -1 })
      .populate('employee', 'name email position');
    
    res.json(salaries);
  } catch (err) {
    console.error('Error fetching salaries:', err.message);
    res.status(500).send('Server Error');
  }
})

// @route   GET api/salaries/employee/:employeeId
// @desc    Get salary records for a specific employee
// @access  Private
router.get('/employee/:employeeId', auth, async (req, res) => {
  try {
    // First, get the employee record for the logged-in user
    const employee = await Employee.findOne({ user: req.user.id });
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee record not found' });
    }

    // Allow employees to access their own records or HR to access any record
    if (req.user.role !== 'hr' && employee._id.toString() !== req.params.employeeId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const salaries = await Salary.find({ employee: req.params.employeeId })
      .sort({ date: -1 })
      .populate('employee', 'name email position');

    res.json(salaries);
  } catch (err) {
    console.error('Error fetching employee salaries:', err.message);
    res.status(500).send('Server Error');
  }
})

// @route   POST api/salaries
// @desc    Create a salary record
// @access  Private (HR Only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'hr') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { employee, amount, date, raise, raiseReason } = req.body;

    // Basic validation
    if (!employee || !amount || !date) {
      return res.status(400).json({ message: 'Please provide employee, amount, and date' });
    }

    const salary = new Salary({
      employee,
      amount,
      date: new Date(date),
      raise,
      raiseReason
    });

    const savedSalary = await salary.save();
    const populatedSalary = await Salary.findById(savedSalary._id)
      .populate('employee', 'name email position');

    res.json(populatedSalary);
  } catch (err) {
    console.error('Error creating salary:', err.message);
    res.status(500).send('Server Error');
  }
})

// @route   PUT api/salaries/:id
// @desc    Update a salary record
// @access  Private (HR Only)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'hr') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { amount, date, raise, raiseReason } = req.body;
    const salary = await Salary.findById(req.params.id);

    if (!salary) {
      return res.status(404).json({ message: 'Salary record not found' });
    }

    salary.amount = amount || salary.amount;
    salary.date = date ? new Date(date) : salary.date;
    if (raise !== undefined) salary.raise = raise;
    if (raiseReason !== undefined) salary.raiseReason = raiseReason;

    await salary.save();
    const updatedSalary = await Salary.findById(salary._id)
      .populate('employee', 'name email position');

    res.json(updatedSalary);
  } catch (err) {
    console.error('Error updating salary:', err.message);
    res.status(500).send('Server Error');
  }
})

// @route   DELETE api/salaries/:id
// @desc    Delete a salary record
// @access  Private (HR Only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'hr') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const salary = await Salary.findById(req.params.id);
    
    if (!salary) {
      return res.status(404).json({ message: 'Salary record not found' });
    }

    await salary.deleteOne();
    res.json({ message: 'Salary record deleted' });
  } catch (err) {
    console.error('Error deleting salary:', err.message);
    res.status(500).send('Server Error');
  }
})

// @route   POST api/salaries/bulk
// @desc    Create or update multiple salary records
// @access  Private
router.post('/bulk', auth, async (req, res) => {
  try {
    const { entries } = req.body;
    
    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ message: 'Invalid entries format' });
    }

    const results = [];
    const errors = [];

    for (const entry of entries) {
      const { employee, amount, bonus, bonusReason, date } = entry;
      
      try {
        // Check if salary record already exists for this date
        let existingSalary = await Salary.findOne({
          employee,
          date: new Date(date)
        });

        if (existingSalary) {
          // Update existing record
          existingSalary.amount = amount;
          existingSalary.bonus = bonus || existingSalary.bonus;
          existingSalary.bonusReason = bonusReason || existingSalary.bonusReason;
          await existingSalary.save();
          results.push(existingSalary);
        } else {
          // Create new record
          const newSalary = new Salary({
            employee,
            amount,
            bonus,
            bonusReason,
            date
          });
          await newSalary.save();
          results.push(newSalary);
        }
      } catch (err) {
        errors.push({
          employee,
          date,
          error: err.message
        });
      }
    }

    const populatedResults = await Salary.populate(results, {
      path: 'employee',
      select: 'name email position'
    });

    res.json({
      success: populatedResults,
      errors: errors
    });
  } catch (err) {
    console.error('Error in bulk salary update:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/salaries/missing-entries
// @desc    Get employees without salary entries for current month
// @access  Private
router.get('/missing-entries', auth, async (req, res) => {
  try {
    // Get current month's start and end dates
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get all employees
    const Employee = require('../models/Employee');
    const employees = await Employee.find({}, 'name email position');

    // Get employees with salary entries this month
    const employeesWithSalary = await Salary.distinct('employee', {
      date: {
        $gte: startOfMonth,
        $lte: endOfMonth
      }
    });

    // Filter employees without salary entries
    const employeesWithoutSalary = employees.filter(
      emp => !employeesWithSalary.some(id => id.equals(emp._id))
    );

    res.json(employeesWithoutSalary);
  } catch (err) {
    console.error('Error getting missing entries:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router 