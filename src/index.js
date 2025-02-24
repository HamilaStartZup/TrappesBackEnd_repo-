// Charger les variables d'environnement à partir du fichier .env
require('dotenv').config();

// Importer les modules nécessaires
const express = require('express');
const cors = require('cors');
const connectDB = require('./utils/db');
const errorHandler = require('./middlewares/errorHandler');
const authenticateAdmin = require('./middlewares/authMiddleware');
const cron = require('node-cron');
const updateAges = require('./utils/updateAges');


// Initialiser une instance d'Express
const app = express();

// Route pour le paiement Stripe placer avant  express.json .
app.use('/stripe', require('./routes/paymentRoutes')); 

// Utiliser les middlewares
app.use(cors()); // Activer CORS pour permettre les requêtes cross-origin
app.use(express.json()); // Middleware pour parser les requêtes JSON
app.use(express.urlencoded({ extended: true })); // Middleware pour parser les requêtes URL-encoded


// Route publique (ne nécessite pas d'authentification)
app.use('/auth', require('./routes/authRoutes'));

// Route pour la page d'inscription
app.use('/registration', require('./routes/registrationRoutes'));


// Créer un router pour les routes protégées
const protectedRouter = express.Router();

// Appliquer le middleware d'authentification uniquement aux routes protégées
protectedRouter.use(authenticateAdmin);

// Définir les routes protégées
protectedRouter.use('/members', require('./routes/memberRoutes'));
protectedRouter.use('/employees', require('./routes/employeeRoutes'));
protectedRouter.use('/import', require('./routes/importRoutes'));

// Monter le router protégé sur l'application
app.use('/', protectedRouter);

// Middleware d'erreur global
app.use(errorHandler);

// Établir la connexion à la base de données
connectDB();

// Exécuter la mise à jour au démarrage
updateAges();

// Planifier la mise à jour quotidienne à minuit (00:00)
cron.schedule('0 0 * * *', () => {
  console.log('Lancement de la mise à jour quotidienne des âges.');
  updateAges();
});


// Démarrer le serveur
const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});