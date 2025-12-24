import { create } from "zustand";
import {
  volumesOverlap,
  boxesOverlap,
  computeModelExtents,
} from "../helper/gridConstraints";
import { getModelBounds } from "./modelBoundsRegistry";

const buildBoundsFromModel = (model) => {
  if (!model || !model.position) return null;
  if (model.dimensions?.bounds) {
    const { bounds } = model.dimensions;
    return {
      minX: model.position[0] + bounds.minX,
      maxX: model.position[0] + bounds.maxX,
      minY: model.position[1] + bounds.minY,
      maxY: model.position[1] + bounds.maxY,
      minZ: model.position[2] + bounds.minZ,
      maxZ: model.position[2] + bounds.maxZ,
    };
  }
  if (model.dimensions) {
    const extents = computeModelExtents(
      model.dimensions,
      model.rotation || [0, 0, 0]
    );
    if (!extents) return null;
    return {
      minX: model.position[0] + extents.minX,
      maxX: model.position[0] + extents.maxX,
      minY: model.position[1] + extents.minY,
      maxY: model.position[1] + extents.maxY,
      minZ: model.position[2] + extents.minZ,
      maxZ: model.position[2] + extents.maxZ,
    };
  }
  return null;
};

const modelsOverlap = (models, targetId = null) => {
  if (!Array.isArray(models)) return false;
  const filtered = models.filter((model) => model && model.position);

  if (targetId) {
    const target = filtered.find((model) => model.id === targetId);
    if (!target) return false;

    const targetBounds =
      getModelBounds(targetId) || buildBoundsFromModel(target);

    return filtered.some((model) => {
      if (model.id === targetId) return false;
      const otherBounds =
        getModelBounds(model.id) || buildBoundsFromModel(model);

      if (targetBounds && otherBounds) {
        return boxesOverlap(targetBounds, otherBounds);
      }

      if (!target.dimensions || !model.dimensions) {
        return false;
      }

      return volumesOverlap(
        target.position,
        target.dimensions,
        target.rotation || [0, 0, 0],
        model.position,
        model.dimensions,
        model.rotation || [0, 0, 0]
      );
    });
  }

  for (let i = 0; i < filtered.length; i++) {
    const a = filtered[i];
    for (let j = i + 1; j < filtered.length; j++) {
      const b = filtered[j];
      const aBounds = getModelBounds(a.id) || buildBoundsFromModel(a);
      const bBounds = getModelBounds(b.id) || buildBoundsFromModel(b);

      if (aBounds && bBounds) {
        if (boxesOverlap(aBounds, bBounds)) {
          return true;
        }
        continue;
      }

      if (
        a.dimensions &&
        b.dimensions &&
        volumesOverlap(
          a.position,
          a.dimensions,
          a.rotation || [0, 0, 0],
          b.position,
          b.dimensions,
          b.rotation || [0, 0, 0]
        )
      ) {
        return true;
      }
    }
  }

  return false;
};

const normalizeModel = (model) => {
  if (!model) return null;
  const normalized = {
    id: model.id,
    path: model.path,
    color: model.color ?? null,
    position: Array.isArray(model.position) ? model.position : [0, 0, 0],
    rotation: Array.isArray(model.rotation) ? model.rotation : [0, 0, 0],
    noColor: model.noColor ?? false,
  };
  if (model.dimensions) {
    normalized.dimensions = model.dimensions;
  }
  return normalized;
};

const normalizeModels = (models) => {
  if (!Array.isArray(models)) return [];
  return models.map(normalizeModel).filter(Boolean);
};

const serializeModels = (models) => {
  const normalized = normalizeModels(models);
  return JSON.stringify(normalized);
};

