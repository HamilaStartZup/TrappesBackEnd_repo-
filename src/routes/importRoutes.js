// Importation des modules nécessaires
const express = require('express'); // Module pour créer des applications web
const router = express.Router(); // Création d'un routeur Express
const multer = require('multer'); // Module pour gérer les uploads de fichiers
const { importMembers, getEntriesWithComments } = require('../controllers/importController'); // Importation du contrôleur pour importer les membres
// const { importMembers } = require('../controllers/importController'); // Importation du contrôleur pour importer les membres

// Configuration de multer pour l'upload de fichiers Excel
const storage = multer.diskStorage({
  // Définir le répertoire de destination pour les fichiers uploadés
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Les fichiers seront stockés dans le répertoire 'uploads/'
  },
  // Définir le nom du fichier
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`); // Le nom du fichier sera le timestamp actuel suivi du nom original du fichier
  }
});

// Configuration de multer avec le stockage et le filtre de fichiers
const upload = multer({
  storage: storage,
  // Filtrage pour accepter seulement les fichiers Excel
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true); // Accepter le fichier si le type MIME est correct
    } else {
      cb(null, false); // Rejeter le fichier si le type MIME est incorrect
      return cb(new Error('Seuls les fichiers Excel sont acceptés')); // Envoyer une erreur si le fichier n'est pas un fichier Excel
    }
  }
});

// Définir la route POST pour l'upload de fichiers
router.post('/', upload.single('file'), importMembers); // Utiliser le middleware multer pour gérer l'upload de fichiers et appeler le contrôleur importMembers

router.get('/entries-with-comments', getEntriesWithComments);


// Exportation du routeur
module.exports = router;
