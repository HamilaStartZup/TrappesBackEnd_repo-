const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
require('dotenv').config();

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Vérifier si l'admin existe
    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(401).json({ message: 'Utilisateur introuvable' });

    // Vérifier le mot de passe
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Mot de passe incorrect' });

    // Générer le token JWT
    const token = jwt.sign(
      { userId: admin._id, role: admin.role },
      process.env.SECRET_KEY,
      { expiresIn: '24h' }
    );

    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};