const useModelStore = create((set, get) => ({
  // Scope
  currentProjectId: null,
  selectedModels: [],
  lastSavedSnapshot: null,
  hasUnsavedChanges: false,
  isProjectLoaded: false,
  unsavedChanges: [],
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
    rotationDeg: 90,
    gridCellSize: 1, // سایز خانه‌های شطرنجی (واحد: متر)
  },
  modelsRef: {},
  zoomLevel: 50, // FOV value for camera zoom
  constrainToGrid: false,
  draggedModelId: null, // ID of model currently being dragged
  activeControlMode: null, // 'height' | 'rotateY' | 'rotateX' | 'rotateZ' | null
  showColorPanel: false, // Show color picker panel
  allowOverlap: false,
  setAllowOverlap: (value) => set({ allowOverlap: !!value }),
  groupMode: false, // حالت گروهی - حفظ انتخاب‌ها حتی با کلیک روی مدل دیگر
  setGroupMode: (value) => set({ groupMode: !!value }),

  setSelectedModels: (modelPath) =>
    set((state) => {
      const nextModels =
        typeof modelPath === "function"
          ? modelPath(state.selectedModels)
          : modelPath;
      const normalized = normalizeModels(nextModels);

      if (state.isProjectLoaded && !state.allowOverlap) {
        const nextHasOverlap = modelsOverlap(normalized);
        const currentOverlap = modelsOverlap(state.selectedModels);
        if (nextHasOverlap && !currentOverlap) {
          return state;
        }
      }
      const serialized = serializeModels(normalized);
      if (state.lastSavedSnapshot === null || !state.isProjectLoaded) {
        return {
          selectedModels: normalized,
          hasUnsavedChanges: false,
          unsavedChanges: [],
        };
      }
      const hasChanged = serialized !== state.lastSavedSnapshot;
      
      let newUnsavedChanges = state.unsavedChanges;
      if (hasChanged && state.isProjectLoaded) {
        const existingIndex = newUnsavedChanges.findIndex(
          (change) => change.type === 'models_update'
        );
        if (existingIndex >= 0) {
          newUnsavedChanges = [...newUnsavedChanges];
          newUnsavedChanges[existingIndex] = { type: 'models_update', timestamp: Date.now() };
        } else {
          newUnsavedChanges = [...newUnsavedChanges, { type: 'models_update', timestamp: Date.now() }];
        }
      }
      
      return {
        selectedModels: normalized,
        hasUnsavedChanges: newUnsavedChanges.length > 0,
        unsavedChanges: newUnsavedChanges,
      };
    }),

  // Initialize or switch project context and reset per-project states/history
  setProjectContext: (projectId, initialModels = []) =>
    set((state) => {
      const normalizedModels = normalizeModels(initialModels);
      const serialized = serializeModels(normalizedModels);
      
      if (state.currentProjectId === projectId) {
        return {
          currentProjectId: projectId,
          selectedModels: normalizedModels,
          lastSavedSnapshot: serialized,
          hasUnsavedChanges: false,
          isProjectLoaded: true,
          unsavedChanges: [],
        };
      }
      return {
        currentProjectId: projectId,
        selectedModels: normalizedModels,
        selectedModelId: null,
        clipboardModels: [],
        _historyPast: [],
        _historyFuture: [],
        lastSavedSnapshot: serialized,
        hasUnsavedChanges: false,
        isProjectLoaded: true,
        unsavedChanges: [],
      };
    }),

  markAsChanged: () =>
    set((state) => {
      const newUnsavedChanges = state.isProjectLoaded
        ? [...state.unsavedChanges, { type: 'manual_change', timestamp: Date.now() }]
        : state.unsavedChanges;
      return {
        hasUnsavedChanges: newUnsavedChanges.length > 0,
        unsavedChanges: newUnsavedChanges,
      };
    }),

  markChangesAsSaved: () =>
    set((state) => ({
      lastSavedSnapshot: serializeModels(state.selectedModels),
      hasUnsavedChanges: false,
      unsavedChanges: [],
    })),

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
    set((state) => {
      if (!state.isProjectLoaded) return state;
      const updated = state.selectedModels.map((model) =>
        model.id === id ? { ...model, position } : model
      );
      const normalized = normalizeModels(updated);

      if (!state.allowOverlap) {
        const nextHasOverlap = modelsOverlap(normalized, id);
        const currentOverlap = modelsOverlap(state.selectedModels, id);
        if (nextHasOverlap && !currentOverlap) {
          return state;
        }
      }
      const serialized = serializeModels(normalized);
      const hasChanged = state.lastSavedSnapshot !== null && serialized !== state.lastSavedSnapshot;
      
      let newUnsavedChanges = state.unsavedChanges;
      if (hasChanged) {
        const existingIndex = newUnsavedChanges.findIndex(
          (change) => change.type === 'position_update' && change.modelId === id
        );
        if (existingIndex >= 0) {
          newUnsavedChanges = [...newUnsavedChanges];
          newUnsavedChanges[existingIndex] = { type: 'position_update', modelId: id, timestamp: Date.now() };
        } else {
          newUnsavedChanges = [...newUnsavedChanges, { type: 'position_update', modelId: id, timestamp: Date.now() }];
        }
      }
      
      return {
        selectedModels: normalized,
        hasUnsavedChanges: newUnsavedChanges.length > 0,
        unsavedChanges: newUnsavedChanges,
      };
    }),

  updateModelRotation: (id, newRotation) =>
    set((state) => {
      if (!state.isProjectLoaded) return state;
      const updated = state.selectedModels.map((model) =>
        model.id === id ? { ...model, rotation: newRotation } : model
      );
      const normalized = normalizeModels(updated);
      const serialized = serializeModels(normalized);
      const hasChanged = state.lastSavedSnapshot !== null && serialized !== state.lastSavedSnapshot;
      
      let newUnsavedChanges = state.unsavedChanges;
      if (hasChanged) {
        const existingIndex = newUnsavedChanges.findIndex(
          (change) => change.type === 'rotation_update' && change.modelId === id
        );
        if (existingIndex >= 0) {
          newUnsavedChanges = [...newUnsavedChanges];
          newUnsavedChanges[existingIndex] = { type: 'rotation_update', modelId: id, timestamp: Date.now() };
        } else {
          newUnsavedChanges = [...newUnsavedChanges, { type: 'rotation_update', modelId: id, timestamp: Date.now() }];
        }
      }
      
      return {
        selectedModels: normalized,
        hasUnsavedChanges: newUnsavedChanges.length > 0,
        unsavedChanges: newUnsavedChanges,
      };
    }),

  updateModelDimensions: (id, dimensions) =>
    set((state) => {
      if (!state.isProjectLoaded) return state;
      const updated = state.selectedModels.map((model) =>
        model.id === id ? { ...model, dimensions } : model
      );
      const normalized = normalizeModels(updated);
      const serialized = serializeModels(normalized);
      const hasChanged = state.lastSavedSnapshot !== null && serialized !== state.lastSavedSnapshot;
      return {
        selectedModels: normalized,
        hasUnsavedChanges: state.unsavedChanges.length > 0,
      };
    }),

  updateModelColor: (target, color) =>
    set((state) => {
      if (!state.isProjectLoaded) return state;
      const isAll = target === "ALL";
      const isArray = Array.isArray(target);
      const targetIds = isAll
        ? state.selectedModels.map((m) => m.id)
        : isArray
        ? target
        : [target];

      const updated = state.selectedModels.map((model) =>
        targetIds.includes(model.id)
          ? { ...model, color, noColor: false }
          : model
      );
      const normalized = normalizeModels(updated);
      const serialized = serializeModels(normalized);

      const historyUpdate = state.currentProjectId
        ? {
            _historyPast: [...state._historyPast, state._cloneModels(state.selectedModels)],
            _historyFuture: [],
          }
        : {};

      const hasChanged = state.lastSavedSnapshot !== null && serialized !== state.lastSavedSnapshot;
      
      let newUnsavedChanges = state.unsavedChanges;
      if (hasChanged) {
        const existingIndex = newUnsavedChanges.findIndex(
          (change) => change.type === 'color_update'
        );
        if (existingIndex >= 0) {
          newUnsavedChanges = [...newUnsavedChanges];
          newUnsavedChanges[existingIndex] = { type: 'color_update', timestamp: Date.now() };
        } else {
          newUnsavedChanges = [...newUnsavedChanges, { type: 'color_update', timestamp: Date.now() }];
        }
      }
      
      return {
        ...historyUpdate,
        selectedModels: normalized,
        hasUnsavedChanges: newUnsavedChanges.length > 0,
        unsavedChanges: newUnsavedChanges,
      };
    }),

  updateModelNoColor: (target, value) =>
    set((state) => {
      if (!state.isProjectLoaded) return state;
      const isAll = target === "ALL";
      const isArray = Array.isArray(target);
      const targetIds = isAll
        ? state.selectedModels.map((m) => m.id)
        : isArray
        ? target
        : [target];

      const updated = state.selectedModels.map((model) =>
        targetIds.includes(model.id)
          ? {
              ...model,
              noColor: !!value,
              color: value ? null : model.color,
            }
          : model
      );
      const normalized = normalizeModels(updated);
      const serialized = serializeModels(normalized);

      const historyUpdate = state.currentProjectId
        ? {
            _historyPast: [...state._historyPast, state._cloneModels(state.selectedModels)],
            _historyFuture: [],
          }
        : {};

      const hasChanged = state.lastSavedSnapshot !== null && serialized !== state.lastSavedSnapshot;
      
      let newUnsavedChanges = state.unsavedChanges;
      if (hasChanged) {
        const existingIndex = newUnsavedChanges.findIndex(
          (change) => change.type === 'no_color_update'
        );
        if (existingIndex >= 0) {
          newUnsavedChanges = [...newUnsavedChanges];
          newUnsavedChanges[existingIndex] = { type: 'no_color_update', timestamp: Date.now() };
        } else {
          newUnsavedChanges = [...newUnsavedChanges, { type: 'no_color_update', timestamp: Date.now() }];
        }
      }
      
      return {
        ...historyUpdate,
        selectedModels: normalized,
        hasUnsavedChanges: newUnsavedChanges.length > 0,
        unsavedChanges: newUnsavedChanges,
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
    if (!state.currentProjectId || !state.isProjectLoaded) return;
    if (state._historyPast.length === 0) return;
    const past = [...state._historyPast];
    const previous = past.pop();
    const current = state._cloneModels(state.selectedModels);
    const normalized = normalizeModels(previous);
    const serialized = serializeModels(normalized);
    const hasChanged = state.lastSavedSnapshot !== null && serialized !== state.lastSavedSnapshot;
    
    let newUnsavedChanges = state.unsavedChanges;
    if (hasChanged) {
      const existingIndex = newUnsavedChanges.findIndex(
        (change) => change.type === 'undo'
      );
      if (existingIndex >= 0) {
        newUnsavedChanges = [...newUnsavedChanges];
        newUnsavedChanges[existingIndex] = { type: 'undo', timestamp: Date.now() };
      } else {
        newUnsavedChanges = [...newUnsavedChanges, { type: 'undo', timestamp: Date.now() }];
      }
    }
    
    set({
      selectedModels: normalized,
      _historyPast: past,
      _historyFuture: [...state._historyFuture, current],
      hasUnsavedChanges: newUnsavedChanges.length > 0,
      unsavedChanges: newUnsavedChanges,
    });
  },

  redo: () => {
    const state = get();
    if (!state.currentProjectId || !state.isProjectLoaded) return;
    if (state._historyFuture.length === 0) return;
    const future = [...state._historyFuture];
    const next = future.pop();
    const current = state._cloneModels(state.selectedModels);
    const normalized = normalizeModels(next);
    const serialized = serializeModels(normalized);
    const hasChanged = state.lastSavedSnapshot !== null && serialized !== state.lastSavedSnapshot;
    
    let newUnsavedChanges = state.unsavedChanges;
    if (hasChanged) {
      const existingIndex = newUnsavedChanges.findIndex(
        (change) => change.type === 'redo'
      );
      if (existingIndex >= 0) {
        newUnsavedChanges = [...newUnsavedChanges];
        newUnsavedChanges[existingIndex] = { type: 'redo', timestamp: Date.now() };
      } else {
        newUnsavedChanges = [...newUnsavedChanges, { type: 'redo', timestamp: Date.now() }];
      }
    }
    
    set({
      selectedModels: normalized,
      _historyPast: [...state._historyPast, current],
      _historyFuture: future,
      hasUnsavedChanges: newUnsavedChanges.length > 0,
      unsavedChanges: newUnsavedChanges,
    });
  },
}));

export default useModelStore;
