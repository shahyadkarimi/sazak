import { create } from "zustand";

const useModelStore = create((set, get) => ({
  selectedModels: [],
  currentPlacingModel: null,
  currentPlacingModelColor: null,
  currentPlacingModelWidth: null,
  currentPlacingModelLength: null,
  selectedModelId: null,
  isAdjustingHeight: false,
  isPasteMode: false,
  clipboardModels: [], // Changed from clipboardModel to clipboardModels array
  // History stacks for Undo/Redo
  _historyPast: [],
  _historyFuture: [],
  modelOptions: {
    snapSize: 0.1,
    rotationDeg: 45,
  },
  modelsRef: {},
  zoomLevel: 50, // FOV value for camera zoom
  constrainToGrid: false,
  // Preview mode for snap-to-attach functionality
  isPreviewMode: true,
  snapPoints: [], // Array of available snap points
  previewPosition: null, // Current preview position
  isSnapping: false, // Whether currently snapping to a point
  // TinkerCAD-style face preview
  activeFacePreview: null, // Current highlighted face
  draggedModelPreviewPosition: null, // Preview position of dragged model
  collisionMode: 'stack', // 'stack' | 'push' | 'block'
  draggedModelId: null, // ID of model currently being dragged
  activeControlMode: null, // 'height' | 'rotateY' | 'rotateX' | 'rotateZ' | null

  setSelectedModels: (modelPath) => set({ selectedModels: modelPath }),

  setCurrentPlacingModel: (modelPath) =>
    set({ currentPlacingModel: modelPath }),

  setCurrentPlacingModelColor: (color) =>
    set({ currentPlacingModelColor: color }),

  setCurrentPlacingModelWidth: (width) =>
    set({ currentPlacingModelWidth: width }),

  setCurrentPlacingModelLength: (length) =>
    set({ currentPlacingModelLength: length }),

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

  setModelsRef: (option) =>
    set((state) => ({
      modelsRef: { ...state.modelOptions, ...option },
    })),

  setZoomLevel: (level) => set({ zoomLevel: Math.max(10, Math.min(100, level)) }),

  setConstrainToGrid: (value) => set({ constrainToGrid: !!value }),
  
  // Preview mode controls
  setIsPreviewMode: (value) => set({ isPreviewMode: !!value }),
  setSnapPoints: (points) => set({ snapPoints: points || [] }),
  setPreviewPosition: (position) => set({ previewPosition: position }),
  setIsSnapping: (value) => set({ isSnapping: !!value }),
  
  // TinkerCAD-style face preview controls
  setActiveFacePreview: (face) => set({ activeFacePreview: face }),
  setDraggedModelPreviewPosition: (position) => set({ draggedModelPreviewPosition: position }),
  setCollisionMode: (mode) => set({ collisionMode: mode }),
  setDraggedModelId: (id) => set({ draggedModelId: id }),
  setActiveControlMode: (mode) => set({ activeControlMode: mode }),
  
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
