const mongoose = require("mongoose");

// Middleware pour valider l'ID d'un employé ou d'un membre
const validateObjectId = (req, res, next) => {
  const { employeeId, id } = req.params; // Récupérer les IDs depuis les paramètres
  
  // Si un employeeId ou id est passé dans les paramètres
  const targetId = employeeId || id;

  if (!mongoose.Types.ObjectId.isValid(targetId)) {
    const error = new Error("Invalid ID");
    error.status = 400;
    return next(error);
  }

  next();
};

// Middleware pour valider un tableau d'ID de membres
const validateMemberIds = (req, res, next) => {
  const { memberIds } = req.body;

  if (
    !memberIds ||
    !Array.isArray(memberIds) ||
    memberIds.length === 0 ||
    memberIds.some((id) => !mongoose.Types.ObjectId.isValid(id))
  ) {
    return res
      .status(400)
      .json({ message: "Invalid or empty memberIds array" });
  }

  next();
};

module.exports = { validateObjectId, validateMemberIds };
