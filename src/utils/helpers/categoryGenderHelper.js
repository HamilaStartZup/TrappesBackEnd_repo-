const getCategoryAndGender = (subCategory) => {
  if (!subCategory) {
    return { gender: 'Unknown', category: 'Unknown' };
  }

  // Nettoyer et standardiser la sous-catégorie
  const cleanCategory = subCategory.trim().toUpperCase();
  
  // Gérer d'abord les cas spéciaux des seniors
  if (cleanCategory === 'SENIOR F') {
    return { gender: 'F', category: 'Senior F' };
  }
  
  if (cleanCategory === 'SENIOR') {
    return { gender: 'M', category: 'Senior' };
  }
  
  if (cleanCategory.includes('SENIOR U20 F') || cleanCategory.includes('SENIOR U20F') || 
      (cleanCategory.includes('SENIOR') && cleanCategory.includes('U20') && cleanCategory.includes('F'))) {
    return { gender: 'F', category: 'Senior U20 F' };
  }
  
  if (cleanCategory.includes('SENIOR U20') || cleanCategory.includes('SENIOR U20M') || 
      (cleanCategory.includes('SENIOR') && cleanCategory.includes('U20'))) {
    return { gender: 'M', category: 'Senior U20' };
  }

  // Gérer spécifiquement le cas des vétérans avec différentes orthographes possibles
  if (cleanCategory.includes('VETERAN') || cleanCategory.includes('VÉTÉRAN') || 
      cleanCategory.includes('VÉTERAN') || cleanCategory.includes('VETERÁN')) {
    return { gender: 'M', category: 'Veteran' };
  }

  // Déterminer le genre
  let gender = 'M';
  if (cleanCategory.includes('F') || cleanCategory.includes('FEMININ')) {
    gender = 'F';
  }

  // Mapping pour les autres catégories
  const categoryMapping = {
    'U20': `U20${gender}`,
    'U19': `U19${gender}`,
    'U18': `U18${gender}`,
    'U17': `U17${gender}`,
    'U16': `U16${gender}`,
    'U15': `U15${gender}`,
    'U14': `U14${gender}`,
    'U13': `U13${gender}`,
    'U12': `U12${gender}`,
    'U11': `U11${gender}`,
    'U10': `U10${gender}`,
    'U9': `U9${gender}`,
    'U8': `U8${gender}`,
    'U7': `U7${gender}`,
    'U6': `U6${gender}`,
    'U5': `U5${gender}`
  };

  // Chercher une correspondance dans le mapping
  const matchedCategory = Object.keys(categoryMapping).find(key =>
    cleanCategory.includes(key)
  );

  // Retourner la catégorie correspondante ou Unknown
  return {
    gender,
    category: matchedCategory ? categoryMapping[matchedCategory] : 'Unknown'
  };
};

module.exports = getCategoryAndGender;