import { create } from "zustand";

const useModelStore = create((set) => ({
  selectedModels: [],
  currentPlacingModel: null,
  selectedModelId: null,

  setSelectedModels: (modelPath) =>
    set((state) => ({ selectedModels: [...state.selectedModels, modelPath] })),

  setCurrentPlacingModel: (modelPath) =>
    set({ currentPlacingModel: modelPath }),

  setSelectedModelId: (id) => set({ selectedModelId: id }),
}));

export default useModelStore;
