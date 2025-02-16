const moment = require('moment');


//  Calcule l'âge en années à partir d'une date de naissance donnée au format "DD/MM/YYYY.
const calculateAge = (birthDateString) => {
  if (!birthDateString) return null;
  
  const birthDate = moment(birthDateString, 'DD/MM/YYYY', true);
  if (!birthDate.isValid()) {
    console.warn(`Format de date invalide: ${birthDateString}`);
    return null;
  }

  return moment().diff(birthDate, 'years');
};

module.exports = calculateAge;
