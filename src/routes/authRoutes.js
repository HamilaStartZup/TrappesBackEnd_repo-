const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

// Route de login 
router.post('/login', authController.login);
// Route pour verifier la validité du token pour afficher les pages
router.post('/verify', authMiddleware, (req, res) => {
    res.json({ message: "Token valide", user: req.user });
});
// Route pour créer un admin (peut être désactivée après le premier admin créé)
router.post('/register', authController.register);
// route pour check la presence d'un admin dans la bdd
router.get('/check-admin' , authController.checkAdminExists);
module.exports = router;
