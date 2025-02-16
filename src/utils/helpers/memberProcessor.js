const moment = require('moment');
const Member = require('../../models/Member');
const extractNameParts = require('./nameExtractor');
const getCategoryAndGender = require('./categoryGenderHelper');
const { normalizePhoneNumber } = require('./phoneHelper');
const calculateAge = require('./calculateAge');

// Génère des valeurs par défaut pour un membre
const generateDefaultValues = (firstName, lastName, row, comments) => {
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

// Traitement d'un membre
const processMember = async (row, existingLicenseNumbers = new Set()) => {
  const comments = row.comments || []; // Prend les commentaires existants ou en crée un tableau

  // Extraction du prénom et nom
  const { firstName, lastName } = extractNameParts(row['Nom, prénom']);

  // Génération des valeurs par défaut pour le membre
  const { licenseNumber, birthDate, age, phone, email } = generateDefaultValues(firstName, lastName, row, comments);

  // Vérification des doublons de numéro de licence
  if (existingLicenseNumbers.has(licenseNumber)) {
    comments.push('Ce numéro de licence existe déjà.');
  }

  // Extraction de la catégorie et du genre
  const { category, gender } = getCategoryAndGender(row['Sous catégorie'] || '');

  // Calcul des montants dus et payés
  const solde = parseFloat(row['Solde']?.replace(',', '.') || 0);
  const totalDue = solde > 0 ? solde : 0;
  const totalPaid = solde < 0 ? Math.abs(solde) : 0;
  let paymentStatus = 'unpaid';

  // Détermination du statut de paiement
  if (totalPaid >= totalDue) {
    paymentStatus = 'paid';
  } else if (totalPaid > 0) {
    paymentStatus = 'partial';
  }

  // Création du membre
  const member = new Member({
    firstName,
    lastName,
    licenseNumber,
    email,
    phone,
    birthDate,
    gender,
    age,
    category,
    active: row['Statut Licence'] === 'V',
    totalDue,
    totalPaid,
    paymentStatus,
    comments
  });

  // Validation avant l'insertion en base de données
  await member.validate();
  return { member, licenseNumber, comments };
};

module.exports = processMember;
