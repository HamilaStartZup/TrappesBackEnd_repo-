const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registrationController');
const authenticateAdmin = require('../middlewares/authMiddleware');

// Route pour créer une nouvelle inscription (accessible sans authentification)
router.post('/', registrationController.createRegistration);

// Route pour récupérer toutes les inscriptions (réservée aux administrateurs)
router.get('/', authenticateAdmin, registrationController.getRegistrations);

// Route pour récupérer une inscription spécifique par ID (réservée aux administrateurs)
router.get('/:id', authenticateAdmin, registrationController.getRegistrationById);

// Route pour mettre à jour une inscription (réservée aux administrateurs)
router.put('/:id', authenticateAdmin, registrationController.updateRegistration);

// Route pour supprimer une inscription (réservée aux administrateurs)
router.delete('/:id', authenticateAdmin, registrationController.deleteRegistration);

module.exports = router;
