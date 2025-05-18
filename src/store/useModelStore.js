import { create } from "zustand";

const useModelStore = create((set) => ({
  selectedModels: [],
  currentPlacingModel: null,
  selectedModelId: null,
  isAdjustingHeight: false,
  boundingBoxes: {},

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

  updateModelRotation: (id, newRotation) =>
    set((state) => ({
      selectedModels: state.selectedModels.map((model) =>
        model.id === id ? { ...model, rotation: newRotation } : model
      ),
    })),

  setIsAdjustingHeight: (value) => set({ isAdjustingHeight: value }),

  setBoundingBoxes: (newBoxes) =>
    set((state) => ({
      boundingBoxes: { ...state.boundingBoxes, ...newBoxes },
    })),
}));

export default useModelStore;
