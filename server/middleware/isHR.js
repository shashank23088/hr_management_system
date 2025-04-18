const isHR = (req, res, next) => {
  // Check if user exists and has HR role
  if (!req.user || req.user.role !== 'hr') {
    return res.status(403).json({ 
      message: 'Access denied. HR role required.' 
    })
  }
  next()
}

module.exports = isHR 