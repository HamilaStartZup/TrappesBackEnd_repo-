const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Gestion des erreurs de validation
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.message
    });
  }

  
   // Gestion des erreurs de duplication
   if (err.name === 'MongoServerError' && err.code === 11000) {
    return res.status(409).json({
      error: 'Duplicate Error',
      details: 'A record with this information already exists'
    });
  }

  // Gestion des erreurs de cast (par exemple, ID invalide)
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Cast Error',
      details: 'Invalid ID format'
    });
  }

  // Gestion des erreurs de connexion à la base de données
  if (err.name === 'MongoNetworkError') {
    return res.status(503).json({
      error: 'Database Connection Error',
      details: 'Unable to connect to the database'
    });
  }
 

  // Gestion des erreurs génériques
  res.status(500).json({
    error: 'Internal Server Error',
    details: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
};

module.exports = errorHandler;
