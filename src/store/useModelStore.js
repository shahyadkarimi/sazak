import { create } from "zustand";

const useModelStore = create((set, get) => ({
  // Scope
  currentProjectId: null,
  selectedModels: [],
  currentPlacingModel: null,
  currentPlacingModelColor: null,
  currentPlacingModelNoColor: false,
  selectedModelId: null,
  isAdjustingHeight: false,
  isPasteMode: false,
  clipboardModels: [], // Changed from clipboardModel to clipboardModels array
  // History stacks for Undo/Redo
  _historyPast: [],
  _historyFuture: [],
  modelOptions: {
    snapSize: 0.5,
    rotationDeg: 45,
  },
  modelsRef: {},
  zoomLevel: 50, // FOV value for camera zoom
  constrainToGrid: false,
  draggedModelId: null, // ID of model currently being dragged
  activeControlMode: null, // 'height' | 'rotateY' | 'rotateX' | 'rotateZ' | null
  showColorPanel: false, // Show color picker panel

  setSelectedModels: (modelPath) => set({ selectedModels: modelPath }),

  // Initialize or switch project context and reset per-project states/history
  setProjectContext: (projectId, initialModels = []) =>
    set((state) => {
      if (state.currentProjectId === projectId) {
        // Same project, do not reset history unless explicitly asked
        return {
          currentProjectId: projectId,
          selectedModels: initialModels,
        };
      }
      return {
        currentProjectId: projectId,
        selectedModels: initialModels,
        selectedModelId: null,
        clipboardModels: [],
        _historyPast: [],
        _historyFuture: [],
      };
    }),

  setCurrentPlacingModel: (modelPath) =>
    set({ currentPlacingModel: modelPath }),

  setCurrentPlacingModelColor: (color) =>
    set({ currentPlacingModelColor: color }),

  setCurrentPlacingModelNoColor: (noColor) =>
    set({ currentPlacingModelNoColor: noColor }),

  setSelectedModelId: (id) => {
    set((state) => {
      // If deselecting (id is null), also deactivate control mode
      if (id === null && state.activeControlMode) {
        return { selectedModelId: id, activeControlMode: null };
      }
      return { selectedModelId: id };
    });
  },

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

  updateModelDimensions: (id, dimensions) =>
    set((state) => ({
      selectedModels: state.selectedModels.map((model) =>
        model.id === id ? { ...model, dimensions } : model
      ),
    })),

  updateModelColor: (target, color) =>
    set((state) => {
      const isAll = target === 'ALL';
      const isArray = Array.isArray(target);
      const targetIds = isAll
        ? state.selectedModels.map((m) => m.id)
        : isArray
          ? target
          : [target];

      return {
        selectedModels: state.selectedModels.map((model) =>
          targetIds.includes(model.id) ? { ...model, color } : model
        ),
      };
    }),

  setIsAdjustingHeight: (value) => set({ isAdjustingHeight: value }),

  setIsPasteMode: (value) => set({ isPasteMode: value }),

  setClipboardModels: (models) => set({ clipboardModels: models }),

  setModelOptions: (option) =>
    set((state) => ({
      modelOptions: { ...state.modelOptions, ...option },
    })),

  setModelsRef: (ref) =>
    set((state) => {
      // Store ref by model id if ref has id property
      // This is a simple implementation - can be improved if needed
      if (ref && ref.current) {
        // Try to find the model id from the ref's userData or parent
        // For now, just store it - the Model component should handle this properly
        return state; // Keep existing implementation for now
      }
      return state;
    }),

  setZoomLevel: (level) => set({ zoomLevel: Math.max(10, Math.min(100, level)) }),

  setConstrainToGrid: (value) => set({ constrainToGrid: !!value }),
  
  setDraggedModelId: (id) => set({ draggedModelId: id }),
  setActiveControlMode: (mode) => set({ activeControlMode: mode }),
  setShowColorPanel: (value) => set({ showColorPanel: !!value }),
  
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
    // Only push if we are within a project context
    if (!state.currentProjectId) return;
    const snapshot = state._cloneModels(state.selectedModels);
    set({
      _historyPast: [...state._historyPast, snapshot],
      _historyFuture: [],
    });
  },

  undo: () => {
    const state = get();
    if (!state.currentProjectId) return;
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
    if (!state.currentProjectId) return;
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
