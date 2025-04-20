const mongoose = require('mongoose');

const PerformanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: [true, 'Employee is required'],
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: [true, 'Team is required'],
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: [true, 'Task is required'],
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot be more than 5'],
  },
  feedback: {
    type: String,
    required: [true, 'Feedback is required'],
    trim: true,
  },
  goals: {
    type: String,
    trim: true,
  },
  strengths: {
    type: String,
    trim: true,
  },
  areasForImprovement: {
    type: String,
    trim: true,
  },
  ratedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: [true, 'Rated by is required'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add indexes for better query performance
PerformanceSchema.index({ employee: 1, createdAt: -1 });
PerformanceSchema.index({ team: 1 });
PerformanceSchema.index({ ratedBy: 1 });

module.exports = mongoose.model('Performance', PerformanceSchema); 