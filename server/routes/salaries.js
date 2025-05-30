const express = require('express')
const router = express.Router()
const Salary = require('../models/Salary')
const Employee = require('../models/Employee')
const mongoose = require('mongoose')
const { auth } = require('../middleware/auth')

// @route   GET api/salaries
// @desc    Get consolidated salary overview for all employees
// @access  Private (HR Only)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'hr') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // --- Restore Full Aggregation Pipeline with Explicit Lookup --- 
    const salaryOverview = await Employee.aggregate([
      {
        $match: { status: 'active' } // Optional: Only show active employees
      },
      {
        $lookup: {
          from: 'salaries', 
          let: { employeeId: "$_id" }, // Define variable for Employee ID
          pipeline: [
            { $match:
              { $expr:
                { $eq: [ "$employee", "$$employeeId" ] } // Match Salary.employee with the variable
              }
            }
          ],
          as: 'salaryRecords'
        }
      },
      {
        $addFields: {
          latestSalaryRecord: {
            $first: {
              $sortArray: { input: "$salaryRecords", sortBy: { date: -1 } }
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          position: 1,
          currentAmount: { $ifNull: ["$latestSalaryRecord.amount", "$salary"] }, 
          currentRaise: { $ifNull: ["$latestSalaryRecord.raise", 0] },
          currentRaiseReason: { $ifNull: ["$latestSalaryRecord.raiseReason", null] },
          latestSalaryDate: { $ifNull: ["$latestSalaryRecord.date", "$joiningDate"] }, 
          salaryRecordId: { $ifNull: ["$latestSalaryRecord._id", null] } 
        }
      },
      {
          $sort: { name: 1 } 
      }
    ]);
    // --- End Restore Full Aggregation --- 
    
    // Optional: Keep logging for one more check
    console.log("GET /api/salaries - Final Aggregation Result:", JSON.stringify(salaryOverview, null, 2));

    res.json(salaryOverview);

  } catch (err) {
    console.error('Error fetching consolidated salary overview:', err);
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

    const { employee: employeeId, amount, date, raise, raiseReason } = req.body;

    // Basic validation
    if (!employeeId || !amount || !date) {
      return res.status(400).json({ message: 'Please provide employee, amount, and date' });
    }

    // Get employee record
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Create new salary record
    const salary = new Salary({
      employee: employeeId,
      amount,
      date: new Date(date),
      raise: raise || 0,
      raiseReason: raiseReason || ''
    });

    const savedSalary = await salary.save();

    // Update employee's base salary and recalculate total
    employee.baseSalary = amount;
    await employee.save();
    await employee.updateTotalSalary();

    // Return populated salary record
    const populatedSalary = await Salary.findById(savedSalary._id)
      .populate('employee', 'name email position baseSalary totalSalary');

    res.json(populatedSalary);
  } catch (err) {
    console.error('Error creating salary:', err.message);
    res.status(500).json({ message: 'Failed to create salary record' });
  }
});

// @route   PUT api/salaries/:id
// @desc    Update a salary record
// @access  Private (HR Only)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'hr') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { amount: baseAmount, date, raise, raiseReason } = req.body;
    
    // Validate inputs
    if (!baseAmount || !date) {
      return res.status(400).json({ message: 'Base amount and date are required' });
    }

    // Log the incoming request for debugging
    console.log('Updating salary record:', {
      salaryId: req.params.id,
      body: req.body
    });

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.error('Invalid salary ID format:', req.params.id);
      return res.status(400).json({ message: 'Invalid salary ID format' });
    }

    // Find the salary record
    const salary = await Salary.findById(req.params.id);
    if (!salary) {
      return res.status(404).json({ message: 'Salary record not found' });
    }

    try {
      // Update salary record with validated data
      salary.amount = parseFloat(baseAmount);
      salary.date = new Date(date);
      salary.raise = raise ? parseFloat(raise) : 0;
      salary.raiseReason = raiseReason || '';

      await salary.save();

      // Get and update the employee record
      const employee = await Employee.findById(salary.employee);
      if (!employee) {
        throw new Error('Employee not found');
      }

      // Update employee's base salary
      employee.baseSalary = parseFloat(baseAmount);

      // Calculate total salary including all raises
      const allRaises = await Salary.find({ 
        employee: employee._id,
        raise: { $gt: 0 }
      }).sort({ date: -1 });

      const totalRaises = allRaises.reduce((sum, record) => sum + (record.raise || 0), 0);
      employee.totalSalary = employee.baseSalary + totalRaises;

      // Update last raise information if applicable
      if (allRaises.length > 0) {
        employee.lastRaise = {
          amount: allRaises[0].raise,
          reason: allRaises[0].raiseReason,
          date: allRaises[0].date
        };
      }

      await employee.save();
      
      // Return updated salary record with populated employee data
      const updatedSalary = await Salary.findById(salary._id)
        .populate('employee', 'name email position baseSalary totalSalary');

      res.json(updatedSalary);
    } catch (error) {
      console.error('Update error:', {
        error: error.message,
        stack: error.stack,
        salaryId: req.params.id,
        employeeId: salary.employee
      });
      throw error;
    }
  } catch (err) {
    console.error('Error updating salary:', {
      error: err.message,
      stack: err.stack,
      params: req.params,
      body: req.body
    });
    res.status(500).json({ 
      message: 'Failed to update salary record',
      details: err.message
    });
  }
});

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

    // Store employee ID before deleting salary record
    const employeeId = salary.employee;

    await salary.deleteOne();

    // Update employee's total salary after deleting the record
    const employee = await Employee.findById(employeeId);
    if (employee) {
      await employee.updateTotalSalary();
    }

    res.json({ message: 'Salary record removed' });
  } catch (err) {
    console.error('Error deleting salary:', err.message);
    res.status(500).send('Server Error');
  }
});

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