const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.SECRET_KEY || 'votre_clé_secrète';

const authenticateAdmin = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Accès non autorisé. Token manquant.' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);

    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Accès interdit. Vous devez être administrateur.' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Token invalide.' });
  }
};

module.exports = authenticateAdmin;