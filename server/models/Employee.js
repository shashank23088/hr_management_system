const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  position: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
  joiningDate: {
    type: Date,
    required: true,
  },
  baseSalary: {
    type: Number,
    required: true,
  },
  totalSalary: {
    type: Number,
    required: true,
  },
  lastRaise: {
    type: {
      amount: Number,
      reason: String,
      date: Date
    },
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Virtual field to get all salary records
EmployeeSchema.virtual('salaryHistory', {
  ref: 'Salary',
  localField: '_id',
  foreignField: 'employee'
});

// Method to update total salary
EmployeeSchema.methods.updateTotalSalary = async function() {
  const Salary = mongoose.model('Salary');
  
  // Get all raises for this employee
  const salaryRecords = await Salary.find({ 
    employee: this._id,
    raise: { $gt: 0 } // Only get records with raises
  }).sort({ date: -1 }); // Sort by date descending

  // Calculate total raises
  const totalRaises = salaryRecords.reduce((sum, record) => sum + (record.raise || 0), 0);
  
  // Update total salary and last raise
  this.totalSalary = this.baseSalary + totalRaises;
  
  if (salaryRecords.length > 0) {
    this.lastRaise = {
      amount: salaryRecords[0].raise,
      reason: salaryRecords[0].raiseReason,
      date: salaryRecords[0].date
    };
  }

  await this.save();
  return this.totalSalary;
};

// Pre-save hook to ensure totalSalary is set
EmployeeSchema.pre('save', function(next) {
  if (!this.totalSalary) {
    this.totalSalary = this.baseSalary;
  }
  next();
});

module.exports = mongoose.model('Employee', EmployeeSchema); 