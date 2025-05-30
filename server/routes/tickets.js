const express = require('express')
const router = express.Router()
const Ticket = require('../models/Ticket')
const { auth, isHR } = require('../middleware/auth')

// Get all tickets (HR only)
router.get('/', auth, isHR, async (req, res) => {
  try {
    console.log('Fetching tickets for HR user:', req.user.id);
    const tickets = await Ticket.find()
      .populate({
        path: 'employee',
        select: 'name email',
        options: { retainNullValues: true }
      })
      .sort({ createdAt: -1 });

    // Map tickets to ensure employee data is handled safely
    const safeTickets = tickets.map(ticket => {
      const ticketObj = ticket.toObject();
      if (!ticketObj.employee) {
        ticketObj.employee = { name: 'Former Employee', email: 'N/A' };
      }
      return ticketObj;
    });

    res.json(safeTickets);
  } catch (err) {
    console.error('Error fetching tickets:', err);
    res.status(500).json({ message: err.message });
  }
})

// Get tickets for a specific employee
router.get('/employee/:id', auth, async (req, res) => {
  try {
    const tickets = await Ticket.find({ employee: req.params.id })
      .populate('respondedBy', 'name email')
      .populate('employee', 'name email')
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
    console.log('Received response submission:', {
      ticketId: req.params.id,
      userId: req.user.id,
      response: req.body.response,
      status: req.body.status
    });

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    console.log('Found ticket:', ticket);

    ticket.response = req.body.response;
    ticket.status = req.body.status || 'resolved';
    ticket.respondedAt = Date.now();
    ticket.respondedBy = req.user.id;

    const updatedTicket = await ticket.save();
    console.log('Saved ticket with response:', updatedTicket);

    // Populate the response data before sending
    const populatedTicket = await Ticket.findById(updatedTicket._id)
      .populate('employee', 'name email')
      .populate('respondedBy', 'name email');
    
    console.log('Populated ticket to return:', populatedTicket);

    res.json(populatedTicket);
  } catch (err) {
    console.error('Error in response submission:', err);
    res.status(400).json({ message: err.message });
  }
});

// Delete a ticket (HR only)
router.delete('/:id', auth, isHR, async (req, res) => {
  try {
    console.log('Attempting to delete ticket:', req.params.id);
    const ticket = await Ticket.findById(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    await Ticket.findByIdAndDelete(req.params.id);
    res.json({ message: 'Ticket deleted successfully' });
  } catch (err) {
    console.error('Error deleting ticket:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get a single ticket
router.get('/:id', auth, async (req, res) => {
  try {
    const ticketId = req.params.id;
    const requestingUserId = req.user._id; // Use _id for clarity
    const requestingUserRole = req.user.role;

    console.log(`Fetching single ticket: ${ticketId} for user ${requestingUserId} (Role: ${requestingUserRole})`);
    
    const ticket = await Ticket.findById(ticketId)
      .populate('employee', 'name email') // Ensure employee field name is correct in Ticket model
      .populate('respondedBy', 'name email');

    if (!ticket) {
      console.log(`Ticket not found: ${ticketId}`);
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    // Ensure employee is populated and has an _id
    if (!ticket.employee || !ticket.employee._id) {
        console.error(`Ticket ${ticketId} has missing or unpopulated employee reference.`);
        return res.status(500).json({ message: 'Ticket data incomplete.' }); 
    }

    const ticketOwnerId = ticket.employee._id;

    console.log(`Permission Check: UserRole=${requestingUserRole}, ReqUserID=${requestingUserId.toString()}, TicketOwnerID=${ticketOwnerId.toString()}`);

    // Verify the user has permission to view this ticket
    // Allow if user is HR OR if the user ID matches the ticket's employee ID
    if (requestingUserRole !== 'hr' && ticketOwnerId.toString() !== requestingUserId.toString()) {
      console.log(`Authorization failed for user ${requestingUserId} on ticket ${ticketId} owned by ${ticketOwnerId}`);
      return res.status(403).json({ message: 'Not authorized to view this ticket' });
    }

    console.log(`Authorization successful. Found ticket: ${ticketId}`);
    res.json(ticket);
  } catch (err) {
    console.error(`Error fetching ticket ${req.params.id}:`, err);
    res.status(500).json({ message: 'Server error while fetching ticket' });
  }
});

module.exports = router 