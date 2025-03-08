// Charger les variables d'environnement à partir du fichier .env
require('dotenv').config();
const fs = require("fs");
const https = require("https");
// Importer les modules nécessaires
const express = require('express');
const cors = require('cors');
const connectDB = require('./utils/db');
const errorHandler = require('./middlewares/errorHandler');
const authenticateAdmin = require('./middlewares/authMiddleware');
const cron = require('node-cron');
const updateAges = require('./utils/updateAges');

console.log("🚀 Serveur en cours de démarrage...");


// Initialiser une instance d'Express
const app = express();

// Middleware pour LOG les requêtes entrantes et leur origine CORS
app.use((req, res, next) => {
  console.log(`➡️  Requête reçue : ${req.method} ${req.url}`);

  console.log(`CORS Request from: ${req.headers.origin}`);
  next();
});

// Configuration CORS pour permettre les requêtes depuis es-trappes.com
const corsOptions = {
  origin: 'https://es-trappes.com',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// Application du middleware CORS avec les options configurées
app.use(cors(corsOptions));

// Middleware pour traiter les requêtes OPTIONS (preflight)
app.options('*', cors(corsOptions));

// Route pour le paiement Stripe placer avant  express.json .
app.use('/stripe', require('./routes/paymentRoutes')); 



app.use(express.json({ limit: '20mb' }));  // Middleware pour parser les requêtes JSON
app.use(express.urlencoded({ limit: '20mb', extended: true }));  // Middleware pour parser les requêtes URL-encoded

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
app.use('/protected', protectedRouter);

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

// Charger les certificats SSL
const options = {
  key: fs.readFileSync("/etc/letsencrypt/live/backendestrappes.fr/privkey.pem"),
  cert: fs.readFileSync("/etc/letsencrypt/live/backendestrappes.fr/fullchain.pem"),
};

// Démarrer le serveur
const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

