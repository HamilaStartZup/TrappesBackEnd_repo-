const Employee = require('../models/Employee');
const emailService = require('../utils/emailService');

// Ajouter un paiement de salaire
exports.addSalaryPayment = async (req, res, next) => {
  try {
    const { employeeId, hoursWorked } = req.body; // Extraire l'ID de l'employé et le nombre d'heures travaillées du corps de la requête

    // Vérifier que l'employeeId est présent dans la requête
    if (!employeeId) {
      const error = new Error('Employee ID is required');
      error.status = 400;
      throw error;
    }

    const employee = await Employee.findById(employeeId); // Récupérer l'employé par son ID

    // Vérifier si l'employé existe
    if (!employee) {
      const error = new Error('Employee not found'); // Créer une nouvelle erreur si l'employé n'est pas trouvé
      error.status = 404;
      throw error;
    }

    // Vérification des champs nécessaires dans le document de l'employé
    if (!employee.salaryType) {
      const error = new Error('Employee salary type is missing');
      error.status = 400;
      throw error;
    }

    // Vérification du type de salaire de l'employé
    let amount;
    const payment = { date: new Date() };

    if (employee.salaryType === 'Horaire') {
      // Vérifier que le nombre d'heures travaillées est fourni
      if (hoursWorked === undefined) {
        const error = new Error('Hours worked is required for hourly salary type');
        error.status = 400;
        throw error;
      }
      // Vérifier que le nombre d'heures est un nombre positif
      if (hoursWorked <= 0) {
        const error = new Error('Hours worked must be a positive number');
        error.status = 400;
        throw error;
      }

      amount = employee.hourlyRate * hoursWorked; // Calculer le montant total pour le salaire horaire
      payment.hoursWorked = hoursWorked; // Ajouter le nombre d'heures travaillées
    } else if (employee.salaryType === 'Mensuel') {
      amount = employee.monthlySalary; // Utiliser le salaire mensuel directement
    } else {
      const error = new Error('Invalid salary type');
      error.status = 400;
      throw error;
    }

    // Ajouter le montant calculé au paiement
    payment.amount = amount;
    if (!Array.isArray(employee.salaryHistory)) {
      employee.salaryHistory = []; // S'assurer que l'historique est un tableau
    }
    employee.salaryHistory.push(payment); // Ajouter le paiement à l'historique des paiements de l'employé
    await employee.save(); // Sauvegarder les modifications dans la base de données

    // Envoyer l'email de confirmation de paiement de salaire
    await emailService.sendSalaryPaymentConfirmation(employee, payment);

    res.status(200).json(employee); // Répondre avec l'employé mis à jour
  } catch (error) {
    next(error); // Passer l'erreur au middleware de gestion des erreurs
  }
};


// Récupérer l'historique des paiements
exports.getSalaryHistory = async (req, res, next) => {
  try {
    const { employeeId } = req.params; // Extraire l'ID de l'employé des paramètres de la requête

    const employee = await Employee.findById(employeeId); // Récupérer l'employé par son ID
    if (!employee) {
      const error = new Error('Employee not found'); // Créer une nouvelle erreur si l'employé n'est pas trouvé
      error.status = 404;
      throw error;
    }
    res.status(200).json(employee.salaryHistory); // Répondre avec l'historique des paiements de l'employé
  } catch (error) {
    next(error); // Passer l'erreur au middleware de gestion des erreurs
  }
};

// Récupérer tous les employés avec différents filtres
exports.getAllEmployees = async (req, res, next) => {
  try {
    const { licenseNumber, firstName, lastName, contractStatus, positions } = req.query; // Extraire les paramètres de requête

    // Construire l'objet de filtre
    const filter = {};
    if (licenseNumber) filter.licenseNumber = licenseNumber;
    if (firstName) filter.firstName = { $regex: firstName, $options: 'i' }; // Recherche insensible à la casse
    if (lastName) filter.lastName = { $regex: lastName, $options: 'i' }; // Recherche insensible à la casse
    if (contractStatus) filter.contractStatus = contractStatus;
    if (positions) filter.positions = { $in: positions.split(',') }; // Filtrer par positions

    const employees = await Employee.find(filter).select('firstName lastName licenseNumber positions contractStatus'); // Récupérer les employés filtrés
    res.status(200).json(employees); // Répondre avec la liste des employés filtrés
  } catch (error) {
    next(error); // Passer l'erreur au middleware de gestion des erreurs
  }
};

