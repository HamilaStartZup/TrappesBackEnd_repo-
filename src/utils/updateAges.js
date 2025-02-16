const moment = require('moment');
const Member = require('../models/Member');
const Employee = require('../models/Employee');
const calculateAge = require('./helpers/calculateAge');

const updateAges = async () => {
  try {
    console.log('Mise à jour des âges en cours...');

    const employees = await Employee.find();
    for (let emp of employees) {
      emp.age = calculateAge(emp.birthDate);
      await emp.save();
    }

    const members = await Member.find();
    for (let mem of members) {
      mem.age = calculateAge(mem.birthDate);
      await mem.save();
    }

    console.log('Mise à jour des âges terminée avec succès.');
  } catch (error) {
    console.error('Erreur lors de la mise à jour des âges :', error);
  }
};

module.exports = updateAges;
