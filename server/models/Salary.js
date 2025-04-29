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
    min: 0,
  },
  raise: {
    type: Number,
    default: 0,
    min: 0,
  },
  raiseReason: {
    type: String,
    trim: true,
  },
  date: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  toJSON: { 
    getters: true,
    transform: function(doc, ret) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Ensure indexes for better query performance
SalarySchema.index({ employee: 1, date: -1 });

module.exports = mongoose.model('Salary', SalarySchema); 