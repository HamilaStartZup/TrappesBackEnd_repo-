const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Exemple de données utilisateur (à remplacer par une base de données)
const adminUser = {
  username: 'admin',
  password: bcrypt.hashSync('admin_password', 10), // Mot de passe haché
  role: 'admin'
};

const SECRET_KEY = process.env.SECRET_KEY || 'votre_clé_secrète';

exports.login = (req, res) => {
  const { username, password } = req.body;

  if (username === adminUser.username && bcrypt.compareSync(password, adminUser.password)) {
    const token = jwt.sign({ userId: adminUser.username, role: adminUser.role }, SECRET_KEY, {
      expiresIn: '24h'
    });

    return res.json({ token });
  }

  return res.status(401).json({ message: 'Nom d\'utilisateur ou mot de passe incorrect.' });
};
