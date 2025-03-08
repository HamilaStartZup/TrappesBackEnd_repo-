const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const {validateObjectId, validateMemberIds} = require('../middlewares/validationMiddleware');
const authenticateAdmin = require('../middlewares/authMiddleware');

// Route pour mettre à jour des membres par leur ID
router.put('/update-multiple', validateMemberIds, memberController.updateMultipleMembers);

// Route pour créer un nouveau membre
router.post('/',authenticateAdmin, memberController.createMember);

// Route pour obtenir tous les membres
router.get('/', authenticateAdmin, memberController.getAllMembers);

// Route pour obtenir un membre par son ID
router.get('/:id', validateObjectId, memberController.getMemberById);

// Route pour mettre à jour un membre par son ID
router.put('/:id', validateObjectId, memberController.updateMember);

// Route pour supprimer un membre par son ID
router.delete('/:id', validateObjectId, memberController.deleteMember);

// Route pour ajouter un paiement à un membre par son ID
router.post('/:id/payment', validateObjectId, memberController.addPayment);

// Route pour envoyer des rappels de paiement à tous les membres concernés
router.post('/send-payment-reminders', memberController.sendPaymentReminders);



module.exports = router;