const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['employee', 'hr', 'admin'],
    default: 'employee'
  },
  resetOTP: {
    type: String,
    select: false
  },
  resetOTPExpire: {
    type: Date,
    select: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Only hash the password if it's being modified and not already hashed
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  // Check if password is already hashed
  if (this.password.startsWith('$2a$')) {
    return next();
  }

  // Use a consistent salt for all passwords
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate OTP for password reset
UserSchema.methods.generateOTP = function() {
  // Generate 4 digit OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  
  // Hash OTP before saving to database
  this.resetOTP = bcrypt.hashSync(otp, 10);
  
  // Set expire time - 15 minutes
  this.resetOTPExpire = Date.now() + 15 * 60 * 1000;
  
  return otp;
};

// Verify OTP
UserSchema.methods.verifyOTP = async function(enteredOTP) {
  if (!this.resetOTP || !this.resetOTPExpire || Date.now() > this.resetOTPExpire) {
    return false;
  }
  return await bcrypt.compare(enteredOTP, this.resetOTP);
};

module.exports = mongoose.model('User', UserSchema); 