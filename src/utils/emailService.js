const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  // Templates d'emails
  templates = {
    paymentReminder: (member) => ({
      subject: 'Rappel de Paiement - ES Trappes Football Club',
      text: `Cher ${member.firstName} ${member.lastName},

Nous espérons que vous vous portez bien. Ce message est un rappel concernant votre cotisation au club.

Détails de votre cotisation :
- Montant total dû : ${member.totalDue}€
- Montant déjà payé : ${member.totalPaid}€
- Reste à payer : ${member.totalDue - member.totalPaid}€

Pour effectuer votre paiement, vous pouvez :
1. Payer en ligne sur notre site web
2. Payer directement au club (espèces, carte bancaire, ou chèque)
3. Effectuer un virement bancaire

Si vous avez déjà effectué le paiement, merci de ne pas tenir compte de ce message.

Cordialement,
ES Trappes Football Club`
    }),

    paymentConfirmation: (member, payment) => ({
      subject: 'Confirmation de Paiement - ES Trappes Football Club',
      text: `Cher ${member.firstName} ${member.lastName},

Nous confirmons la réception de votre paiement de ${payment.amount}€.

${member.totalPaid >= member.totalDue 
  ? 'Votre cotisation est maintenant entièrement réglée. Merci !'
  : `Il vous reste ${member.totalDue - member.totalPaid}€ à régler.`}

Cordialement,
ES Trappes Football Club`
    }),

    salaryPaymentConfirmation: (employee, payment) => {
      const date = new Date(payment.date);
      const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
      return {
        subject: 'Confirmation de Paiement de Salaire',
        text: `Cher ${employee.firstName},

Nous vous informons que votre salaire de ${payment.amount}€ a été versé le ${formattedDate}.

Cordialement`
      };
    }
  };

  // Méthode pour envoyer un email
  async sendEmail(to, template) {
    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject: template.subject,
        text: template.text
      });
      return { success: true, email: to };
    } catch (error) {
      console.error(`Échec d'envoi d'email à ${to}:`, error);
      return { success: false, email: to, error: error.message };
    }
  }

  // Méthode pour envoyer un rappel de paiement
  async sendPaymentReminder(member) {
    return this.sendEmail(member.email, this.templates.paymentReminder(member));
  }

  // Méthode pour envoyer une confirmation de paiement
  async sendPaymentConfirmation(member, payment) {
    return this.sendEmail(member.email, this.templates.paymentConfirmation(member, payment));
  }

  // Méthode pour envoyer une confirmation de paiement de salaire
  async sendSalaryPaymentConfirmation(employee, payment) {
    return this.sendEmail(employee.email, this.templates.salaryPaymentConfirmation(employee, payment));
  }

  // Méthode pour envoyer des rappels en masse
  async sendBulkPaymentReminders(members) {
    const results = {
      success: [],
      failed: [],
      total: members.length
    };

    const promises = members.map(member => this.sendPaymentReminder(member));
    const emailResults = await Promise.allSettled(promises);

    // Traitement des résultats
    emailResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.success) {
        results.success.push(members[index].email);
      } else {
        results.failed.push({
          email: members[index].email,
          error: result.value?.error || 'Échec de l\'envoi'
        });
      }
    });

    return results;
  }
}

// Export du service
const emailService = new EmailService();
module.exports = emailService;
