// Fonction pour extraire les parties du nom (prénom et nom de famille) à partir d'un nom complet
const extractNameParts = (fullName) => {
  // Si le nom complet n'est pas fourni, retourner des valeurs par défaut
  if (!fullName) {
    return { firstName: 'Unknown', lastName: 'Unknown' };
  }

  // Nettoyer le nom complet en supprimant les espaces en début et fin de chaîne
  fullName = fullName.trim();

  // Si le nom complet contient une virgule, supposer que le format est "Nom, Prénom"
  if (fullName.includes(',')) {
    const [lastName, firstName] = fullName.split(',').map(part => part.trim());
    return {
      firstName: firstName || 'Unknown',
      lastName: lastName || 'Unknown'
    };
  }

  // Diviser le nom complet en parties en utilisant l'espace comme séparateur
  const parts = fullName.split(' ').filter(part => part.length > 0);

  // Si le nom complet ne contient qu'une seule partie, supposer que c'est le nom de famille
  if (parts.length === 1) {
    return {
      firstName: 'Unknown',
      lastName: parts[0]
    };
  }

  // Séparer les parties du nom en nom de famille (en majuscules) et prénom (en minuscules)
  const lastNameParts = parts.filter(part => part === part.toUpperCase());
  const firstNameParts = parts.filter(part => part !== part.toUpperCase());

  // Retourner le prénom et le nom de famille
  return {
    firstName: firstNameParts.join(' ') || 'Unknown',
    lastName: lastNameParts.join(' ') || 'Unknown'
  };
};

// Exporter la fonction pour qu'elle puisse être utilisée dans d'autres fichiers
module.exports = extractNameParts;
