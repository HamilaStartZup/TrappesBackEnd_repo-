const express = require('express');
const EmployeeController = require('../controllers/employeeController');
const {validateObjectId} = require('../middlewares/validationMiddleware');
const router = express.Router();

// Routes pour gérer les employés
router.get('/', EmployeeController.getAllEmployees);          // Récupérer tous les employés
router.get('/:employeeId', validateObjectId, EmployeeController.getEmployeeById); // Récupérer un employé par ID
router.post('/', EmployeeController.createEmployee);          // Créer un nouvel employé
router.put('/:employeeId', validateObjectId, EmployeeController.updateEmployee); // Mettre à jour un employé
router.delete('/:employeeId', validateObjectId, EmployeeController.deleteEmployee); // Supprimer un employé

// Routes pour gérer les salaires
router.post('/salary', EmployeeController.addSalaryPayment);    // Ajouter un paiement de salaire
router.get('/:employeeId/salary', validateObjectId, EmployeeController.getSalaryHistory); // Historique des paiements

module.exports = router;
