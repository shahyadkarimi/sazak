const boundsRegistry = new Map();

export const setModelBounds = (id, bounds) => {
  if (!id || !bounds) return;
  boundsRegistry.set(id, bounds);
};

export const removeModelBounds = (id) => {
  if (!id) return;
  boundsRegistry.delete(id);
};

export const getModelBounds = (id) => {
  if (!id) return null;
  return boundsRegistry.get(id) || null;
};

export const getAllModelBounds = () => boundsRegistry;




