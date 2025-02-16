const mongoose = require('mongoose');
const moment = require('moment');
const calculateAge = require('../utils/helpers/calculateAge');

const SalarySchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  date: { type: Date, required: true, default: Date.now },
  hoursWorked: { type: Number, required: false },
});

const EmployeeSchema = new mongoose.Schema({
  licenseNumber: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  gender: { type: String, enum: ['M', 'F', 'Unknown'] },
  positions: [{ type: String, required: true }],
  contractStatus: { type: String, enum: ['CDI', 'CDD', 'Indépendant'] },
  monthlySalary: { type: Number, required: false },
  hourlyRate: { type: Number, required: false },
  salaryType: { type: String, enum: ['Mensuel', 'Horaire'] },
  salaryHistory: [SalarySchema],
  birthDate: { type: String, required: true },
  age: { type: Number, required: false },
  comments: { type: [String] },
});

// Middleware pré-sauvegarde pour calculer l'âge
EmployeeSchema.pre('save', function (next) {
  this.age = calculateAge(this.birthDate);
  next();
});

module.exports = mongoose.model('Employee', EmployeeSchema);