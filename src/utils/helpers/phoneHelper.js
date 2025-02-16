const normalizePhoneNumber = (phone) => {
    if (!phone) {
      return '0000000000'; // Valeur par défaut si le numéro est manquant
    }
  
    // Supprimer tous les caractères non numériques
    let cleanedPhone = phone.replace(/[^0-9]/g, '');
  
    // Détection des numéros français
    if (cleanedPhone.startsWith('33')) {
      cleanedPhone = '0' + cleanedPhone.substring(2); // Convertir "+33X" en "0X"
    } else if (!cleanedPhone.startsWith('0')) {
      cleanedPhone = '0' + cleanedPhone; // Ajouter le "0" devant si absent
    }
  
    // Vérification de la longueur
    if (cleanedPhone.length !== 10) {
      return '0000000000'; // Si le numéro est invalide, retourne une valeur par défaut
    }
  
    // Reformater au format français classique
    return cleanedPhone.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4 $5");
  };

  


  module.exports = { normalizePhoneNumber };
