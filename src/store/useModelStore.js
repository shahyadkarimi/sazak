import { create } from "zustand";

const useModelStore = create((set) => ({
  selectedModels: [],
  currentPlacingModel: null,
  selectedModelId: null,
  isAdjustingHeight: false,

  setSelectedModels: (modelPath) =>
    set((state) => ({ selectedModels: [...state.selectedModels, modelPath] })),

  setCurrentPlacingModel: (modelPath) =>
    set({ currentPlacingModel: modelPath }),

  setSelectedModelId: (id) => set({ selectedModelId: id }),

  updateModelPosition: (id, position) =>
    set((state) => ({
      selectedModels: state.selectedModels.map((model) =>
        model.id === id ? { ...model, position } : model
      ),
    })),

  setIsAdjustingHeight: (value) => set({ isAdjustingHeight: value }),
}));

export default useModelStore;
