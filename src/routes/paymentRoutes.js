const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Route webhook Stripe
router.post(
    '/stripe-webhook',
    express.raw({ type: 'application/json' }),
    paymentController.handleStripeWebhook
  );

// Route pour vérifier le montant dû
router.get('/check-amount-due', paymentController.checkAmountDue);

// Route pour demander un lien de paiement Stripe
router.post('/request-payment-link', express.json(), paymentController.requestPaymentLink);



module.exports = router;
