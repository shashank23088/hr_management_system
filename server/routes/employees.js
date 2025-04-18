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

module.exports = router 