require('dotenv').config(); // Charger les variables d'environnement
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Member = require('../models/Member');
const Registration = require('../models/Registration');
const emailService = require('../utils/emailService');

// ✅ Vérifier le montant dû pour un membre
exports.checkAmountDue = async (req, res) => {
  try {
    const { licenseNumber, email } = req.query;

    // Validation des entrées
    if (!licenseNumber || !email) {
      return res.status(400).json({ message: "License number et email requis" });
    }

    const member = await Member.findOne({ licenseNumber, email });
    if (!member) {
      return res.status(404).json({ message: 'Membre non trouvé' });
    }

    const amountDue = Math.max(member.totalDue - member.totalPaid, 0);
    res.json({ amountDue });
  } catch (error) {
    console.error('Erreur checkAmountDue:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ✅ Demander un lien de paiement Stripe
exports.requestPaymentLink = async (req, res) => {
  try {
    const { licenseNumber, email, amountToPay } = req.body;

    if (!licenseNumber || !email || amountToPay === undefined) {
      return res.status(400).json({ message: "License number, email et montant requis" });
    }

    if (isNaN(amountToPay) || amountToPay <= 0) {
      return res.status(400).json({ message: "Montant invalide" });
    }

    const member = await Member.findOne({ licenseNumber, email });
    if (!member) {
      return res.status(404).json({ message: 'Membre non trouvé' });
    }

    const amountDue = Math.max(member.totalDue - member.totalPaid, 0);
    if (amountToPay > amountDue) {
      return res.status(400).json({ message: `Montant trop élevé. Maximum: ${amountDue} €` });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: 'Cotisation' },
          unit_amount: Math.round(amountToPay * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: process.env.SUCCESS_URL || 'https://yourdomain.com/success',
      cancel_url: process.env.CANCEL_URL || 'https://yourdomain.com/cancel',
      metadata: { memberId: member._id.toString() },
    });

    res.json({ amountDue, url: session.url });
  } catch (error) {
    console.error('Erreur requestPaymentLink:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ✅ Gérer les webhooks Stripe
exports.handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body, // Raw buffer
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const amount = session.amount_total / 100;

      if (session.metadata && session.metadata.memberId) {
        const memberId = session.metadata.memberId;
        try {
          const member = await Member.findById(memberId);
          if (!member) {
            console.warn(`Membre introuvable: ${memberId}`);
            return res.status(200).json({ received: true, warning: "Membre non trouvé" });
          }

          member.paymentHistory.push({
            amount,
            paymentMethod: 'carte bancaire',
            date: new Date(),
            status: 'completed',
          });

          member.totalPaid += amount;
          if (member.totalPaid >= member.totalDue) {
            member.totalDue = 0;
            member.paymentStatus = 'paid';
          } else {
            member.paymentStatus = 'partial';
          }

          await member.save();
          console.log(`✅ Paiement membre enregistré: ID ${memberId}, Montant: ${amount}€`);

          // Envoi de l'email de confirmation de paiement
          await emailService.sendPaymentConfirmation(member, { amount });
        } catch (error) {
          console.error('❌ Erreur mise à jour membre:', error);
          return res.status(200).json({ received: true, processingError: error.message });
        }
      } else if (session.client_reference_id) {
        const registrationId = session.client_reference_id;
        try {
          const registration = await Registration.findById(registrationId);
          if (!registration) {
            console.warn(`Inscription introuvable: ${registrationId}`);
            return res.status(200).json({ received: true, warning: "Inscription non trouvée" });
          }

          registration.paymentStatus = 'paid';
          await registration.save();
          console.log(`✅ Paiement d'inscription enregistré: ID ${registrationId}, Montant: ${amount}€`);

          // Envoi de l'email de confirmation de paiement
          await emailService.sendRegistrationPaymentConfirmation(registration, amount);
        } catch (error) {
          console.error('❌ Erreur mise à jour inscription:', error);
          return res.status(200).json({ received: true, processingError: error.message });
        }
      } else {
        console.warn("Session de paiement sans identifiant de membre ou d'inscription`");
      }
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('❌ Erreur Webhook:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
};

