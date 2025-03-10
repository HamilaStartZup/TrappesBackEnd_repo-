const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const Registration = require('../models/Registration');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const emailService = require('../utils/emailService');

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

// Prix par type d'inscription (à ajuster selon vos besoins)
const PRICES = {

  // Ajoutez d'autres types d'inscription si nécessaire
  'default': 150
};

// Route pour générer un lien de paiement Stripe et envoyer un email
router.post('/registration/:id/payment-link', async (req, res) => {
  try {
    const registrationId = req.params.id;
    
    // Récupérer les détails de l'inscription depuis la base de données
    const registration = await Registration.findById(registrationId);
    
    if (!registration) {
      return res.status(404).json({ message: "Inscription non trouvée" });
    }
    
    // Déterminer le prix selon le type d'inscription
    const price = PRICES[registration.typeInscription] || PRICES.default;
    
    // Créer une session de paiement Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Inscription - ${registration.typeInscription}`,
            description: `Cotisation pour ${registration.firstName} ${registration.lastName}`
          },
          unit_amount: price * 100, // Stripe utilise des centimes
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: 'https://es-trappes.com/Succes.html', // Remplacez par votre URL
  cancel_url: 'https://es-trappes.com/Echec.html', // Remplacez par votre URL
      client_reference_id: registrationId,
    });
    
    // Stocker l'ID de session dans l'inscription
    registration.paymentSessionId = session.id;
    registration.paymentStatus = 'attente';
    await registration.save();
    
    // Envoyer un email avec le lien de paiement
    const emailResult = await emailService.sendStripePaymentLink(
      registration,
      session.url,
      price
    );
    
    if (!emailResult.success) {
      console.warn('Problème lors de l\'envoi de l\'email, mais le lien de paiement a été généré:', emailResult.error);
    }
    
    res.status(200).json({ 
      message: "Lien de paiement généré et envoyé par email",
      paymentUrl: session.url,
      emailSent: emailResult.success
    });
    
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ message: "Erreur lors de la génération du lien de paiement", error: error.message });
  }
});



module.exports = router;
