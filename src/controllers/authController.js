const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

const SECRET_KEY = process.env.SECRET_KEY ;

// Connexion Admin
exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ message: 'Admin non trouvé.' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Mot de passe incorrect.' });
    }

    const token = jwt.sign({ adminId: admin._id, role: admin.role }, SECRET_KEY, {
      expiresIn: '24h'
    });

    return res.json({ token });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Création d'un admin (à faire une seule fois)
exports.register = async (req, res) => {
  const { username, password } = req.body;

  try {
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Cet admin existe déjà.' });
    }

    const newAdmin = new Admin({ username, password });
    await newAdmin.save();

    res.status(201).json({ message: 'Admin créé avec succès.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};



exports.checkAdminExists = async (req, res) => {
  try {
    const adminCount = await Admin.countDocuments();
    res.json({ exists: adminCount > 0 });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};