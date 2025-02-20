const Registration = require("../models/Registration");

// Créer une nouvelle inscription
exports.createRegistration = async (req, res, next) => {
  try {
    // Extraire les champs nécessaires du corps de la requête
    const {
      typeInscription,
      firstName,
      lastName,
      birthDate,
      gender,
      contact,
      tutor,
      address,
      documents,
      droitImage,
      codePromo, 
      status,
    } = req.body;

    // Valider la présence de tous les champs requis
    if (
      !typeInscription ||
      !firstName ||
      !lastName ||
      !birthDate ||
      !gender ||
      !contact ||
      !contact.phone ||
      !contact.email
    ) {
      const error = new Error("Missing required fields");
      error.status = 400;
      throw error;
    }

    // Vérifier si un utilisateur avec le même nom, prénom, email ou téléphone existe déjà
    const existingRegistration = await Registration.findOne({
      $or: [
        { "contact.email": contact.email },
        { "contact.phone": contact.phone },
        { firstName, lastName }  // Recherche par prénom et nom
      ]
    });

    if (existingRegistration) {
      const error = new Error("An account with this email, phone, or name already exists");
      error.status = 400;
      throw error;
    }

    // Créer une nouvelle inscription avec les champs extraits
    const registration = new Registration({
      typeInscription,
      firstName,
      lastName,
      birthDate,
      gender,
      contact,
      tutor,
      address,
      documents,
      droitImage,
      codePromo,
      status,
    });

    // Sauvegarder l'inscription dans la base de données
    await registration.save();

    // Répondre avec l'inscription créée
    res.status(201).json(registration);
  } catch (error) {
    next(error);
  }
};

// Obtenir toutes les inscriptions avec filtres optionnels
exports.getRegistrations = async (req, res, next) => {
  try {
    // Extraire les filtres de la requête
    const { status, typeInscription } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (typeInscription) filter.typeInscription = typeInscription;

    // Récupérer les inscriptions filtrées
    const registrations = await Registration.find(filter).select(
      "firstName lastName typeInscription status"
    );
    res.status(200).json(registrations);
  } catch (error) {
    next(error);
  }
};

// Obtenir une inscription par son ID
exports.getRegistrationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const registration = await Registration.findById(id);
    if (!registration) {
      const error = new Error("Registration not found");
      error.status = 404;
      throw error;
    }
    // Répondre avec les détails de l'inscription
    res.status(200).json(registration);
  } catch (error) {
    next(error);
  }
};

// Mettre à jour une inscription (seuls certains champs sont modifiables)
exports.updateRegistration = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Vérifier si l'inscription existe
    let registration = await Registration.findById(id);
    if (!registration) {
      const error = new Error("Registration not found");
      error.status = 404;
      throw error;
    }

    // Filtrer les champs autorisés à être mis à jour
    const allowedUpdates = ["status"];
    const updateData = {};

    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updateData[key] = req.body[key];
      }
    });

    // Mettre à jour l'inscription
    const updatedRegistration = await Registration.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!updatedRegistration) {
      const error = new Error("Registration not found");
      error.status = 404;
      throw error;
    }

    // Répondre avec l'inscription mise à jour
    res.status(200).json(updatedRegistration);
  } catch (error) {
    next(error);
  }
};

// Supprimer une inscription
exports.deleteRegistration = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Rechercher et supprimer l'inscription
    const registration = await Registration.findByIdAndDelete(id);
    if (!registration) {
      const error = new Error("Registration not found");
      error.status = 404;
      throw error;
    }
    // Répondre avec un message de succès
    res.status(200).json({ message: "Registration deleted successfully" });
  } catch (error) {
    next(error);
  }
};
