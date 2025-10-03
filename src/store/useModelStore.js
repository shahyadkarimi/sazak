import { create } from "zustand";

const useModelStore = create((set, get) => ({
  selectedModels: [],
  currentPlacingModel: null,
  selectedModelId: null,
  isAdjustingHeight: false,
  isPasteMode: false,
  clipboardModel: null,
  // History stacks for Undo/Redo
  _historyPast: [],
  _historyFuture: [],
  modelOptions: {
    snapSize: 0.1,
    rotationDeg: 45,
  },
  modelsRef: {},
  zoomLevel: 50, // FOV value for camera zoom

  setSelectedModels: (modelPath) => set({ selectedModels: modelPath }),

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

  setIsPasteMode: (value) => set({ isPasteMode: value }),

  setClipboardModel: (model) => set({ clipboardModel: model }),

  setModelOptions: (option) =>
    set((state) => ({
      modelOptions: { ...state.modelOptions, ...option },
    })),

  setModelsRef: (option) =>
    set((state) => ({
      modelsRef: { ...state.modelOptions, ...option },
    })),

  setZoomLevel: (level) => set({ zoomLevel: Math.max(10, Math.min(100, level)) }),
  
  zoomIn: () => set((state) => ({ 
    zoomLevel: Math.max(10, state.zoomLevel - 5) 
  })),
  
  zoomOut: () => set((state) => ({ 
    zoomLevel: Math.min(100, state.zoomLevel + 5) 
  })),

  // ----- Undo/Redo API -----
  _cloneModels: (models) => JSON.parse(JSON.stringify(models || [])),

  pushHistory: () => {
    const state = get();
    const snapshot = state._cloneModels(state.selectedModels);
    set({
      _historyPast: [...state._historyPast, snapshot],
      _historyFuture: [],
    });
  },

  undo: () => {
    const state = get();
    if (state._historyPast.length === 0) return;
    const past = [...state._historyPast];
    const previous = past.pop();
    const current = state._cloneModels(state.selectedModels);
    set({
      selectedModels: previous,
      _historyPast: past,
      _historyFuture: [...state._historyFuture, current],
    });
  },

  redo: () => {
    const state = get();
    if (state._historyFuture.length === 0) return;
    const future = [...state._historyFuture];
    const next = future.pop();
    const current = state._cloneModels(state.selectedModels);
    set({
      selectedModels: next,
      _historyPast: [...state._historyPast, current],
      _historyFuture: future,
    });
  },
}));

export default useModelStore;
