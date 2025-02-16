const ExcelJS = require('exceljs');  // Librairie pour manipuler les fichiers Excel
const Member = require('../models/Member');  
const Employee = require('../models/Employee');  
const processMember = require('../utils/helpers/memberProcessor');  
const processEmployee = require('../utils/helpers/employeeProcessor');  
const { normalizePhoneNumber } = require('../utils/helpers/phoneHelper'); 
const moment = require('moment');  // Librairie pour la gestion des dates

// Importation des membres et employés depuis un fichier
exports.importMembers = async (req, res, next) => {
  try {
    console.log("Début de l'importation des membres et employés...");

    // Vérification si un fichier a été envoyé dans la requête
    if (!req.file) {
      console.log("Aucun fichier n'a été uploadé");
      return res.status(400).json({ message: "Aucun fichier n'a été uploadé" });
    }

    console.log("Lecture du fichier Excel...");
    // Chargement du fichier Excel avec ExcelJS
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(req.file.path);
    const worksheet = workbook.worksheets[0];  // Récupération de la première feuille du fichier Excel

    console.log("Feuilles disponibles dans le fichier Excel :", workbook.worksheets.map(ws => ws.name));
    const columnHeaders = worksheet.getRow(1).values;  // Récupération des en-têtes de colonnes
    console.log("Titres des colonnes :", columnHeaders);

    const data = [];
    // Parcours des lignes de la feuille, à partir de la ligne 2 (les données commencent à partir de la 2ème ligne)
    worksheet.eachRow((row, rowIndex) => {
      if (rowIndex > 1) {  // Ignore la première ligne d'en-têtes
        const rowData = {};
        row.eachCell((cell, colIndex) => {
          const columnName = columnHeaders[colIndex];  // Récupération du nom de la colonne
          // Si la cellule contient une date, elle est formatée, sinon elle est nettoyée (espaces, etc.)
          rowData[columnName] = cell.type === ExcelJS.ValueType.Date ? moment(cell.value).format('DD/MM/YYYY') : cell.text.trim();
        });
        data.push(rowData);  // Ajoute la ligne de données traitées au tableau
      }
    });

    console.log("Nombre total de lignes extraites :", data.length);

    // Filtrage des données pour exclure certaines lignes
    const excludedValues = ["Problème Affectation ANCV", "AUTRES CAS", "MEMBRES SANS LICENCE", "LICENCES A FORMALISER"];
    const filteredData = data.filter(row => row['Nom, prénom']?.trim() && !excludedValues.includes(row['Nom, prénom'].trim()));

    console.log("Nombre de lignes après filtrage :", filteredData.length);

    const members = [];  // Tableau pour stocker les membres traités
    const employees = [];  // Tableau pour stocker les employés traités
    const successfulImports = { members: [], employees: [] };  // Suivi des imports réussis par licence et email

    console.log("Début du traitement des données...");
    // Traitement des données filtrées (chaque ligne est une promesse)
    const promises = filteredData.map(async (row) => {
      row['Mobile personnel'] = normalizePhoneNumber(row['Mobile personnel']);  // Normalisation du numéro de téléphone
      const licenseType = (row['Type licence']?.trim() || '').toLowerCase();  // Récupération du type de licence

      try {
        // Si le type de licence est "libre" ou vide, on traite comme un membre
        if (['libre', '', null].includes(licenseType)) {
          const result = await processMember(row);  // Traitement du membre
          if (result?.member) {
            members.push(result.member);  // Ajout du membre traité au tableau
            successfulImports.members.push(result.licenseNumber);  // Ajout du numéro de licence à la liste des imports réussis
            console.log(`Membre préparé : ${result.licenseNumber}`);
          }
        } else {  // Sinon, on traite comme un employé
          const result = await processEmployee(row);  // Traitement de l'employé
          if (result?.employee) {
            employees.push(result.employee);  // Ajout de l'employé traité au tableau
            successfulImports.employees.push(result.email);  // Ajout de l'email à la liste des imports réussis
            console.log(`Employé préparé : ${result.email}`);
          }
        }
      } catch (error) {
        console.error("Erreur lors du traitement d'une ligne:", error);  
      }
    });

    // Attente de la fin de tous les traitements
    await Promise.all(promises);

    console.log(`Nombre de membres préparés pour insertion : ${members.length}`);
    console.log(`Nombre d'employés préparés pour insertion : ${employees.length}`);

    // Vérification des doublons avant l'insertion
    const existingMemberLicenses = new Set(
      (await Member.find({}, { licenseNumber: 1 }).lean()).map(m => m.licenseNumber)
    );
    const existingEmployeeLicenses = new Set(
      (await Employee.find({}, { licenseNumber: 1 }).lean()).map(e => e.licenseNumber)
    );

    // Filtrage des membres et employés qui ne sont pas déjà dans la base de données
    const membersToInsert = members.filter(member => !existingMemberLicenses.has(member.licenseNumber));
    const employeesToInsert = employees.filter(employee => !existingEmployeeLicenses.has(employee.licenseNumber));

    console.log(`Membres à insérer après vérification des doublons : ${membersToInsert.length}`);
    console.log(`Employés à insérer après vérification des doublons : ${employeesToInsert.length}`);

    // Insertion des membres dans la base de données
    if (membersToInsert.length > 0) {
      await Member.insertMany(membersToInsert);
      console.log("Insertion des membres réussie. Membres insérés :", membersToInsert.map(m => m.licenseNumber));
    }
    // Insertion des employés dans la base de données
    if (employeesToInsert.length > 0) {
      await Employee.insertMany(employeesToInsert);
      console.log("Insertion des employés réussie. Employés insérés :", employeesToInsert.map(e => e.email));
    }

    // Vérification du nombre réel d'employés insérés après insertion
    const insertedEmployeesCount = await Employee.countDocuments();
    console.log(`Nombre total d'employés en base après insertion : ${insertedEmployeesCount}`);

    console.log("Importation terminée avec succès.");
    // Réponse avec un résumé de l'importation
    res.status(200).json({
      message: 'Importation terminée',
      summary: {
        members: { total: members.length, successful: membersToInsert.length },
        employees: { total: employees.length, successful: insertedEmployeesCount }
      }
    });
  } catch (error) {
    console.error("Erreur durant l'importation :", error);  // Log de l'erreur globale
    next(error);  // Passer l'erreur au middleware suivant
  }
};

// Récupération des membres et employés ayant des commentaires
exports.getEntriesWithComments = async (req, res, next) => {
  try {
    // Recherche des membres et employés ayant des commentaires
    const membersWithComments = await Member.find({ comments: { $ne: [] } });
    const employeesWithComments = await Employee.find({ comments: { $ne: [] } });

    // Réponse avec les entrées trouvées
    res.status(200).json({ members: membersWithComments, employees: employeesWithComments });
  } catch (error) {
    next(error);  // Passer l'erreur au middleware suivant
  }
};
