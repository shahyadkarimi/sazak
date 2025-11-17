"use client";
import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import useModelStore from "@/store/useModelStore";
import Model from "./Model";
import ModelPlacer from "./ModelPlacer";
import CustomGrid from "../home/CustomGrid";
import SelectedModelPanel from "./SelectedModelPanel";
import { useMemo } from "react";
import { postData } from "@/services/API";
import toast, { Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { toFarsiNumber } from "@/helper/helper";
import { clampPositionToGrid } from "@/helper/gridConstraints";
import { getModelType, getModelDimensions } from "@/helper/snapDetection";
import { calculateRotatedBoundingBox } from "@/helper/helper";
import HeightIcon from "../icons/HeightIcon";
import RotateIcon from "../icons/RotateIcon";
import { Tooltip } from "@heroui/react";
const ZoomController = () => {
  const { camera } = useThree();
  const zoomLevel = useModelStore((state) => state.zoomLevel);
  const { zoomIn, zoomOut } = useModelStore();
  useEffect(() => {
    if (!camera) return;
    camera.fov = zoomLevel;
    camera.updateProjectionMatrix();
  }, [camera, zoomLevel]);
  useEffect(() => {
    const handleKeyPress = (event) => {
      // Check if the target is not an input field
      if (
        event.target.tagName === "INPUT" ||
        event.target.tagName === "TEXTAREA"
      ) {
        return;
      }
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        zoomIn();
      } else if (event.key === "-") {
        event.preventDefault();
        zoomOut();
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [zoomIn, zoomOut]);
  return null;
};

const KeyboardController = ({ onShowHelp }) => {
  const selectedModels = useModelStore((state) => state.selectedModels);
  const selectedModelId = useModelStore((state) => state.selectedModelId);
  const setSelectedModelId = useModelStore((state) => state.setSelectedModelId);
  const setClipboardModels = useModelStore((state) => state.setClipboardModels);
  const setSelectedModels = useModelStore((state) => state.setSelectedModels);
  const clipboardModels = useModelStore((state) => state.clipboardModels);
  const isPasteMode = useModelStore((state) => state.isPasteMode);
  const setIsPasteMode = useModelStore((state) => state.setIsPasteMode);
  const pushHistory = useModelStore((state) => state.pushHistory);
  const undo = useModelStore((state) => state.undo);
  const redo = useModelStore((state) => state.redo);
  const activeControlMode = useModelStore((state) => state.activeControlMode);
  const setActiveControlMode = useModelStore(
    (state) => state.setActiveControlMode
  );
  // Copy selected model(s)
  const copyModel = () => {
    if (!selectedModelId) return;
    // Get models to copy based on selection
    let modelsToCopy = [];
    if (selectedModelId === "ALL") {
      modelsToCopy = selectedModels.map((model) => ({
        ...model,
        action: "copy",
      }));
    } else if (Array.isArray(selectedModelId)) {
      modelsToCopy = selectedModels
        .filter((model) => selectedModelId.includes(model.id))
        .map((model) => ({ ...model, action: "copy" }));
    } else {
      const selectedModel = selectedModels.find(
        (model) => model.id === selectedModelId
      );
      if (selectedModel) {
        modelsToCopy = [{ ...selectedModel, action: "copy" }];
      }
    }
    if (modelsToCopy.length > 0) {
      pushHistory();
      setClipboardModels(modelsToCopy);
      toast.success(`${modelsToCopy.length} مدل کپی شد`, {
        duration: 2000,
        className: "text-sm rounded-2xl",
      });
    }
  };
  // Cut selected model(s)
  const cutModel = () => {
    if (!selectedModelId) return;
    // Determine IDs to cut and get models for clipboard
    let idsToCut = [];
    let modelsToCut = [];
    if (selectedModelId === "ALL") {
      idsToCut = selectedModels.map((m) => m.id);
      modelsToCut = selectedModels.map((model) => ({
        ...model,
        action: "cut",
      }));
    } else if (Array.isArray(selectedModelId)) {
      idsToCut = [...selectedModelId];
      modelsToCut = selectedModels
        .filter((model) => selectedModelId.includes(model.id))
        .map((model) => ({ ...model, action: "cut" }));
    } else {
      idsToCut = [selectedModelId];
      const selectedModel = selectedModels.find(
        (model) => model.id === selectedModelId
      );
      if (selectedModel) {
        modelsToCut = [{ ...selectedModel, action: "cut" }];
      }
    }
    if (modelsToCut.length > 0) {
      setClipboardModels(modelsToCut);
      pushHistory();
      setSelectedModels(
        selectedModels.filter((model) => !idsToCut.includes(model.id))
      );
      setSelectedModelId(null);
      toast.success(
        `${modelsToCut.length} مدل بریده شد و در کلیپ‌بورد قرار گرفت`,
        {
          duration: 2000,
          className: "text-sm rounded-2xl",
        }
      );
    }
  };
  // Toggle paste mode
  const togglePasteMode = () => {
    if (!clipboardModels || clipboardModels.length === 0) return;
    setIsPasteMode(!isPasteMode);
    if (!isPasteMode) {
      toast.success(
        `حالت پیست فعال شد. ${clipboardModels.length} مدل آماده پیست است. روی محل مورد نظر کلیک کنید`,
        {
          duration: 3000,
          className: "text-sm rounded-2xl",
        }
      );
    } else {
      toast.success("حالت پیست غیرفعال شد", {
        duration: 2000,
        className: "text-sm rounded-2xl",
      });
    }
  };
  useEffect(() => {
    const handleKeyPress = (event) => {
      // Check if the target is not an input field
      if (
        event.target.tagName === "INPUT" ||
        event.target.tagName === "TEXTAREA"
      ) {
        return;
      }
      // Ctrl+C - Copy selected model (use code for layout-agnostic)
      if ((event.ctrlKey || event.metaKey) && event.code === "KeyC") {
        event.preventDefault();
        copyModel();
      }
      // Ctrl+X - Cut selected model
      if ((event.ctrlKey || event.metaKey) && event.code === "KeyX") {
        event.preventDefault();
        cutModel();
      }
      // Ctrl+V - Toggle paste mode
      if ((event.ctrlKey || event.metaKey) && event.code === "KeyV") {
        event.preventDefault();
        togglePasteMode();
      }
      // Delete key - delete selected model(s)
      if (event.key === "Delete" || event.key === "Backspace") {
        if (selectedModelId) {
          event.preventDefault();
          pushHistory();
          if (selectedModelId === "ALL") {
            setSelectedModels([]);
            setSelectedModelId(null);
          } else if (Array.isArray(selectedModelId)) {
            setSelectedModels(
              selectedModels.filter(
                (model) => !selectedModelId.includes(model.id)
              )
            );
            setSelectedModelId(null);
          } else {
            setSelectedModels(
              selectedModels.filter((model) => model.id !== selectedModelId)
            );
            setSelectedModelId(null);
          }
        }
      }
      // Ctrl+A - select all models (prevent browser Select All)
      if ((event.ctrlKey || event.metaKey) && event.code === "KeyA") {
        event.preventDefault();
        event.stopPropagation();
        if (selectedModels.length > 0) {
          setSelectedModelId("ALL");
          // Make sure selectedModels contains all models when selecting all
          // This ensures the drag functionality works correctly
        }
        return;
      }
      // Ctrl+D - Duplicate selected model
      if ((event.ctrlKey || event.metaKey) && event.code === "KeyD") {
        event.preventDefault();
        if (selectedModelId) {
          const selectedModel = selectedModels.find(
            (model) => model.id === selectedModelId
          );
          if (selectedModel) {
            const newModel = {
              ...selectedModel,
              id: Date.now().toString(),
              position: [
                selectedModel.position[0] + 1,
                selectedModel.position[1],
                selectedModel.position[2] + 1,
              ],
            };
            pushHistory();
            setSelectedModels([...selectedModels, newModel]);
            setSelectedModelId(newModel.id);
            toast.success("مدل تکثیر شد (Ctrl+D)", {
              duration: 2000,
              className: "text-sm rounded-2xl",
            });
          }
        }
      }
      // Ctrl+Z - Undo
      if (
        (event.ctrlKey || event.metaKey) &&
        event.code === "KeyZ" &&
        !event.shiftKey
      ) {
        event.preventDefault();
        undo();
      }
      // Ctrl+Shift+Z - Redo
      if (
        (event.ctrlKey || event.metaKey) &&
        event.code === "KeyZ" &&
        event.shiftKey
      ) {
        event.preventDefault();
        redo();
      }
      // Space - Toggle orbit controls (placeholder)
      if (event.key === " ") {
        event.preventDefault();
        toast.info("قابلیت کنترل دوربین به زودی اضافه خواهد شد", {
          duration: 2000,
          className: "text-sm rounded-2xl",
        });
      }
      // Arrow keys - Move selected model(s)
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)
      ) {
        if (selectedModelId) {
          event.preventDefault();
          pushHistory();
          const moveStep = event.shiftKey ? 0.5 : 1; // Shift for smaller steps
          const applyDelta = (model) => {
            const np = [...model.position];
            switch (event.key) {
              case "ArrowUp":
                np[2] -= moveStep;
                break;
              case "ArrowDown":
                np[2] += moveStep;
                break;
              case "ArrowLeft":
                np[0] -= moveStep;
                break;
              case "ArrowRight":
                np[0] += moveStep;
                break;
            }
            if (useModelStore.getState().constrainToGrid) {
              return clampPositionToGrid(
                np,
                model?.dimensions,
                model?.rotation
              );
            }
            return np;
          };
          if (selectedModelId === "ALL") {
            setSelectedModels(
              selectedModels.map((model) => ({
                ...model,
                position: applyDelta(model),
              }))
            );
          } else if (Array.isArray(selectedModelId)) {
            setSelectedModels(
              selectedModels.map((model) =>
                selectedModelId.includes(model.id)
                  ? { ...model, position: applyDelta(model) }
                  : model
              )
            );
          } else {
            const selectedModel = selectedModels.find(
              (model) => model.id === selectedModelId
            );
            if (selectedModel) {
              const newPosition = applyDelta(selectedModel);
              setSelectedModels(
                selectedModels.map((model) =>
                  model.id === selectedModelId
                    ? { ...model, position: newPosition }
                    : model
                )
              );
            }
          }
        }
      }
      // F1 - Show help modal
      if (event.key === "F1") {
        event.preventDefault();
        onShowHelp(true);
      }
      // Escape - deactivate control mode, exit paste mode, and deselect all
      if (event.key === "Escape") {
        event.preventDefault();
        // Deactivate active control mode (height, rotation buttons)
        if (activeControlMode) {
          setActiveControlMode(null);
          // Also deselect models when deactivating control mode
          setSelectedModelId(null);
          return;
        }
        // If no control mode is active, then deselect models and exit paste mode
        setSelectedModelId(null);
        if (isPasteMode) {
          setIsPasteMode(false);
          toast.success("حالت پیست غیرفعال شد", {
            duration: 2000,
            className: "text-sm rounded-2xl",
          });
        }
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [
    selectedModelId,
    selectedModels,
    setSelectedModelId,
    setSelectedModels,
    clipboardModels,
    setClipboardModels,
    isPasteMode,
    setIsPasteMode,
    activeControlMode,
    setActiveControlMode,
    onShowHelp,
  ]);
  return null;
};
const PasteHandler = () => {
  const { camera, gl } = useThree();
  const isPasteMode = useModelStore((state) => state.isPasteMode);
  const setIsPasteMode = useModelStore((state) => state.setIsPasteMode);
  const clipboardModels = useModelStore((state) => state.clipboardModels);
  const setSelectedModels = useModelStore((state) => state.setSelectedModels);
  const setSelectedModelId = useModelStore((state) => state.setSelectedModelId);
  const selectedModels = useModelStore((state) => state.selectedModels);
  const pushHistory = useModelStore((state) => state.pushHistory);
  const handlePaste = (event) => {
    if (!isPasteMode || !clipboardModels || clipboardModels.length === 0)
      return;
    // Get intersection point on the ground plane
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    // Get mouse position relative to canvas
    const rect = gl.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    // Intersect with ground plane (y = 0)
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersectionPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(groundPlane, intersectionPoint);
    if (intersectionPoint) {
      // Calculate the center point of the original selection
      const originalCenter = {
        x:
          clipboardModels.reduce((sum, model) => sum + model.position[0], 0) /
          clipboardModels.length,
        z:
          clipboardModels.reduce((sum, model) => sum + model.position[2], 0) /
          clipboardModels.length,
      };
      // Create new models preserving their relative positions
      const newModels = clipboardModels.map((model, index) => {
        // Calculate offset from original center
        const offsetX = model.position[0] - originalCenter.x;
        const offsetZ = model.position[2] - originalCenter.z;
        return {
          ...model,
          id: (Date.now() + index).toString(),
          position: [
            intersectionPoint.x + offsetX,
            model.position[1],
            intersectionPoint.z + offsetZ,
          ],
        };
      });
      pushHistory();
      setSelectedModels([...selectedModels, ...newModels]);
      setSelectedModelId(newModels[newModels.length - 1].id); // Select the last pasted model
      setIsPasteMode(false);
      toast.success(`${newModels.length} مدل در موقعیت جدید قرار گرفت`, {
        duration: 2000,
        className: "text-sm rounded-2xl",
      });
    }
  };
  useEffect(() => {
    if (!isPasteMode) return;
    const handleClick = (event) => {
      handlePaste(event);
    };
    gl.domElement.addEventListener("click", handleClick);
    return () => gl.domElement.removeEventListener("click", handleClick);
  }, [
    isPasteMode,
    clipboardModels,
    camera,
    gl,
    selectedModels,
    setSelectedModels,
    setSelectedModelId,
    setIsPasteMode,
  ]);
  return null;
};
const CameraAnimator = ({ targetView, controlsRef, durationMs = 450 }) => {
  const { camera } = useThree();
  const startRef = useRef(null);
  const endRef = useRef(null);
  const startTimeRef = useRef(0);
  const animatingRef = useRef(false);
  useEffect(() => {
    if (!targetView || !camera) return;
    if (!Array.isArray(targetView.camera)) return;
    // Immediate set (used for drag on view cube)
    if (targetView.immediate) {
      camera.position.set(
        targetView.camera[0],
        targetView.camera[1],
        targetView.camera[2]
      );
      if (targetView.fov) {
        camera.fov = targetView.fov;
        camera.updateProjectionMatrix();
      }
      camera.lookAt(0, 0, 0);
      if (controlsRef && controlsRef.current) {
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      }
      animatingRef.current = false;
      return;
    }
    // Animated transition for clicks
    startRef.current = camera.position.clone();
    endRef.current = new THREE.Vector3(
      targetView.camera[0],
      targetView.camera[1],
      targetView.camera[2]
    );
    startTimeRef.current = performance.now();
    animatingRef.current = true;
    if (targetView.fov) {
      camera.fov = targetView.fov;
      camera.updateProjectionMatrix();
    }
  }, [targetView, camera, controlsRef]);
  useFrame(() => {
    if (!animatingRef.current || !startRef.current || !endRef.current) return;
    const now = performance.now();
    const t = Math.min(1, (now - startTimeRef.current) / durationMs);
    // easeInOutCubic
    const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const next = new THREE.Vector3().lerpVectors(
      startRef.current,
      endRef.current,
      ease
    );
    camera.position.copy(next);
    camera.lookAt(0, 0, 0);
    if (controlsRef && controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
    if (t === 1) {
      animatingRef.current = false;
    }
  });
  return null;
};
const CameraTracker = ({ onCameraUpdate }) => {
  const { camera } = useThree();
  useFrame(() => {
    if (camera && onCameraUpdate) {
      onCameraUpdate(camera);
    }
  });
  return null;
};
// Selection Box Handler Component (inside Canvas to access Three.js context)
const SelectionBoxHandler = ({ canvasContainerRef, onSelectionBoxChange }) => {
  const { camera, gl, scene } = useThree();
  const selectedModels = useModelStore((state) => state.selectedModels);
  const isPasteMode = useModelStore((state) => state.isPasteMode);
  const isAdjustingHeight = useModelStore((state) => state.isAdjustingHeight);
  const draggedModelId = useModelStore((state) => state.draggedModelId);
  const activeControlMode = useModelStore((state) => state.activeControlMode);
  const setSelectedModelId = useModelStore((state) => state.setSelectedModelId);

  // Convert 3D position to screen coordinates
  const worldToScreen = useCallback((position) => {
    const vector = new THREE.Vector3(position[0], position[1], position[2]);
    vector.project(camera);
    const x = (vector.x * 0.5 + 0.5) * gl.domElement.clientWidth;
    const y = (vector.y * -0.5 + 0.5) * gl.domElement.clientHeight;
    return { x, y };
  }, [camera, gl]);

  // Get model bounding box corners in screen space
  const getModelScreenBounds = useCallback((model) => {
    let dimensions = model.dimensions;
    if (!dimensions || typeof dimensions.x !== 'number' || typeof dimensions.y !== 'number' || typeof dimensions.z !== 'number') {
      const modelType = getModelType(model.path);
      dimensions = getModelDimensions(modelType, 1);
    }

    if (!dimensions || typeof dimensions.x !== 'number') {
      // Fallback to just center point with small bounds
      const center = worldToScreen(model.position);
      return { 
        minX: center.x - 10, 
        maxX: center.x + 10, 
        minY: center.y - 10, 
        maxY: center.y + 10 
      };
    }

    const [x, y, z] = model.position;
    const halfX = dimensions.x / 2;
    const halfY = dimensions.y / 2;
    const halfZ = dimensions.z / 2;

    // Get 8 corners of bounding box
    const corners = [
      [x - halfX, y - halfY, z - halfZ],
      [x + halfX, y - halfY, z - halfZ],
      [x - halfX, y + halfY, z - halfZ],
      [x + halfX, y + halfY, z - halfZ],
      [x - halfX, y - halfY, z + halfZ],
      [x + halfX, y - halfY, z + halfZ],
      [x - halfX, y + halfY, z + halfZ],
      [x + halfX, y + halfY, z + halfZ],
    ];

    // Convert all corners to screen space and find bounding rect
    const screenCorners = corners.map(corner => worldToScreen(corner));
    const minX = Math.min(...screenCorners.map(p => p.x));
    const maxX = Math.max(...screenCorners.map(p => p.x));
    const minY = Math.min(...screenCorners.map(p => p.y));
    const maxY = Math.max(...screenCorners.map(p => p.y));

    return { minX, maxX, minY, maxY };
  }, [worldToScreen]);

  // Check if model bounding box intersects with selection rectangle
  const isModelInSelection = useCallback((model, selectionRect) => {
    const bounds = getModelScreenBounds(model);
    const rectMinX = Math.min(selectionRect.startX, selectionRect.endX);
    const rectMaxX = Math.max(selectionRect.startX, selectionRect.endX);
    const rectMinY = Math.min(selectionRect.startY, selectionRect.endY);
    const rectMaxY = Math.max(selectionRect.startY, selectionRect.endY);

    // Check if bounding boxes overlap
    return !(
      bounds.maxX < rectMinX ||
      bounds.minX > rectMaxX ||
      bounds.maxY < rectMinY ||
      bounds.minY > rectMaxY
    );
  }, [getModelScreenBounds]);

  const selectionStateRef = useRef({
    isSelecting: false,
    startPos: null,
    endPos: null,
    hasMoved: false,
  });

  useEffect(() => {
    if (!canvasContainerRef?.current) return;
    const canvas = canvasContainerRef.current.querySelector('canvas');
    if (!canvas) return;

    const handleMouseDown = (event) => {
      // Only activate selection box with left mouse button
      if (event.button !== 0) return;
      
      // Don't activate if:
      if (
        isPasteMode ||
        isAdjustingHeight ||
        draggedModelId ||
        activeControlMode ||
        event.target !== canvas
      ) {
        return;
      }

      // Check if we're clicking on a model by raycasting
      const rect = canvas.getBoundingClientRect();
      const mouse = new THREE.Vector2();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      
      // Check all objects in scene for intersection
      // Filter to only check meshes (models) and exclude lines (grid)
      const allObjects = [];
      scene.traverse((obj) => {
        // Only check meshes (models), skip lines (grid) and other helper objects
        if (obj.isMesh && obj.visible) {
          allObjects.push(obj);
        }
      });
      
      const intersects = raycaster.intersectObjects(allObjects, false);
      
      // If we hit any mesh (model), don't start selection box
      // Grid uses Line objects, so they won't be in our filtered list
      if (intersects.length > 0) {
        return;
      }

      // Start selection box
      const state = selectionStateRef.current;
      state.isSelecting = true;
      state.hasMoved = false;
      state.startPos = { x: event.clientX, y: event.clientY };
      state.endPos = { x: event.clientX, y: event.clientY };
      onSelectionBoxChange({ 
        isSelecting: true, 
        startPos: state.startPos, 
        endPos: state.endPos 
      });
    };

    const handleMouseMove = (event) => {
      const state = selectionStateRef.current;
      
      // اگر drag شروع شده، باکس انتخاب را متوقف کن
      const currentDraggedModelId = useModelStore.getState().draggedModelId;
      if (currentDraggedModelId) {
        if (state.isSelecting) {
          state.isSelecting = false;
          state.hasMoved = false;
          state.startPos = null;
          state.endPos = null;
          onSelectionBoxChange({ isSelecting: false, startPos: null, endPos: null });
        }
        return;
      }
      
      if (!state.isSelecting) return;
      
      state.hasMoved = true;
      state.endPos = { x: event.clientX, y: event.clientY };
      onSelectionBoxChange({ 
        isSelecting: true, 
        startPos: state.startPos, 
        endPos: state.endPos 
      });
    };

    const handleMouseUp = (event) => {
      const state = selectionStateRef.current;
      if (!state.isSelecting) return;
      
      const wasSelecting = state.isSelecting;
      const hadMoved = state.hasMoved;
      const start = state.startPos;
      const end = state.endPos;
      
      // Reset state
      state.isSelecting = false;
      state.hasMoved = false;
      state.startPos = null;
      state.endPos = null;
      onSelectionBoxChange({ isSelecting: false, startPos: null, endPos: null });

      // Only process selection if mouse moved significantly
      if (!wasSelecting || !hadMoved || !start || !end) {
        return;
      }

      // Calculate selection rectangle
      const rect = canvas.getBoundingClientRect();
      const selectionRect = {
        startX: start.x - rect.left,
        startY: start.y - rect.top,
        endX: end.x - rect.left,
        endY: end.y - rect.top,
      };

      const width = Math.abs(selectionRect.endX - selectionRect.startX);
      const height = Math.abs(selectionRect.endY - selectionRect.startY);
      
      // Only process if selection box is large enough
      if (width < 10 || height < 10) {
        return;
      }

      // Find models inside selection box
      const selectedIds = [];
      selectedModels.forEach((model) => {
        if (isModelInSelection(model, selectionRect)) {
          selectedIds.push(model.id);
        }
      });

      // Update selection
      if (selectedIds.length > 0) {
        setSelectedModelId(selectedIds.length === 1 ? selectedIds[0] : selectedIds);
      } else {
        // Deselect if nothing in selection box
        setSelectedModelId(null);
      }
    };

    // Use capture phase but with a small delay to let model handlers run first
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    isPasteMode,
    isAdjustingHeight,
    draggedModelId,
    activeControlMode,
    selectedModels,
    setSelectedModelId,
    camera,
    scene,
    canvasContainerRef,
    isModelInSelection,
    onSelectionBoxChange,
  ]);

  return null;
};

const GridPage = ({ project, cameraView, onViewChange, mainCameraRef }) => {
  const selectedModels = useModelStore((state) => state.selectedModels);
  const isAdjustingHeight = useModelStore((state) => state.isAdjustingHeight);
  const setSelectedModelId = useModelStore((state) => state.setSelectedModelId);
  const isPasteMode = useModelStore((state) => state.isPasteMode);
  const clipboardModels = useModelStore((state) => state.clipboardModels);
  const modelOptions = useModelStore((state) => state.modelOptions);
  const setModelOptions = useModelStore((state) => state.setModelOptions);
  const [showHelp, setShowHelp] = useState(false);
  const [showSnapGrid, setShowSnapGrid] = useState(false);
  const [selectionBox, setSelectionBox] = useState({
    isSelecting: false,
    startPos: null,
    endPos: null,
  });
  const controlsRef = useRef();
  const router = useRouter();
  const gridSnapSize = [0.1, 0.5, 1, 2, 5];
  const rotationOptions = [15, 30, 45, 90, 180];
  const changeSnapSizeHandler = (size) => {
    setModelOptions({ snapSize: size });
  };
  const changeRotationDegHandler = (angle) => {
    setModelOptions({ rotationDeg: angle });
  };
  useEffect(() => {
    const onReset = () => {
      onViewChange &&
        onViewChange({ camera: [10, 25, 10], fov: 50, immediate: false });
    };
    if (typeof window !== "undefined") {
      window.addEventListener("designStudio:resetView", onReset);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("designStudio:resetView", onReset);
      }
    };
  }, [onViewChange]);
  // Close snap grid dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSnapGrid && !event.target.closest(".snap-grid-selector")) {
        setShowSnapGrid(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSnapGrid]);
  // Fix Chrome rendering issues with proper CSS and context handling
  const canvasContainerRef = useRef(null);
  const [canvasKey, setCanvasKey] = useState(0);
  const [dpr, setDpr] = useState([1, 1]);
 
  useEffect(() => {
    if (!canvasContainerRef.current) return;
    // Set DPR cap with device pixel ratio (max 1.5) to balance quality and GPU memory
    try {
      const cap = Math.min(window.devicePixelRatio || 1, 1.5);
      setDpr([1, cap]);
    } catch (e) {
      setDpr([1, 1]);
    }
    let canvas = canvasContainerRef.current.querySelector('canvas');
    if (!canvas) {
      // Wait for canvas to be created
      const checkCanvas = setInterval(() => {
        canvas = canvasContainerRef.current?.querySelector('canvas');
        if (canvas) {
          clearInterval(checkCanvas);
          setupCanvas();
        }
      }, 100);
      return () => clearInterval(checkCanvas);
    }
    function setupCanvas() {
      if (!canvas) return;
      // Handle WebGL context loss
      const handleContextLost = (event) => {
        event.preventDefault();
        console.warn('WebGL context lost in main canvas');
        try {
          // show a visible toast so user knows; toast import exists in file
          toast.error('WebGL context lost — attempting to recover', {
            duration: 4000,
            className: 'text-sm rounded-2xl',
          });
        } catch (e) {}
      };
      const handleContextRestored = () => {
        console.log('WebGL context restored in main canvas');
        setCanvasKey(prev => prev + 1);
      };
      canvas.addEventListener('webglcontextlost', handleContextLost);
      canvas.addEventListener('webglcontextrestored', handleContextRestored);
      
      // Apply styles to fix Chrome rendering
      requestAnimationFrame(() => {
        if (canvas) {
          // Try to limit repaint and layout churn
          canvas.style.contain = 'layout style paint';
          canvas.style.willChange = 'transform';
          canvas.style.position = 'absolute';
          canvas.style.top = '0';
          canvas.style.left = '0';
          canvas.style.width = '100%';
          canvas.style.height = '100%';

          if (canvasContainerRef.current) {
            canvasContainerRef.current.style.position = 'absolute';
            canvasContainerRef.current.style.inset = '0';
            canvasContainerRef.current.style.contain = 'paint';
            canvasContainerRef.current.style.willChange = 'contents';
          }
        }
      });
      return () => {
        canvas?.removeEventListener('webglcontextlost', handleContextLost);
        canvas?.removeEventListener('webglcontextrestored', handleContextRestored);
      };
    }
    const cleanup = setupCanvas();
    return cleanup;
  }, [canvasKey]);
  return (
    <div className="w-full h-full relative" style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      isolation: 'isolate',
    }}>
      <Toaster />
      {/* Paste mode indicator */}
      {isPasteMode && clipboardModels && clipboardModels.length > 0 && (
        <div className="absolute top-4 left-4 bg-primaryThemeColor text-white px-4 py-2 rounded-xl shadow-lg z-[60]">
          <div className="flex items-center gap-2">
            <i className="fi fi-rr-paste size-4"></i>
            <span className="text-sm font-medium">
              حالت پیست فعال - {clipboardModels.length} مدل آماده پیست - روی محل
              مورد نظر کلیک کنید
            </span>
          </div>
        </div>
      )}
      <div
        ref={canvasContainerRef}
        className="absolute inset-0 w-full h-full canvas-container"
      >
        <Canvas
          key={canvasKey}
          className={`design-studio ${
            isPasteMode ? "cursor-crosshair" : ""
          }`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'block',
            contain: 'layout style paint',
          }}
          gl={{
            preserveDrawingBuffer: true,
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
            stencil: false,
            depth: true,
            premultipliedAlpha: true,
          }}
          dpr={dpr}
          camera={{ position: [25, 45, 0], fov: 40 }}
          onContextMenu={(e) => {
            e.preventDefault();
          }}
          onCreated={({ gl, scene }) => {
            // Set clear color to light gray background
            gl.setClearColor('#ffffff', 0);
            gl.setPixelRatio(window.devicePixelRatio);
            
            // Store gl context globally for screenshot functionality
            if (typeof window !== 'undefined') {
              window.designStudioGL = gl;
            }
           
            // Handle context loss at Canvas level
            gl.domElement.addEventListener('webglcontextlost', (e) => {
              e.preventDefault();
              if (typeof window !== 'undefined') {
                window.designStudioGL = null;
              }
            });
            gl.domElement.addEventListener('webglcontextrestored', () => {
              if (typeof window !== 'undefined') {
                window.designStudioGL = gl;
              }
              setCanvasKey(prev => prev + 1);
            });
            try {
              console.log('WebGL context attributes:', gl.getContextAttributes());
              console.log('WebGL supported extensions:', gl.getSupportedExtensions());
              const dbg = gl.getExtension && (gl.getExtension('WEBGL_debug_renderer_info') || gl.getExtension('MOZ_WEBGL_debug_renderer_info'));
              if (dbg) {
                console.log('GL VENDOR:', gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL));
                console.log('GL RENDERER:', gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL));
              }
              console.log('MAX_TEXTURE_SIZE:', gl.getParameter(gl.MAX_TEXTURE_SIZE));
            } catch (e) {
              console.warn('Failed to read WebGL debug info', e);
            }
          }}
          onPointerMissed={(event) => {
            // وقتی روی فضای خالی کلیک می‌شود
            const isCtrlPressed = window.isCtrlKeyPressed || false;
            if (!isCtrlPressed) {
              setSelectedModelId(null);
            }
          }}
        >
        <>
          <CameraAnimator targetView={cameraView} controlsRef={controlsRef} />
          <CameraTracker
            onCameraUpdate={(camera) => {
              if (mainCameraRef) mainCameraRef.current = camera;
            }}
          />
          <ZoomController />
          <KeyboardController onShowHelp={setShowHelp} />
          <PasteHandler />
          <SelectionBoxHandler
            canvasContainerRef={canvasContainerRef}
            onSelectionBoxChange={setSelectionBox}
          />
          <ambientLight intensity={1} />
          <directionalLight position={[10, 10, 10]} intensity={1.5} />
          {selectedModels.map((model) => (
            <Model
              key={model.id}
              id={model.id}
              path={model.path}
              position={model.position}
              rotation={model.rotation}
              color={model.color}
              noColor={model.noColor || false}
            />
          ))}
          <ModelPlacer />
          <CustomGrid />
        </>
        <OrbitControls
          ref={controlsRef}
          enableRotate={!isAdjustingHeight}
          enablePan={!isAdjustingHeight}
          zoomToCursor
          mouseButtons={{
            LEFT: undefined,
            MIDDLE: THREE.MOUSE.PAN,
            RIGHT: THREE.MOUSE.ROTATE,
          }}
        />
      </Canvas>
      </div>
      {/* Selection Box Overlay */}
      {selectionBox.isSelecting && selectionBox.startPos && selectionBox.endPos && (
        <div
          style={{
            position: 'fixed',
            left: `${Math.min(selectionBox.startPos.x, selectionBox.endPos.x)}px`,
            top: `${Math.min(selectionBox.startPos.y, selectionBox.endPos.y)}px`,
            width: `${Math.abs(selectionBox.endPos.x - selectionBox.startPos.x)}px`,
            height: `${Math.abs(selectionBox.endPos.y - selectionBox.startPos.y)}px`,
            border: '2px dashed #3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            pointerEvents: 'none',
            zIndex: 1000,
            boxSizing: 'border-box',
          }}
        />
      )}
      <SelectedModelPanel />
      {/* ViewCube is rendered in LeftSidebar; it already syncs with main camera. */}
      {/* Combined Bottom Bar: Control Buttons, Stats, and Snap Selector */}
      <BottomBar
        showSnapGrid={showSnapGrid}
        setShowSnapGrid={setShowSnapGrid}
        changeSnapSizeHandler={changeSnapSizeHandler}
        changeRotationDegHandler={changeRotationDegHandler}
        gridSnapSize={gridSnapSize}
        rotationOptions={rotationOptions}
      />
    </div>
  );
};
export default GridPage;
const ControlButtons = ({ disabled }) => {
  const activeControlMode = useModelStore((state) => state.activeControlMode);
  const setActiveControlMode = useModelStore(
    (state) => state.setActiveControlMode
  );
  return (
    <div className="flex items-center gap-2">
      <Tooltip content="ارتفاع" placement="top" size="sm">
        <button
          onClick={() =>
            !disabled &&
            setActiveControlMode(
              activeControlMode === "height" ? null : "height"
            )
          }
          disabled={disabled}
          className={`flex justify-center items-center size-9 rounded-xl transition-all duration-300 ${
            disabled
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : activeControlMode === "height"
              ? "bg-primaryThemeColor text-white"
              : "bg-gray-200/90 text-gray-700 hover:bg-primaryThemeColor/15 hover:text-primaryThemeColor"
          }`}
        >
          <HeightIcon width={16} height={16} />
        </button>
      </Tooltip>
      <Tooltip content="چرخش Y" placement="top" size="sm">
        <button
          onClick={() =>
            !disabled &&
            setActiveControlMode(
              activeControlMode === "rotateY" ? null : "rotateY"
            )
          }
          disabled={disabled}
          className={`flex justify-center items-center size-9 rounded-xl transition-all duration-300 ${
            disabled
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : activeControlMode === "rotateY"
              ? "bg-primaryThemeColor text-white"
              : "bg-gray-200/90 text-gray-700 hover:bg-primaryThemeColor/15 hover:text-primaryThemeColor"
          }`}
        >
          <RotateIcon />
        </button>
      </Tooltip>
      <Tooltip content="چرخش X" placement="top" size="sm">
        <button
          onClick={() =>
            !disabled &&
            setActiveControlMode(
              activeControlMode === "rotateX" ? null : "rotateX"
            )
          }
          disabled={disabled}
          className={`flex justify-center items-center size-9 rounded-xl transition-all duration-300 ${
            disabled
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : activeControlMode === "rotateX"
              ? "bg-primaryThemeColor text-white"
              : "bg-gray-200/90 text-gray-700 hover:bg-primaryThemeColor/15 hover:text-primaryThemeColor"
          }`}
        >
          <RotateIcon className="-scale-x-100" />
        </button>
      </Tooltip>
      <Tooltip content="چرخش Z" placement="top" size="sm">
        <button
          onClick={() =>
            !disabled &&
            setActiveControlMode(
              activeControlMode === "rotateZ" ? null : "rotateZ"
            )
          }
          disabled={disabled}
          className={`flex justify-center items-center size-9 rounded-xl transition-all duration-300 ${
            disabled
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : activeControlMode === "rotateZ"
              ? "bg-primaryThemeColor text-white"
              : "bg-gray-200/90 text-gray-700 hover:bg-primaryThemeColor/15 hover:text-primaryThemeColor"
          }`}
        >
          <RotateIcon className="-rotate-90" />
        </button>
      </Tooltip>
    </div>
  );
};
const BottomBar = ({
  showSnapGrid,
  setShowSnapGrid,
  changeSnapSizeHandler,
  changeRotationDegHandler,
  gridSnapSize,
  rotationOptions,
}) => {
  const selectedModels = useModelStore((state) => state.selectedModels);
  const selectedModelId = useModelStore((state) => state.selectedModelId);
  const modelOptions = useModelStore((state) => state.modelOptions);
  const hasSelectedModel =
    selectedModelId !== null && selectedModelId !== undefined;
  const { count, totalHeight, totalLength, totalWidth } = useMemo(() => {
    const count = selectedModels.length;
    if (count === 0)
      return { count, totalHeight: 0, totalLength: 0, totalWidth: 0 };
    // محاسبه bounding box کلی برای نمایش بیشترین فضای اشغال شده
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const m of selectedModels) {
      // دریافت ابعاد مدل
      let dimensions = m.dimensions;
      // اگر dimensions وجود ندارد یا کامل نیست، از getModelDimensions استفاده کن
      if (
        !dimensions ||
        typeof dimensions.x !== "number" ||
        typeof dimensions.y !== "number" ||
        typeof dimensions.z !== "number"
      ) {
        const modelType = getModelType(m.path);
        dimensions = getModelDimensions(modelType, 1);
      }
      // دریافت موقعیت و چرخش مدل
      const position = m.position || [0, 0, 0];
      const rotation = m.rotation || [0, 0, 0];
      
      // محاسبه bounding box با در نظر گرفتن چرخش
      if (
        dimensions &&
        typeof dimensions.x === "number" &&
        typeof dimensions.y === "number" &&
        typeof dimensions.z === "number"
      ) {
        // استفاده از تابع helper برای محاسبه bounding box rotated
        const rotatedBox = calculateRotatedBoundingBox(
          dimensions,
          rotation,
          position
        );
        
        // به‌روزرسانی bounding box کلی
        minX = Math.min(minX, rotatedBox.minX);
        maxX = Math.max(maxX, rotatedBox.maxX);
        minZ = Math.min(minZ, rotatedBox.minZ);
        maxZ = Math.max(maxZ, rotatedBox.maxZ);
        minY = Math.min(minY, rotatedBox.minY);
        maxY = Math.max(maxY, rotatedBox.maxY);
      }
    }
    // محاسبه ابعاد کلی از bounding box
    // عرض: بیشترین فاصله در محور X
    const totalWidth =
      isFinite(minX) && isFinite(maxX) ? Math.max(0, maxX - minX) : 0;
    // طول: بیشترین فاصله در محور Z
    const totalLength =
      isFinite(minZ) && isFinite(maxZ) ? Math.max(0, maxZ - minZ) : 0;
    // ارتفاع: بیشترین ارتفاع از سطح زمین
    const groundLevel = Math.min(0, minY); // اگر مدلی زیر زمین باشد، از minY استفاده می‌کنیم
    const totalHeight =
      isFinite(maxY) && isFinite(groundLevel)
        ? Math.max(0, maxY - groundLevel)
        : 0;
    return {
      count,
      totalHeight,
      totalLength,
      totalWidth,
    };
  }, [selectedModels]);
  const fmt = (v) => {
    if (!isFinite(v) || v === 0) return 0;
    return Math.round(v * 100) / 100;
  };
  return (
    <div className="absolute bottom-0 left-0 right-0 z-40">
      <div className="mx-4 mb-2 rounded-2xl bg-white/95 backdrop-blur shadow-lg shadow-gray-200/80 border border-gray-100 p-3">
        <div className="flex items-center justify-between gap-3 md:gap-4 flex-wrap">
          {/* Snap Grid Selector */}
          <div className="relative snap-grid-selector">
            <button
              onClick={() => setShowSnapGrid(!showSnapGrid)}
              className="bg-gray-200/90 p-2 h-9 rounded-xl transition-all duration-300 flex items-center gap-2 text-gray-700 hover:text-primaryThemeColor"
              title="تنظیمات Snap Grid"
            >
              <i className="fi fi-rr-grid size-4"></i>
              <div className="flex flex-col items-end">
                <span className="text-xs font-semibold">
                  {modelOptions.snapSize === "free"
                    ? "آزاد"
                    : `${toFarsiNumber(modelOptions.snapSize)} میلی متر`}
                </span>
                <span className="text-[10px] text-gray-500">
                  چرخش: {toFarsiNumber(modelOptions.rotationDeg)}°
                </span>
              </div>
              <i
                className={`fi fi-rr-angle-small-down size-3 transition-transform duration-200 ${
                  showSnapGrid ? "rotate-180" : ""
                }`}
              ></i>
            </button>
            {showSnapGrid && (
              <div className="absolute bottom-full right-0 mb-2 w-56 bg-white rounded-xl shadow-lg shadow-gray-100 border border-gray-100 overflow-hidden max-h-[400px] flex flex-col">
                <div
                  className="p-3 space-y-4 overflow-y-auto"
                  style={{
                    maxHeight: "400px",
                    scrollbarWidth: "thin",
                    scrollbarColor: "#cbd5e1 #f1f5f9",
                  }}
                >
                  <div>
                    <div className="text-sm text-gray-700 mb-3 text-center">
                      اندازه جا به جایی
                    </div>
                    <div className="space-y-2">
                      {gridSnapSize.map((size) => (
                        <button
                          key={size}
                          onClick={() => {
                            changeSnapSizeHandler(size);
                          }}
                          className={`w-full text-right px-3 py-1.5 rounded-lg text-xs transition-all duration-200 hover:bg-gray-50 ${
                            modelOptions.snapSize === size
                              ? "bg-primaryThemeColor/10 text-primaryThemeColor"
                              : "text-gray-600 hover:text-gray-800"
                          }`}
                        >
                          {`${toFarsiNumber(size)} سانتی متر`}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="text-sm text-gray-700 mb-3 text-center">
                      درجه چرخش
                    </div>
                    <div className="space-y-2">
                      {rotationOptions.map((angle) => (
                        <button
                          key={angle}
                          onClick={() => {
                            changeRotationDegHandler(angle);
                          }}
                          className={`w-full text-right px-3 py-1.5 rounded-lg text-xs transition-all duration-200 hover:bg-gray-50 ${
                            modelOptions.rotationDeg === angle
                              ? "bg-primaryThemeColor/10 text-primaryThemeColor"
                              : "text-gray-600 hover:text-gray-800"
                          }`}
                        >
                          {toFarsiNumber(angle)}°
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Stats */}
          <div
            dir="rtl"
            className="flex items-center gap-3 md:gap-6 text-sm text-gray-700 flex-wrap"
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold">ارتفاع:</span>
              <p>
                {toFarsiNumber(fmt(totalHeight))}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">طول:</span>
              <p>
                {toFarsiNumber(fmt(totalWidth))}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">عرض:</span>
              <p>
                {toFarsiNumber(fmt(totalLength))}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">تعداد:</span>
              <p>
                {toFarsiNumber(count)}
              </p>
            </div>
          </div>
          {/* Control Buttons */}
          <ControlButtons disabled={!hasSelectedModel} />
        </div>
      </div>
    </div>
  );
};