const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
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