// Récupérer un employé par ID
exports.getEmployeeById = async (req, res, next) => {
  try {
    const { employeeId } = req.params; // Extraire l'ID de l'employé des paramètres de la requête

    const employee = await Employee.findById(employeeId); // Récupérer l'employé par son ID
    if (!employee) {
      const error = new Error('Employee not found'); // Créer une nouvelle erreur si l'employé n'est pas trouvé
      error.status = 404;
      throw error;
    }
    res.status(200).json(employee); // Répondre avec l'employé trouvé
  } catch (error) {
    next(error); // Passer l'erreur au middleware de gestion des erreurs
  }
};

// Créer un nouvel employé
exports.createEmployee = async (req, res, next) => {
  try {
    const { licenseNumber, firstName, lastName, email, phone, birthDate, gender, positions, contractStatus, salaryType, hourlyRate, monthlySalary } = req.body;

    // Valider la présence des champs requis
    if (!licenseNumber || !firstName || !lastName || !email || !phone || !birthDate || !gender || !positions || !contractStatus || !salaryType || (salaryType === 'Horaire' && !hourlyRate) || 
    (salaryType === 'Mensuel' && !monthlySalary)
  )  {
      const error = new Error('Missing required fields');
      error.status = 400;
      throw error;
    }

    // Créer un nouvel employé avec les champs spécifiés
    const employee = new Employee({
      licenseNumber,
      firstName,
      lastName,
      email,
      phone,
      birthDate,
      gender,
      positions,
      contractStatus,
      salaryType,
      hourlyRate, // Sera utilisé uniquement si salaryType est 'Horaire'
      monthlySalary
    });

    // Sauvegarder l'employé dans la base de données
    await employee.save();
    
    // Répondre avec l'employé créé
    res.status(201).json(employee);
  } catch (error) {
    next(error); // Passer l'erreur au middleware de gestion des erreurs
  }
};

// Mettre à jour un employé avec des champs limités
exports.updateEmployee = async (req, res, next) => {
  try {
    const { employeeId } = req.params; // Extraire l'ID de l'employé des paramètres de la requête

    // Extraire uniquement les champs autorisés du corps de la requête
    const { phone, email, positions, contractStatus, monthlySalary, hourlyRate, salaryType } = req.body;

    // Créer un objet de mise à jour avec les champs autorisés
    const updateFields = {};

    if (phone) updateFields.phone = phone;
    if (email) updateFields.email = email;
    if (positions) updateFields.positions = positions;
    if (contractStatus) updateFields.contractStatus = contractStatus;
    if (monthlySalary) updateFields.monthlySalary = monthlySalary;
    if (hourlyRate) updateFields.hourlyRate = hourlyRate;
    if (salaryType) updateFields.salaryType = salaryType;

    // Mettre à jour l'employé avec les champs spécifiés
    const employee = await Employee.findByIdAndUpdate(employeeId, updateFields, { new: true });

    // Vérifier si l'employé existe après la mise à jour
    if (!employee) {
      const error = new Error('Employee not found');
      error.status = 404;
      throw error;
    }

    // Répondre avec l'employé mis à jour
    res.status(200).json(employee);
  } catch (error) {
    next(error); // Passer l'erreur au middleware de gestion des erreurs
  }
};


// Supprimer un employé
exports.deleteEmployee = async (req, res, next) => {
  try {
    const { employeeId } = req.params; // Extraire l'ID de l'employé des paramètres de la requête

    const employee = await Employee.findByIdAndDelete(employeeId); // Supprimer l'employé par son ID
    if (!employee) {
      const error = new Error('Employee not found'); // Créer une nouvelle erreur si l'employé n'est pas trouvé
      error.status = 404;
      throw error;
    }
    res.status(200).json({ message: 'Employee deleted successfully' }); // Répondre avec un message de succès
  } catch (error) {
    next(error); // Passer l'erreur au middleware de gestion des erreurs
  }
};
