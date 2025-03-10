const Registration = require("../models/Registration");

// Fonction pour vérifier le type MIME d'un fichier base64
function validateFileType(base64String) {
  const validMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  const mimeType = getMimeType(base64String);
  return validMimeTypes.includes(mimeType);
}

// Fonction pour extraire le type MIME d'une chaîne base64
function getMimeType(base64String) {
  const matches = base64String.match(/^data:([a-zA-Z0-9/+]+);base64,/);
  const mimeType = matches ? matches[1] : '';
  console.log("Extracted MIME type:", mimeType); // Ajoutez ce log pour le débogage
  return mimeType;
}

// Créer une nouvelle inscription
exports.createRegistration = async (req, res, next) => {
  try {
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
      status,
    } = req.body;

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

    // Vérifier si une inscription existe déjà avec le même email, prénom et nom
    const existingRegistration = await Registration.findOne({
      "contact.email": contact.email,
      firstName: firstName,
      lastName: lastName
    });

   
    if (existingRegistration) {
      return res.status(400).json({
          message: "Doublon d'inscription : email et nom déjà utilisés"
      });
  }

    // Vérifier les types MIME des documents
    if (documents) {
      if (documents.carteIdentite && !validateFileType(documents.carteIdentite)) {
        const error = new Error("Invalid file type for carteIdentite");
        error.status = 400;
        throw error;
      }
      if (documents.justificatifDomicile && !validateFileType(documents.justificatifDomicile)) {
        const error = new Error("Invalid file type for justificatifDomicile");
        error.status = 400;
        throw error;
      }
      if (documents.certificatMedical && !validateFileType(documents.certificatMedical)) {
        const error = new Error("Invalid file type for certificatMedical");
        error.status = 400;
        throw error;
      }
    }

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
      status,
    });

    await registration.save();
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
      "firstName lastName typeInscription status paymentStatus"
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