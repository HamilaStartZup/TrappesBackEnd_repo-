const nodemailer = require('nodemailer');

// Configurer le transporteur pour envoyer des emails
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE, // Service d'email (par exemple, Gmail)
  auth: {
    user: process.env.EMAIL_USER, // Adresse email de l'expéditeur
    pass: process.env.EMAIL_PASS // Mot de passe de l'expéditeur
  },
  tls: {
    rejectUnauthorized: false // Désactiver la vérification TLS pour les certificats auto-signés
  }
});

// Fonction pour envoyer un rappel de paiement
exports.sendPaymentReminder = async (member) => {
  try {
    // Envoyer l'email de rappel de paiement
    await transporter.sendMail({
      from: process.env.EMAIL_USER, // Adresse email de l'expéditeur
      to: member.email, // Adresse email du destinataire (membre)
      subject: 'Rappel de Paiement - Football Club', // Sujet de l'email
      text: `Cher ${member.firstName},\n\nCeci est un rappel que votre paiement de ${member.totalDue - member.totalPaid}€ est en attente.\n\nCordialement,\nFootball Club` // Contenu de l'email
    });
    return true; // Retourner true si l'email est envoyé avec succès
  } catch (error) {
    console.error('Échec de l\'envoi de l\'email:', error); // Loguer l'erreur en cas d'échec
    return false; // Retourner false si l'email n'a pas pu être envoyé
  }
};

// Fonction pour envoyer une confirmation de paiement
exports.sendPaymentConfirmation = async (member, payment) => {
  try {
    const remainingAmount = member.totalDue - member.totalPaid; // Calculer le montant restant à payer
    let emailText = `Cher ${member.firstName},\n\nNous confirmons la réception de votre paiement de ${payment.amount}€ effectué par ${payment.paymentMethod}.\n\n`; // Texte de base de l'email

    // Ajouter un message si un solde reste à payer
    if (remainingAmount > 0) {
      emailText += `Vous avez encore un solde de ${remainingAmount}€ à payer.\n\n`;
    } else {
      emailText += `Votre paiement est complet. Merci pour votre règlement.\n\n`;
    }

    emailText += `Cordialement,\nFootball Club`; // Ajouter la signature

    // Envoyer l'email de confirmation de paiement
    await transporter.sendMail({
      from: process.env.EMAIL_USER, // Adresse email de l'expéditeur
      to: member.email, // Adresse email du destinataire (membre)
      subject: 'Confirmation de Paiement - Football Club', // Sujet de l'email
      text: emailText // Contenu de l'email
    });
    return true; // Retourner true si l'email est envoyé avec succès
  } catch (error) {
    console.error('Échec de l\'envoi de l\'email:', error); // Loguer l'erreur en cas d'échec
    return false; // Retourner false si l'email n'a pas pu être envoyé
  }
};


// Fonction pour envoyer une confirmation de paiement de salaire
exports.sendSalaryPaymentConfirmation = async (employee, payment) => {
  try {
    const date = new Date(payment.date);
    const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    const emailText = `Cher ${employee.firstName},\n\nNous vous informons que votre salaire de ${payment.amount}€ a été versé le ${formattedDate}.\n\nCordialement`;

    // Envoyer l'email de confirmation de paiement de salaire
    await transporter.sendMail({
      from: process.env.EMAIL_USER, // Adresse email de l'expéditeur
      to: employee.email, // Adresse email du destinataire (employé)
      subject: 'Confirmation de Paiement de Salaire', // Sujet de l'email
      text: emailText // Contenu de l'email
    });
    return true; // Retourner true si l'email est envoyé avec succès
  } catch (error) {
    console.error('Échec de l\'envoi de l\'email:', error); // Loguer l'erreur en cas d'échec
    return false; // Retourner false si l'email n'a pas pu être envoyé
  }
};