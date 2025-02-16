const mongoose = require('mongoose');

// Fonction pour se connecter à la base de données MongoDB
const connectDB = async () => {
  try {
    // Tenter de se connecter à la base de données en utilisant l'URI spécifiée dans les variables d'environnement
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully'); // Loguer un message de succès si la connexion est établie
  } catch (err) {
    console.error('Error connecting to MongoDB:', err.message); // Loguer une erreur en cas d'échec de la connexion
    process.exit(1); // Terminer le processus avec un code d'erreur
  }
};

// Exporter la fonction connectDB pour qu'elle puisse être utilisée dans d'autres fichiers
module.exports = connectDB;