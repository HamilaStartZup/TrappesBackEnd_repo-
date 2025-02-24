const Member = require('../models/Member');
const { sendPaymentConfirmation, sendPaymentReminder } = require('../utils/emailService'); // Assurez-vous que le chemin est correct
const emailService = require('../utils/emailService');

// Créer un nouveau membre
exports.createMember = async (req, res, next) => {
  try {
    // Extraire les champs nécessaires du corps de la requête
    const { licenseNumber, email, phone, firstName, lastName, gender, category, totalDue, birthDate } = req.body;

    // Valider la présence de tous les champs requis
    if (!licenseNumber || !email || !phone || !firstName || !lastName || !gender || !category || totalDue === undefined || !birthDate) {
      const error = new Error('Missing required fields');
      error.status = 400;
      throw error;
    }

    // Créer un nouveau membre avec les champs extraits
    const member = new Member({
      licenseNumber,
      email,
      phone,
      firstName,
      lastName,
      gender,
      category,
      totalDue,
      birthDate
    });

    // Sauvegarder le membre dans la base de données
    await member.save();
    
    // Répondre avec le membre créé
    res.status(201).json(member);
  } catch (error) {
    next(error); // Passer l'erreur au middleware de gestion des erreurs
  }
};

// Obtenir tous les membres
exports.getAllMembers = async (req, res, next) => {
  try {
    // Récupérer les filtres depuis la requête
    const { paymentStatus, category, age, active } = req.query;

    const filter = {};
    
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (category) filter.category = category;
    if (age) filter.age = age;
    if (active !== undefined) filter.active = active === 'true';

    // const members = await Member.find(filter).select('firstName lastName licenseNumber'); // Utilisation des filtres dans la requête
    const members = await Member.find(filter);
    res.json(members);
  } catch (error) {
    next(error);
  }
};


// Obtenir un membre par son ID
exports.getMemberById = async (req, res, next) => {
  try {
    const { id } = req.params; // Extraire l'ID du membre des paramètres de la requête

    const member = await Member.findById(id); // Récupérer le membre par son ID
    if (!member) {
      const error = new Error('Member not found');
      error.status = 404;
      throw error;
    }
    res.json(member); // Répondre avec le membre trouvé
  } catch (error) {
    next(error); // Passer l'erreur au middleware de gestion des erreurs
  }
};

// Mettre à jour un membre
exports.updateMember = async (req, res, next) => {
  try {
    const { id } = req.params; // Extraire l'ID du membre des paramètres de la requête

    let member = await Member.findById(id); // Récupérer le membre par son ID
    if (!member) {
      const error = new Error('Member not found');
      error.status = 404;
      throw error;
    }

    // Filtrer les champs permis pour la mise à jour
    const allowedUpdates = ['licenseNumber', 'phone', 'email', 'category', 'totalDue', 'totalPaid', 'active'];
    const updateData = {};

    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updateData[key] = req.body[key]; // Ajouter seulement les champs permis
      }
    });

    // Vérifier si totalDue est dans la requête et l'ajouter à la valeur existante
    if (updateData.totalDue !== undefined) {
      updateData.totalDue += member.totalDue;
    }

    // Mettre à jour les données du membre avec les nouvelles données du corps de la requête
    const updatedMember = await Member.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!updatedMember) {
      const error = new Error('Member not found');
      error.status = 404;
      throw error;
    }

    // Vérifier si totalPaid est supérieur ou égal à totalDue
    if (updatedMember.totalPaid >= updatedMember.totalDue) {
      const excess = updatedMember.totalPaid - updatedMember.totalDue;
      updatedMember.totalPaid = excess;
      updatedMember.totalDue = 0;
      updatedMember.paymentStatus = 'paid';
    } else if (updatedMember.totalPaid > 0) {
      updatedMember.paymentStatus = 'partial';
    } else {
      updatedMember.paymentStatus = 'unpaid';
    }

    await updatedMember.save(); // Sauvegarder les modifications dans la base de données

    res.json(updatedMember); // Répondre avec le membre mis à jour
  } catch (error) {
    next(error); // Passer l'erreur au middleware de gestion des erreurs
  }
};


// Supprimer un membre
exports.deleteMember = async (req, res, next) => {
  try {
    const { id } = req.params; // Extraire l'ID du membre des paramètres de la requête

    const member = await Member.findByIdAndDelete(id); // Supprimer le membre par son ID
    if (!member) {
      const error = new Error('Member not found');
      error.status = 404;
      throw error;
    }
    res.json({ message: 'Member deleted successfully' }); // Répondre avec un message de succès
  } catch (error) {
    next(error); // Passer l'erreur au middleware de gestion des erreurs
  }
};

