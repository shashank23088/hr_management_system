const express = require('express')
const router = express.Router()
const Salary = require('../models/Salary')
const { auth } = require('../middleware/auth')

// @route   GET api/salaries
// @desc    Get all salary records
// @access  Private
router.get('/', auth, (req, res) => {
  Salary.find()
    .populate('employee', 'name email')
    .then(salaries => res.json(salaries))
    .catch(err => {
      console.error(err.message)
      res.status(500).send('Server Error')
    })
})

// @route   GET api/salaries/employee/:employeeId
// @desc    Get salary records for a specific employee
// @access  Private
router.get('/employee/:employeeId', auth, async (req, res) => {
  try {
    // Only allow HR or the employee themselves to access their records
    if (req.user.role !== 'hr' && req.user.id !== req.params.employeeId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const salary = await Salary.findOne({ employee: req.params.employeeId })
      .sort({ date: -1 })
      .populate('employee', 'name email');

    if (!salary) {
      return res.status(404).json({ message: 'Salary record not found' });
    }

    res.json(salary);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/salaries
// @desc    Create a salary record
// @access  Private
router.post('/', auth, (req, res) => {
  const { employee, amount, bonus, bonusReason, date } = req.body

  const salary = new Salary({
    employee,
    amount,
    bonus,
    bonusReason,
    date
  })

  salary.save()
    .then(salary => res.json(salary))
    .catch(err => {
      console.error(err.message)
      res.status(500).send('Server Error')
    })
})

// @route   PUT api/salaries/:id
// @desc    Update a salary record
// @access  Private
router.put('/:id', auth, (req, res) => {
  const { amount, bonus, bonusReason, date } = req.body

  Salary.findById(req.params.id)
    .then(salary => {
      if (!salary) {
        return res.status(404).json({ msg: 'Salary record not found' })
      }

      salary.amount = amount || salary.amount
      salary.bonus = bonus || salary.bonus
      salary.bonusReason = bonusReason || salary.bonusReason
      salary.date = date || salary.date

      return salary.save()
    })
    .then(salary => res.json(salary))
    .catch(err => {
      console.error(err.message)
      res.status(500).send('Server Error')
    })
})

module.exports = router 