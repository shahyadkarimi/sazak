import { create } from "zustand";

const useModelStore = create((set) => ({
  selectedModels: [],
  currentPlacingModel: null,
  selectedModelId: null,
  isAdjustingHeight: false,
  isBelowGrid: false, // پرچم جدید برای خطا

  setSelectedModels: (modelPath) =>
    set((state) => ({ selectedModels: [...state.selectedModels, modelPath] })),

  setBelowGrid: (value) => set({ isBelowGrid: value }),

  setCurrentPlacingModel: (modelPath) =>
    set({ currentPlacingModel: modelPath }),

  setSelectedModelId: (id) => set({ selectedModelId: id }),

  updateModelPosition: (id, position) =>
    set((state) => ({
      selectedModels: state.selectedModels.map((model) =>
        model.id === id ? { ...model, position } : model
      ),
    })),

  updateModelRotation: (id, newRotation) =>
    set((state) => ({
      selectedModels: state.selectedModels.map((model) =>
        model.id === id ? { ...model, rotation: newRotation } : model
      ),
    })),

  setIsAdjustingHeight: (value) => set({ isAdjustingHeight: value }),
}));

export default useModelStore;
