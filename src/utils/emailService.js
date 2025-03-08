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


    registrationPaymentConfirmation: (registration, amount) => ({
      subject: 'Confirmation de Paiement - Inscription ES Trappes Football Club',
      text: `Cher(e) ${registration.firstName} ${registration.lastName},

Nous confirmons la réception de votre paiement de ${amount}€ pour votre inscription à l'ES Trappes Football Club.

Votre inscription est maintenant complète et validée.

Nous avons hâte de vous voir sur le terrain !

Cordialement,
L'équipe de l'ES Trappes Football Club`
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
    },

    // Nouveau template pour le lien de paiement Stripe
    stripePaymentLink: (registration, paymentUrl, amount) => ({
      subject: 'Finalisation de votre inscription - ES Trappes Football Club',
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #333;">Votre inscription a été acceptée !</h1>
        </div>
        
        <p>Cher(e) ${registration.firstName} ${registration.lastName},</p>
        
        <p>Nous avons le plaisir de vous informer que votre demande d'inscription à l'ES Trappes Football Club a été <strong style="color: #4CAF50;">acceptée</strong>.</p>
        
        <p>Pour finaliser votre inscription, veuillez procéder au paiement de votre cotisation d'un montant de <strong>${amount}€</strong> en cliquant sur le bouton ci-dessous :</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${paymentUrl}" style="background-color: #4CAF50; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Procéder au paiement</a>
        </div>
        
        <p>Ce lien vous redirigera vers une page de paiement sécurisée. Vous pourrez y entrer vos informations de carte bancaire en toute sécurité.</p>
        
        <p>Si vous rencontrez des difficultés ou si vous souhaitez effectuer votre paiement par un autre moyen (espèces, chèque, etc.), n'hésitez pas à nous contacter.</p>
        
        <p>Nous nous réjouissons de vous compter parmi nos membres!</p>
        
        <p style="margin-top: 30px;">Cordialement,<br>L'équipe de l'ES Trappes Football Club</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea; font-size: 12px; color: #777; text-align: center;">
          <p>Si vous avez reçu cet email par erreur, merci de nous en informer.</p>
        </div>
      </div>
      `
    })
  };

  // Méthode pour envoyer un email
  async sendEmail(to, template) {
    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject: template.subject,
        text: template.text,
        html: template.html 
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

  // Nouvelle méthode pour envoyer un lien de paiement Stripe
  async sendStripePaymentLink(registration, paymentUrl, amount) {
    return this.sendEmail(
      registration.contact.email, 
      this.templates.stripePaymentLink(registration, paymentUrl, amount)
    );
  }

  async sendRegistrationPaymentConfirmation(registration, amount) {
    return this.sendEmail(registration.contact.email, this.templates.registrationPaymentConfirmation(registration, amount));
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
