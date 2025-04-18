const express = require('express')
const router = express.Router()
const Ticket = require('../models/Ticket')
const { auth, isHR } = require('../middleware/auth')

// Get all tickets (HR only)
router.get('/', auth, isHR, async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .populate('employee', 'name email')
      .sort({ createdAt: -1 })
    res.json(tickets)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Get tickets for a specific employee
router.get('/employee/:id', auth, async (req, res) => {
  try {
    const tickets = await Ticket.find({ employee: req.params.id })
      .sort({ createdAt: -1 })
    res.json(tickets)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Create a new ticket
router.post('/', auth, async (req, res) => {
  try {
    const ticket = new Ticket({
      title: req.body.title,
      description: req.body.description,
      priority: req.body.priority,
      employee: req.body.employee,
      status: 'pending'
    })

    const newTicket = await ticket.save()
    res.status(201).json(newTicket)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// Update ticket status (HR only)
router.put('/:id', auth, isHR, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' })
    }

    ticket.status = req.body.status
    const updatedTicket = await ticket.save()
    res.json(updatedTicket)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// Submit response to ticket (HR only)
router.post('/:id/response', auth, isHR, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' })
    }

    ticket.response = req.body.response
    ticket.status = req.body.status || 'resolved'
    ticket.respondedAt = Date.now()
    ticket.respondedBy = req.user.id

    const updatedTicket = await ticket.save()
    await updatedTicket.populate('employee', 'name email')
    res.json(updatedTicket)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

module.exports = router 