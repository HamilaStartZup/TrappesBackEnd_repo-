const moment = require('moment');
const Employee = require('../../models/Employee');
const extractNameParts = require('./nameExtractor');
const { normalizePhoneNumber } = require('./phoneHelper');
const calculateAge = require('./calculateAge');

// Génère des valeurs par défaut pour un employé
const generateDefaultValuesForEmployee = (firstName, lastName, row, comments) => {
  // Numéro de licence par défaut si manquant
  const licenseNumber = row['Numéro licence'] || `TEMP_${firstName}_${lastName}`;
  if (!row['Numéro licence']) {
    comments.push('Numéro de licence manquant. Un numéro temporaire a été généré.');
  }

  let birthDate = row['Né(e) le'];
  // Vérification et formatage de la date de naissance
  if (birthDate && moment(birthDate, 'DD/MM/YYYY', true).isValid()) {
    birthDate = moment(birthDate, 'DD/MM/YYYY').format('DD/MM/YYYY');
  } else {
    birthDate = null;
    comments.push('Date de naissance invalide ou manquante.');
  }

  // Calcul de l'âge à partir de la date de naissance
  const age = calculateAge(birthDate);

  // Normalisation du numéro de téléphone
  const phone = normalizePhoneNumber(row['Mobile personnel']) || '00 00 00 00 00';
  if (phone === '00 00 00 00 00') {
    comments.push('Numéro de téléphone manquant. Un numéro par défaut a été utilisé.');
  }

  // Génération de l'email par défaut si manquant
  const email = row['Email principal'] || `${lastName.toLowerCase()}.${firstName.toLowerCase()}@placeholder.com`;
  if (!row['Email principal']) {
    comments.push('Email principal manquant. Un email par défaut a été généré.');
  }

  return { licenseNumber, birthDate, age, phone, email };
};

// Traitement d'un employé
const processEmployee = async (row, existingLicenseNumbers = new Set()) => {
  const comments = row.comments || []; // Prend les commentaires existants ou en crée un tableau

  // Extraction du prénom et nom
  const { firstName, lastName } = extractNameParts(row['Nom, prénom']);

  // Génération des valeurs par défaut pour l'employé
  const { licenseNumber, birthDate, age, phone, email } =
    generateDefaultValuesForEmployee(firstName, lastName, row, comments);

  // Vérification des doublons de numéro de licence
  if (existingLicenseNumbers.has(licenseNumber)) {
    comments.push('Ce numéro de licence existe déjà.');
  }

  // Extraction des sous-catégories
  const positions = row['Sous catégorie'] ? [row['Sous catégorie']] : ['Poste non spécifié'];

  // Recherche de l'employé existant
  let employee = await Employee.findOne({ licenseNumber });

  if (!employee) {
    // Création d'un nouvel employé
    employee = new Employee({ firstName, lastName, email, phone, licenseNumber, positions, birthDate, age, comments });
  } else {
    // Ajout de la nouvelle sous-catégorie si elle n'existe pas déjà
    if (row['Sous catégorie'] && !employee.positions.includes(row['Sous catégorie'])) {
      employee.positions.push(row['Sous catégorie']);
      comments.push('Nouvelle sous-catégorie ajoutée.');
    }
  }

  // Validation avant l'insertion en base de données
  await employee.validate();
  await employee.save();

  return { employee, licenseNumber, comments };
};

module.exports = processEmployee;
