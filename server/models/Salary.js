const mongoose = require('mongoose');

const SalarySchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  raise: {
    type: Number,
    default: 0,
  },
  raiseReason: {
    type: String,
  },
  date: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Salary', SalarySchema); 