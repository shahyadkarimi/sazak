import { create } from "zustand";

const useModelStore = create((set) => ({
  selectedModels: [],
  setSelectedModels: (modelPath) =>
    set((state) => ({ selectedModels: [...state.selectedModels, modelPath] })),
}));

export default useModelStore;