// Ajouter un paiement à un membre
exports.addPayment = async (req, res, next) => {
  try {
    const { id } = req.params; // Extraire l'ID du membre des paramètres de la requête

    const member = await Member.findById(id); // Récupérer le membre par son ID
    if (!member) {
      const error = new Error('Member not found');
      error.status = 404;
      throw error;
    }

    const { amount, paymentMethod } = req.body; // Extraire le montant et la méthode de paiement du corps de la requête
    member.paymentHistory.push({ amount, paymentMethod }); // Ajouter le paiement à l'historique des paiements du membre
    member.totalPaid += amount; // Mettre à jour le total payé par le membre

    // Vérifier si totalPaid est supérieur ou égal à totalDue
    if (member.totalPaid >= member.totalDue) {
      const excess = member.totalPaid - member.totalDue;
      member.totalPaid = excess;
      member.totalDue = 0;
      member.paymentStatus = 'paid';
    } else if (member.totalPaid > 0) {
      member.paymentStatus = 'partial';
    }

    await member.save(); // Sauvegarder les modifications dans la base de données

    // Envoyer l'email de confirmation de paiement
    // await sendPaymentConfirmation(member, { amount, paymentMethod });
    await emailService.sendPaymentConfirmation(member, { amount, paymentMethod });

    res.json(member); // Répondre avec le membre mis à jour
  } catch (error) {
    next(error); // Passer l'erreur au middleware de gestion des erreurs
  }
};


// Mettre à jour plusieurs membres
exports.updateMultipleMembers = async (req, res, next) => {
  try {
    const { memberIds, updateData } = req.body;

    // Validation des IDs des membres
    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0 || memberIds.some(id => !mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({ message: 'Invalid or empty memberIds array' });
    }

    console.log('Member IDs to update:', memberIds);
    console.log('Update data:', updateData);

    // Filtrer les champs permis pour la mise à jour
    const allowedUpdates = ['licenseNumber', 'phone', 'email', 'category', 'totalDue', 'totalPaid', 'active'];
    const filteredUpdateData = {};

    Object.keys(updateData).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        filteredUpdateData[key] = updateData[key]; // Ajouter seulement les champs permis
      }
    });

    // Récupérer tous les membres qui doivent être mis à jour
    const members = await Member.find({ _id: { $in: memberIds } });

    if (members.length === 0) {
      return res.status(404).json({ message: 'No members found with the provided IDs' });
    }

    // Mise à jour individuelle de chaque membre
    for (const member of members) {
      // Clonage de filteredUpdateData pour éviter de modifier l'objet original
      const memberUpdateData = { ...filteredUpdateData };

      if (memberUpdateData.totalDue !== undefined) {
        memberUpdateData.totalDue += member.totalDue;
      }

      // Appliquer les données de mise à jour
      Object.assign(member, memberUpdateData);

      // Mise à jour de paymentStatus
      if (member.totalPaid >= member.totalDue) {
        const excess = member.totalPaid - member.totalDue;
        member.totalPaid = excess;
        member.totalDue = 0;
        member.paymentStatus = 'paid';
      } else if (member.totalPaid > 0) {
        member.paymentStatus = 'partial';
      } else {
        member.paymentStatus = 'unpaid';
      }

      await member.save();
    }

    res.json({ message: 'Members updated successfully', modifiedCount: members.length });
  } catch (error) {
    next(error); // Passer l'erreur au middleware de gestion des erreurs
  }
};


// Envoyer des rappels de paiement
exports.sendPaymentReminders = async (req, res) => {
  try {
    // Récupérer tous les membres avec paiement incomplet
    const members = await Member.find({
      $expr: { $lt: ['$totalPaid', '$totalDue'] }
    });

    if (members.length === 0) {
      return res.json({
        message: 'Aucun rappel nécessaire - tous les paiements sont à jour',
        results: { success: [], failed: [], total: 0 }
      });
    }

    // Envoyer les rappels
    const results = await emailService.sendBulkPaymentReminders(members);

    return res.json({
      message: 'Rappels de paiement envoyés',
      results
    });
  } catch (error) {
    console.error('Erreur lors de l\'envoi des rappels:', error);
    return res.status(500).json({
      error: 'Erreur lors de l\'envoi des rappels',
      details: error.message
    });
  }
};