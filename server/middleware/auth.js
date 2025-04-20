const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = {
      _id: user._id,
      id: user._id,
      email: user.email,
      role: user.role,
      isHR: user.role === 'hr'
    };
    
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(401).json({ message: 'Token verification failed, authorization denied' });
  }
};

const isHR = (req, res, next) => {
  if (req.user.role !== 'hr') {
    return res.status(403).json({ message: 'Access denied, HR only' });
  }
  next();
};

const isTeamLeader = (req, res, next) => {
  if (req.user.role !== 'leader') {
    return res.status(403).json({ message: 'Access denied, Team Leader only' });
  }
  next();
};

module.exports = { auth, isHR, isTeamLeader }; 