const express = require('express')
const router = express.Router()
const Team = require('../models/Team')
const { auth } = require('../middleware/auth')
const mongoose = require('mongoose')

// @route   GET api/teams
// @desc    Get all teams
// @access  Private
router.get('/', auth, (req, res) => {
  Team.find()
    .populate('leader', 'name email')
    .populate('members', 'name email position')
    .then(teams => res.json(teams))
    .catch(err => {
      console.error(err.message)
      res.status(500).send('Server Error')
    })
})

// @route   POST api/teams
// @desc    Create a team
// @access  Private
router.post('/', auth, (req, res) => {
  const { name, description, leader, members } = req.body

  const team = new Team({
    name,
    description,
    leader,
    members
  })

  team.save()
    .then(team => {
      return Team.findById(team._id)
        .populate('leader', 'name email')
        .populate('members', 'name email')
    })
    .then(populatedTeam => res.json(populatedTeam))
    .catch(err => {
      console.error(err.message)
      res.status(500).send('Server Error')
    })
})

// @route   PUT api/teams/:id
// @desc    Update a team
// @access  Private
router.put('/:id', auth, (req, res) => {
  const { name, description, leader, members } = req.body

  Team.findById(req.params.id)
    .then(team => {
      if (!team) {
        return res.status(404).json({ msg: 'Team not found' })
      }

      team.name = name || team.name
      team.description = description || team.description
      team.leader = leader || team.leader
      team.members = members || team.members

      return team.save()
    })
    .then(team => {
      return Team.findById(team._id)
        .populate('leader', 'name email')
        .populate('members', 'name email')
    })
    .then(populatedTeam => res.json(populatedTeam))
    .catch(err => {
      console.error(err.message)
      res.status(500).send('Server Error')
    })
})

// @route   DELETE api/teams/:id
// @desc    Delete a team
// @access  Private
router.delete('/:id', auth, (req, res) => {
  Team.findById(req.params.id)
    .then(team => {
      if (!team) {
        return res.status(404).json({ msg: 'Team not found' })
      }
      return team.deleteOne()
    })
    .then(() => res.json({ msg: 'Team removed' }))
    .catch(err => {
      console.error(err.message)
      res.status(500).send('Server Error')
    })
})

// Get teams for a specific employee
router.get('/employee/:employeeId', auth, async (req, res) => {
    try {
        console.log('Fetching teams for employee:', req.params.employeeId);
        
        // Convert string ID to ObjectId using new keyword
        const employeeId = new mongoose.Types.ObjectId(req.params.employeeId);
        
        const teams = await Team.find({
            $or: [
                { leader: employeeId },
                { members: { $in: [employeeId] } }
            ]
        })
        .populate('leader', 'name email')
        .populate('members', 'name email');
        
        console.log('Found teams:', teams);
        res.json(teams);
    } catch (error) {
        console.error('Error fetching employee teams:', error);
        res.status(500).json({ message: 'Error fetching teams: ' + error.message });
    }
});

module.exports = router 