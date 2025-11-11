const FAVORITE_MODELS_KEY = 'favoriteModels';

export const getFavoriteModels = () => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(FAVORITE_MODELS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading favorite models from localStorage:', error);
    return [];
  }
};

export const addFavoriteModel = (modelId) => {
  if (typeof window === 'undefined') return;
  try {
    const favorites = getFavoriteModels();
    if (!favorites.includes(modelId)) {
      favorites.push(modelId);
      localStorage.setItem(FAVORITE_MODELS_KEY, JSON.stringify(favorites));
    }
  } catch (error) {
    console.error('Error adding favorite model to localStorage:', error);
  }
};

export const removeFavoriteModel = (modelId) => {
  if (typeof window === 'undefined') return;
  try {
    const favorites = getFavoriteModels();
    const updated = favorites.filter((id) => id !== modelId);
    localStorage.setItem(FAVORITE_MODELS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error removing favorite model from localStorage:', error);
  }
};

export const toggleFavoriteModel = (modelId) => {
  if (typeof window === 'undefined') return;
  const favorites = getFavoriteModels();
  let isNowFavorite;
  if (favorites.includes(modelId)) {
    removeFavoriteModel(modelId);
    isNowFavorite = false;
  } else {
    addFavoriteModel(modelId);
    isNowFavorite = true;
  }
  // Dispatch custom event for same-tab updates
  window.dispatchEvent(new CustomEvent('favoriteModelsChanged', { 
    detail: { modelId, isFavorite: isNowFavorite } 
  }));
  return isNowFavorite;
};

export const isFavoriteModel = (modelId) => {
  const favorites = getFavoriteModels();
  return favorites.includes(modelId);
};

