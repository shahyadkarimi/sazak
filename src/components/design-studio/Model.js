import { useEffect, useRef, useState, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import useModelStore from "@/store/useModelStore";
import { useModelScene } from "@/hooks/useModelScene";
import {
  useModelAdjustment,
  normalizeAngle,
  snapToGrid as snapRotation,
  ensureRotationArray,
  applySnappedAxisRotation,
} from "@/hooks/useModelAdjustment";
import ModelControls from "./ModelControls";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  clampPositionToGrid,
  volumesOverlap,
  boxesOverlap,
} from "@/helper/gridConstraints";
import {
  setModelBounds,
  removeModelBounds,
  getModelBounds,
} from "@/store/modelBoundsRegistry";

const Model = ({ path, position, id, rotation, color, noColor = false }) => {
  const modelRef = useRef();
  const { raycaster, camera, gl, scene } = useThree();

  const { scene: adjustedScene, isValid } = useModelScene(path || null);

  const selectedModelId = useModelStore((s) => s.selectedModelId);
  const setSelectedModelId = useModelStore((s) => s.setSelectedModelId);
  const groupMode = useModelStore((s) => s.groupMode);
  const updateModelPosition = useModelStore((s) => s.updateModelPosition);
  const updateModelRotation = useModelStore((s) => s.updateModelRotation);
  const setIsAdjustingHeight = useModelStore((s) => s.setIsAdjustingHeight);
  const existingModels = useModelStore((s) => s.selectedModels);
  const setSelectedModels = useModelStore((s) => s.setSelectedModels);
  const modelOptions = useModelStore((s) => s.modelOptions);
  const allowOverlap = useModelStore((s) => s.allowOverlap);
  const setModelsRef = useModelStore((s) => s.setModelsRef);
  const pushHistory = useModelStore((s) => s.pushHistory);
  const updateModelDimensions = useModelStore((s) => s.updateModelDimensions);
  const setDraggedModelId = useModelStore((s) => s.setDraggedModelId);
  const activeControlMode = useModelStore((s) => s.activeControlMode);

  const zoomLevel = useModelStore((s) => s.zoomLevel);
  const effectiveSnap =
    Math.max(0.05, (modelOptions?.snapSize ?? 0.5) * (zoomLevel / 50));
  const constrainToGrid = useModelStore((s) => s.constrainToGrid);

  const modelDimensions = (() => {
    const model = existingModels.find(m => m.id === id);
    return model?.dimensions || null;
  })();

  const isSelected =
    selectedModelId === id ||
    selectedModelId === 'ALL' ||
    (Array.isArray(selectedModelId) && selectedModelId.includes(id));
  const [clonedSceneState, setClonedSceneState] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPosition, setDragStartPosition] = useState(null);
  const [dragStartRotation, setDragStartRotation] = useState(null);
  const [dragStartMouse, setDragStartMouse] = useState(null);
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [initialMousePos, setInitialMousePos] = useState(null);
  const positionRef = useRef(position);
  const rotationRef = useRef(rotation);
  const isAdjustingRef = useRef(false);
  const frameCountRef = useRef(0);
  const baseHeightRef = useRef(0);
  const dragSelectionRef = useRef(null);
  const dragStartRotationsRef = useRef(null);
  const previousRotationDuringDragRef = useRef(null);
  const selectionColliderRef = useRef(null);
  const getRotatedBounds = useCallback(() => {
    if (!clonedSceneState) return null;
    const tempGroup = new THREE.Group();
    const tempClone = clonedSceneState.clone(true);
    tempGroup.add(tempClone);
    tempGroup.rotation.set(rotation[0], rotation[1], rotation[2]);
    tempGroup.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(tempGroup);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const min = box.min.clone();
    const max = box.max.clone();
    return { size, center, min, max };
  }, [clonedSceneState, rotation]);

  const computeWorldBounds = useCallback(
    (candidatePosition, candidateDimensions = modelDimensions) => {
      if (!candidatePosition || !candidateDimensions) return null;
      if (candidateDimensions?.bounds) {
        const { bounds } = candidateDimensions;
        return {
          minX: candidatePosition[0] + bounds.minX,
          maxX: candidatePosition[0] + bounds.maxX,
          minY: candidatePosition[1] + bounds.minY,
          maxY: candidatePosition[1] + bounds.maxY,
          minZ: candidatePosition[2] + bounds.minZ,
          maxZ: candidatePosition[2] + bounds.maxZ,
        };
      }

      // Fallback for current model before bounds are ready
      if (candidateDimensions === modelDimensions) {
        const bounds = getRotatedBounds();
        if (bounds) {
          return {
            minX: candidatePosition[0] + bounds.min.x,
            maxX: candidatePosition[0] + bounds.max.x,
            minY: candidatePosition[1] + bounds.min.y,
            maxY: candidatePosition[1] + bounds.max.y,
            minZ: candidatePosition[2] + bounds.min.z,
            maxZ: candidatePosition[2] + bounds.max.z,
          };
        }
      }

      return null;
    },
    [getRotatedBounds, modelDimensions]
  );

  const hasOverlapWithOthers = useCallback(
    (
      candidatePosition,
      candidateDimensions = modelDimensions,
      ignoreIds = new Set()
    ) => {
      if (!candidatePosition) return false;
      if (allowOverlap) return false;

      const currentBounds =
        getModelBounds(id) || computeWorldBounds(position, modelDimensions);

      if (currentBounds) {
        const alreadyOverlapping = existingModels.some((other) => {
          if (!other || other.id === id || ignoreIds.has(other.id)) return false;
          const otherBounds =
            getModelBounds(other.id) ||
            computeWorldBounds(other.position, other.dimensions);
          if (!otherBounds) return false;
          return boxesOverlap(currentBounds, otherBounds);
        });
        if (alreadyOverlapping) {
          return false;
        }
      }

      const candidateBounds = computeWorldBounds(
        candidatePosition,
        candidateDimensions
      );
      if (!candidateBounds) return false;

      return existingModels.some((other) => {
        if (!other || other.id === id || ignoreIds.has(other.id)) {
          return false;
        }

        const otherBounds =
          getModelBounds(other.id) ||
          computeWorldBounds(other.position, other.dimensions);

        if (!otherBounds) return false;

        return boxesOverlap(candidateBounds, otherBounds);
      });
    },
    [
      allowOverlap,
      computeWorldBounds,
      existingModels,
      id,
      modelDimensions,
      position,
    ]
  );

  const modelControls = useModelAdjustment(
    id,
    position,
    rotation,
    updateModelPosition,
    updateModelRotation,
    existingModels,
    {
      positionSnapStep: effectiveSnap,
      heightSnapStep: effectiveSnap,
      rotationSnapDegrees: modelOptions.rotationDeg,
      mouseSensitivityY:
        modelOptions.snapSize === 0.1 || modelOptions.snapSize === 0.5 ? 3 : 3,
      allowOverlap,
      checkOverlap: hasOverlapWithOthers,
    }
  );

  useEffect(() => {
    if (adjustedScene) {
      const clone = adjustedScene.clone(true);
      
      // Apply scale
      clone.scale.set(100, 100, 100);
      
      // Apply centering logic like ModelPlacer
      const box = new THREE.Box3().setFromObject(clone);
      const center = new THREE.Vector3();
      box.getCenter(center);
      
      // Center the model horizontally and place bottom at y=0
      clone.position.x = -center.x;
      clone.position.z = -center.z;
      clone.position.y = -box.min.y;
      
      clone.traverse((child) => {
        if (child.isMesh && child.material && child.geometry) {
          child.material = child.material.clone();
          if (!child.userData) child.userData = {};
          if (child.material.color && !child.userData.__originalColor) {
            child.userData.__originalColor = child.material.color.clone();
          }
          if (
            child.material.emissive &&
            !child.userData.__originalEmissive
          ) {
            child.userData.__originalEmissive =
              child.material.emissive.clone();
          }
          if (
            child.material.emissiveIntensity !== undefined &&
            child.userData.__originalEmissiveIntensity === undefined
          ) {
            child.userData.__originalEmissiveIntensity =
              child.material.emissiveIntensity;
          }
          // Attach wireframe border helper for transparent mode
          try {
            const edges = new THREE.EdgesGeometry(child.geometry, 1);
            const line = new THREE.LineSegments(
              edges,
              new THREE.LineBasicMaterial({ color: 0x000000 })
            );
            line.name = 'edge-lines';
            line.renderOrder = 999;
            child.add(line);
          } catch (e) {
            // ignore edge generation errors for non-standard geometries
          }
        }
      });
      setClonedSceneState(clone);
      
      // Store the dimensions (size + relative bounds)
      const dimensions = {
        x: box.max.x - box.min.x,
        y: box.max.y - box.min.y,
        z: box.max.z - box.min.z,
        bounds: {
          minX: box.min.x,
          maxX: box.max.x,
          minY: box.min.y,
          maxY: box.max.y,
          minZ: box.min.z,
          maxZ: box.max.z,
        },
      };
      updateModelDimensions(id, dimensions);
    }
  }, [adjustedScene, id, updateModelDimensions]);

  useEffect(() => {
    const bounds = computeWorldBounds(position, modelDimensions);
    if (bounds) {
      setModelBounds(id, bounds);
    }
  }, [computeWorldBounds, id, position, modelDimensions]);

  useEffect(() => {
    return () => removeModelBounds(id);
  }, [id]);

  useEffect(() => {
    if (!constrainToGrid || !modelDimensions) return;
    const clampedPosition = clampPositionToGrid(position, modelDimensions, rotation);

    if (
      clampedPosition[0] !== position[0] ||
      clampedPosition[1] !== position[1] ||
      clampedPosition[2] !== position[2]
    ) {
      updateModelPosition(id, clampedPosition);
    }
  }, [constrainToGrid, modelDimensions, position, rotation, id, updateModelPosition]);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    if (clonedSceneState && position[1] >= 0 && !isAdjustingRef.current) {
      const tempGroup = new THREE.Group();
      const tempClone = clonedSceneState.clone(true);
      tempGroup.add(tempClone);
      tempGroup.position.set(position[0], position[1], position[2]);
      tempGroup.rotation.set(rotation[0], rotation[1], rotation[2]);
      tempGroup.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(tempGroup);
      const currentMinY = box.min.y;
      
      if (currentMinY >= -0.001) {
        baseHeightRef.current = position[1];
      }
    }
  }, [position, rotation, clonedSceneState]);

  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

  // Update stored dimensions when rotation changes to keep clamps/collisions accurate
  useEffect(() => {
    const bounds = getRotatedBounds();
    if (!bounds) return;
    const { size, min, max } = bounds;
    const current = modelDimensions;
    const epsilon = 0.01;
    const hasChanged =
      !current ||
      Math.abs(current.x - size.x) > epsilon ||
      Math.abs(current.y - size.y) > epsilon ||
      Math.abs(current.z - size.z) > epsilon;
    if (hasChanged) {
      updateModelDimensions(id, {
        x: size.x,
        y: size.y,
        z: size.z,
        bounds: {
          minX: min.x,
          maxX: max.x,
          minY: min.y,
          maxY: max.y,
          minZ: min.z,
          maxZ: max.z,
        },
      });
    }
  }, [getRotatedBounds, modelDimensions, id, updateModelDimensions]);

  const lastRotationRef = useRef(rotation);
  useEffect(() => {
    if (!clonedSceneState || isAdjustingRef.current || isDragging) {
      lastRotationRef.current = rotation;
      return;
    }
    if (isDragging && activeControlMode === 'height') {
      lastRotationRef.current = rotation;
      return;
    }
    
    const rotationChanged = 
      Math.abs(lastRotationRef.current[0] - rotation[0]) > 0.001 ||
      Math.abs(lastRotationRef.current[1] - rotation[1]) > 0.001 ||
      Math.abs(lastRotationRef.current[2] - rotation[2]) > 0.001;
    
    if (!rotationChanged) return;
    
    const xRotationChanged = Math.abs(lastRotationRef.current[0] - rotation[0]) > 0.001;
    const zRotationChanged = Math.abs(lastRotationRef.current[2] - rotation[2]) > 0.001;
    if (!xRotationChanged && !zRotationChanged) {
      lastRotationRef.current = rotation;
      return;
    }
    
    const oldRotation = lastRotationRef.current;
    lastRotationRef.current = rotation;
    
    const tempGroupOld = new THREE.Group();
    const tempCloneOld = clonedSceneState.clone(true);
    tempGroupOld.add(tempCloneOld);
    tempGroupOld.position.set(position[0], position[1], position[2]);
    tempGroupOld.rotation.set(oldRotation[0], oldRotation[1], oldRotation[2]);
    tempGroupOld.updateMatrixWorld(true);
    const boxOld = new THREE.Box3().setFromObject(tempGroupOld);
    const minYOld = boxOld.min.y;
    
    const tempGroup = new THREE.Group();
    const tempClone = clonedSceneState.clone(true);
    tempGroup.add(tempClone);
    tempGroup.position.set(position[0], position[1], position[2]);
    tempGroup.rotation.set(rotation[0], rotation[1], rotation[2]);
    tempGroup.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(tempGroup);
    const minY = box.min.y;
    
    const wasOnGround = Math.abs(minYOld) < 0.01;
    const hasHeightAfterRotation = minY > 0.01;
    
    if (wasOnGround && hasHeightAfterRotation) {
      const offset = minY;
      const newY = Math.max(0, position[1] - offset);
      updateModelPosition(id, [position[0], newY, position[2]]);
    }
  }, [rotation, clonedSceneState, position, id, updateModelPosition, isDragging, activeControlMode]);

  const adjustHeightAfterRotation = useCallback((newRotation, modelPosition = position, oldRotation = rotation, axisKey = null) => {
    if (!clonedSceneState || isAdjustingRef.current) return;
    if (isDragging && activeControlMode === 'height') return;
    
    const shouldAdjust =
      axisKey === 'z' ||
      axisKey === 'x' ||
      activeControlMode === 'rotateZ' ||
      activeControlMode === 'rotateX';
    if (!shouldAdjust) return;
    
    const tempGroupOld = new THREE.Group();
    const tempCloneOld = clonedSceneState.clone(true);
    tempGroupOld.add(tempCloneOld);
    tempGroupOld.position.set(modelPosition[0], modelPosition[1], modelPosition[2]);
    tempGroupOld.rotation.set(oldRotation[0], oldRotation[1], oldRotation[2]);
    tempGroupOld.updateMatrixWorld(true);
    const boxOld = new THREE.Box3().setFromObject(tempGroupOld);
    const minYOld = boxOld.min.y;
    
    const tempGroup = new THREE.Group();
    const tempClone = clonedSceneState.clone(true);
    tempGroup.add(tempClone);
    tempGroup.position.set(modelPosition[0], modelPosition[1], modelPosition[2]);
    tempGroup.rotation.set(newRotation[0], newRotation[1], newRotation[2]);
    tempGroup.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(tempGroup);
    const minY = box.min.y;
    
    const wasOnGround = Math.abs(minYOld) < 0.01;
    const hasHeightAfterRotation = minY > 0.01;
    
    if (wasOnGround && hasHeightAfterRotation) {
      const offset = minY;
      const newY = Math.max(0, modelPosition[1] - offset);
      updateModelPosition(id, [modelPosition[0], newY, modelPosition[2]]);
    }
  }, [clonedSceneState, position, rotation, id, updateModelPosition, isDragging, activeControlMode]);

  const adjustPositionAfterRotation = useCallback((newRotation, modelPosition = position) => {
    if (!constrainToGrid || !modelDimensions || isAdjustingRef.current) return;
    if (isDragging && activeControlMode === 'height') return;
    
    const clampedPosition = clampPositionToGrid(modelPosition, modelDimensions, newRotation);
    
    if (
      clampedPosition[0] !== modelPosition[0] ||
      clampedPosition[1] !== modelPosition[1] ||
      clampedPosition[2] !== modelPosition[2]
    ) {
      updateModelPosition(id, clampedPosition);
    }
  }, [constrainToGrid, modelDimensions, position, id, updateModelPosition, isDragging, activeControlMode]);

  const lastRotationFromStoreRef = useRef(rotation);
  useEffect(() => {
    if (!clonedSceneState || isAdjustingRef.current) {
      lastRotationFromStoreRef.current = rotation;
      return;
    }
    if (isDragging && activeControlMode === 'height') {
      lastRotationFromStoreRef.current = rotation;
      return;
    }
    
    const currentRotation = rotation || [0, 0, 0];
    const rotationChanged = 
      Math.abs(lastRotationFromStoreRef.current[0] - currentRotation[0]) > 0.001 ||
      Math.abs(lastRotationFromStoreRef.current[1] - currentRotation[1]) > 0.001 ||
      Math.abs(lastRotationFromStoreRef.current[2] - currentRotation[2]) > 0.001;
    
    if (!rotationChanged) return;
    
    const oldRotation = lastRotationFromStoreRef.current;
    lastRotationFromStoreRef.current = currentRotation;
    
    const xRotationChanged = Math.abs(oldRotation[0] - currentRotation[0]) > 0.001;
    const zRotationChanged = Math.abs(oldRotation[2] - currentRotation[2]) > 0.001;
    if (xRotationChanged || zRotationChanged) {
      const tempGroupOld = new THREE.Group();
      const tempCloneOld = clonedSceneState.clone(true);
      tempGroupOld.add(tempCloneOld);
      tempGroupOld.position.set(position[0], position[1], position[2]);
      tempGroupOld.rotation.set(oldRotation[0], oldRotation[1], oldRotation[2]);
      tempGroupOld.updateMatrixWorld(true);
      const boxOld = new THREE.Box3().setFromObject(tempGroupOld);
      const minYOld = boxOld.min.y;
      
      const tempGroup = new THREE.Group();
      const tempClone = clonedSceneState.clone(true);
      tempGroup.add(tempClone);
      tempGroup.position.set(position[0], position[1], position[2]);
      tempGroup.rotation.set(currentRotation[0], currentRotation[1], currentRotation[2]);
      tempGroup.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(tempGroup);
      const minY = box.min.y;
      
      const wasOnGround = Math.abs(minYOld) < 0.01;
      const hasHeightAfterRotation = minY > 0.01;
      
      if (wasOnGround && hasHeightAfterRotation) {
        const offset = minY;
        const newY = Math.max(0, position[1] - offset);
        updateModelPosition(id, [position[0], newY, position[2]]);
      }
    }
    
    if (constrainToGrid && modelDimensions) {
      setTimeout(() => {
        const currentModel = existingModels.find(m => m.id === id);
        if (!currentModel) return;
        
        const currentPos = currentModel.position || position;
        const currentRot = currentModel.rotation || currentRotation;
        const clampedPosition = clampPositionToGrid(currentPos, modelDimensions, currentRot);
        
        if (
          clampedPosition[0] !== currentPos[0] ||
          clampedPosition[1] !== currentPos[1] ||
          clampedPosition[2] !== currentPos[2]
        ) {
          updateModelPosition(id, clampedPosition);
        }
      }, 0);
    }
  }, [rotation, clonedSceneState, position, id, updateModelPosition, isDragging, activeControlMode, constrainToGrid, modelDimensions, existingModels]);

  const checkAndAdjustPosition = useCallback(() => {
    if (!clonedSceneState || isAdjustingRef.current) return;
    
    if (activeControlMode === 'height') {
      const currentPosition = positionRef.current;
      const currentRotation = rotationRef.current;
      
      const tempGroup = new THREE.Group();
      const tempClone = clonedSceneState.clone(true);
      tempGroup.add(tempClone);
      tempGroup.position.set(currentPosition[0], currentPosition[1], currentPosition[2]);
      tempGroup.rotation.set(currentRotation[0], currentRotation[1], currentRotation[2]);
      tempGroup.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(tempGroup);
      const minY = box.min.y;
      
      if (minY < -0.001) {
        isAdjustingRef.current = true;
        const offset = -minY;
        const newY = currentPosition[1] + offset;
        baseHeightRef.current = newY;
        updateModelPosition(id, [currentPosition[0], newY, currentPosition[2]]);
        setTimeout(() => {
          isAdjustingRef.current = false;
        }, 50);
      } else {
        baseHeightRef.current = currentPosition[1];
      }
      return;
    }
    
    if (isDragging) {
      return;
    }

    const currentPosition = positionRef.current;
    const currentRotation = rotationRef.current;

    let targetY = currentPosition[1];
    
    if (currentPosition[1] < 0) {
      targetY = 0;
    }

    const tempGroup = new THREE.Group();
    const tempClone = clonedSceneState.clone(true);
    tempGroup.add(tempClone);
    tempGroup.position.set(currentPosition[0], targetY, currentPosition[2]);
    tempGroup.rotation.set(currentRotation[0], currentRotation[1], currentRotation[2]);
    
    tempGroup.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(tempGroup);
    const minY = box.min.y;
    
    if (minY < -0.001) {
      isAdjustingRef.current = true;
      const offset = -minY;
      targetY = targetY + offset;
      updateModelPosition(id, [currentPosition[0], targetY, currentPosition[2]]);
      setTimeout(() => {
        isAdjustingRef.current = false;
      }, 50);
    }
  }, [clonedSceneState, id, updateModelPosition, existingModels, modelDimensions, modelOptions.snapSize, isDragging, activeControlMode, position]);

  useEffect(() => {
    if (isDragging && activeControlMode === 'height') return;
    
    const timer = setTimeout(() => {
      checkAndAdjustPosition();
    }, 10);
    return () => clearTimeout(timer);
  }, [position, rotation, checkAndAdjustPosition, isDragging, activeControlMode]);

  useEffect(() => {
    if (!clonedSceneState) return;
    clonedSceneState.traverse((child) => {
      if (!child.userData) child.userData = {};
      child.userData.__modelId = id;
    });
  }, [clonedSceneState, id]);

  useEffect(() => {
    if (!selectionColliderRef.current) return;
    const bounds = getRotatedBounds();
    if (!bounds) return;

    const { size, center } = bounds;

    // Adaptive epsilon based on zoom level
    const zoomFactor = zoomLevel < 50 ? (50 / zoomLevel) : 1;
    const baseEps = 0.01;
    const fixedEps = baseEps * (1 + zoomFactor * 2.5);
    const percentEps = Math.max(size.x, size.y, size.z) * 0.05;
    const eps = Math.max(fixedEps, percentEps);

    const geom = new THREE.BoxGeometry(
      Math.max(0.001, size.x + eps),
      Math.max(0.001, size.y + eps),
      Math.max(0.001, size.z + eps)
    );

    const collider = selectionColliderRef.current;
    if (collider.geometry) collider.geometry.dispose();
    collider.geometry = geom;
    collider.position.set(center.x, center.y, center.z);
    if (!collider.userData) collider.userData = {};
    collider.userData.__modelId = id;
    collider.layers.enable(31);
    collider.updateMatrixWorld(true);
  }, [getRotatedBounds, id, zoomLevel]);

  useFrame(() => {
    if (isDragging && activeControlMode === 'height') {
      if (position[1] > 0) {
        baseHeightRef.current = position[1];
      }
      return;
    }
    frameCountRef.current++;
    if (frameCountRef.current % 10 === 0) {
      checkAndAdjustPosition();
    }
  });

  // تغییر رنگ و حالت ترنسپرنت (فقط بردر)
  const restoreOriginalMaterialState = useCallback((child) => {
    if (!child.userData) return;
    const originalColor = child.userData.__originalColor;
    const originalEmissive = child.userData.__originalEmissive;
    const originalEmissiveIntensity =
      child.userData.__originalEmissiveIntensity;

    if (originalColor && child.material?.color) {
      child.material.color.copy(originalColor);
    }
    if (originalEmissive && child.material?.emissive) {
      child.material.emissive.copy(originalEmissive);
    }
    if (
      originalEmissiveIntensity !== undefined &&
      child.material?.emissiveIntensity !== undefined
    ) {
      child.material.emissiveIntensity = originalEmissiveIntensity;
    }
  }, []);

  useEffect(() => {
    if (!clonedSceneState) return;
    setModelsRef(modelRef);

    clonedSceneState.traverse((child) => {
      if (child.name === "selection-overlay") return;
      if (child.isMesh && child.material) {
        const edge = child.children?.find?.((c) => c.name === 'edge-lines');

        const shouldHighlightNative =
          !color && !noColor && (isSelected || isDragging);

        if (color) {
          const selectedColor = new THREE.Color(color);

          if (isSelected || isDragging) {
            const hsl = { h: 0, s: 0, l: 0 };
            selectedColor.getHSL(hsl);
            hsl.l = Math.min(1, hsl.l * 1.5);
            const brightenedColor = new THREE.Color();
            brightenedColor.setHSL(hsl.h, hsl.s, hsl.l);

            if (child.material.color) {
              child.material.color.copy(brightenedColor);
            }
            if (child.material.emissive !== undefined) {
              child.material.emissive.copy(brightenedColor);
              child.material.emissiveIntensity = 0.6;
            }
          } else {
            if (child.material.color) {
              child.material.color.copy(selectedColor);
            }
            if (child.material.emissive !== undefined) {
              child.material.emissive.copy(selectedColor);
              child.material.emissiveIntensity = 0.5;
            }
          }
        } else {
          restoreOriginalMaterialState(child);
        }

        if (child.material) {
          if (noColor && (isSelected || isDragging)) {
            if (child.material.emissive !== undefined) {
              child.material.emissive = new THREE.Color(0xffffff);
              child.material.emissiveIntensity = 0.3;
            }
          } else if (noColor) {
            if (child.material.emissive !== undefined) {
              child.material.emissive = new THREE.Color(0x000000);
              child.material.emissiveIntensity = 0;
            }
          } else if (!color) {
            restoreOriginalMaterialState(child);
          }
          child.material.transparent = false;
          child.material.opacity = 1;
          if ('colorWrite' in child.material) child.material.colorWrite = true;
          if ('depthWrite' in child.material) child.material.depthWrite = true;
        }
        if (shouldHighlightNative) {
          let overlay = child.children?.find?.(
            (c) => c.name === "selection-overlay"
          );
          if (!overlay) {
            const overlayMaterial = new THREE.MeshBasicMaterial({
              color: 0xffffff,
              transparent: true,
              opacity: 0.25,
              depthWrite: false,
              depthTest: true,
              side: THREE.DoubleSide,
            });
            overlayMaterial.polygonOffset = true;
            overlayMaterial.polygonOffsetFactor = -1;
            overlayMaterial.polygonOffsetUnits = -1;
            overlay = new THREE.Mesh(child.geometry, overlayMaterial);
            overlay.name = "selection-overlay";
            overlay.renderOrder = 1000;
            child.add(overlay);
          }
          overlay.visible = true;
        } else {
          const overlay = child.children?.find?.(
            (c) => c.name === "selection-overlay"
          );
          if (overlay) overlay.visible = false;
        }

        if (edge) {
          edge.visible = false;
        }
      }
    });
  }, [isSelected, isDragging, clonedSceneState, color, noColor, restoreOriginalMaterialState]);

  // اطلاع به استور درباره درحال تنظیم بودن مدل
  useEffect(() => {
    setIsAdjustingHeight(
      modelControls.isAdjustingHeight || modelControls.isMoving || isDragging
    );
  }, [modelControls.isAdjustingHeight, modelControls.isMoving, isDragging]);



  const handlePointerOver = (event) => {
    event.stopPropagation();
    setIsHovered(true);
  };

  const handlePointerOut = (event) => {
    event.stopPropagation();
    setIsHovered(false);
  };

  // Handle pointer down - selection only, drag starts on move
  const handlePointerDown = (event) => {
    event.stopPropagation();
    // جلوگیری از رفتار پیش‌فرض در صورت موجود بودن
    if (typeof event.preventDefault === 'function') {
      event.preventDefault();
    } else if (event.nativeEvent && typeof event.nativeEvent.preventDefault === 'function') {
      event.nativeEvent.preventDefault();
    }
    const btn = (event.button !== undefined) ? event.button : event.nativeEvent?.button;
    if (btn !== 0) return;

    if (gl && gl.domElement && scene && raycaster) {
      const rect = gl.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const prevMask = raycaster.layers.mask;
      raycaster.layers.set(31);
      const intersects = raycaster.intersectObjects(scene.children, true);
      raycaster.layers.mask = prevMask;
      if (intersects && intersects.length > 0) {
        let firstHitModelId = null;
        for (const hit of intersects) {
          let p = hit.object;
          while (p) {
            if (p.userData && p.userData.__modelId != null) {
              firstHitModelId = p.userData.__modelId;
              break;
            }
            p = p.parent;
          }
          if (firstHitModelId != null) break;
        }
        if (firstHitModelId != null && firstHitModelId !== id) {
          return;
        }
      }
    }

    const isCtrl = event.ctrlKey || event.metaKey;
    
    let currentSelection = [];
    if (selectedModelId === 'ALL') {
      currentSelection = existingModels.map((m) => m.id);
    } else if (Array.isArray(selectedModelId)) {
      currentSelection = [...selectedModelId];
    } else if (selectedModelId) {
      currentSelection = [selectedModelId];
    }

    const isAlreadySelected = currentSelection.includes(id);

    if (groupMode && currentSelection.length > 0) {
      if (isCtrl) {
        if (isAlreadySelected) {
          const nextSelection = currentSelection.filter((sid) => sid !== id);
          if (nextSelection.length === 0) {
            setSelectedModelId(id);
            useModelStore.getState().setGroupMode(false);
          } else {
            setSelectedModelId(nextSelection.length === 1 ? nextSelection[0] : nextSelection);
          }
        } else {
          const nextSelection = [...currentSelection, id];
          setSelectedModelId(nextSelection.length === 1 ? nextSelection[0] : nextSelection);
        }
      } else {
        if (isAlreadySelected) {
          if (currentSelection.length === existingModels.length) {
            setSelectedModelId('ALL');
          } else {
            setSelectedModelId(currentSelection);
          }
        } else {
          const nextSelection = [...currentSelection, id];
          setSelectedModelId(nextSelection.length === 1 ? nextSelection[0] : nextSelection);
        }
      }
      setIsPointerDown(true);
      setInitialMousePos({
        clientX: event.clientX,
        clientY: event.clientY
      });
    } else {
      let nextSelection;
      if (isCtrl) {
        if (isAlreadySelected) {
          nextSelection = currentSelection.filter((sid) => sid !== id);
        } else {
          nextSelection = [...currentSelection, id];
        }
        if (nextSelection.length === 0) nextSelection = [id];
        setSelectedModelId(nextSelection.length === 1 ? nextSelection[0] : nextSelection);
      } else {
        if (isAlreadySelected && currentSelection.length > 1) {
          if (currentSelection.length === existingModels.length) {
            setSelectedModelId('ALL');
          } else {
            setSelectedModelId(currentSelection);
          }
        } else {
          nextSelection = id;
          setSelectedModelId(nextSelection);
        }
      }

      setIsPointerDown(true);
      setInitialMousePos({
        clientX: event.clientX,
        clientY: event.clientY
      });
    }
  };

  // Handle pointer move - start drag if mouse moved enough
  const handlePointerMove = (event) => {
    if (!isPointerDown || !initialMousePos) return;
    
    // بررسی اینکه آیا ماوس به اندازه کافی حرکت کرده یا نه
    const moveThreshold = 5; // پیکسل
    const deltaX = Math.abs(event.clientX - initialMousePos.clientX);
    const deltaY = Math.abs(event.clientY - initialMousePos.clientY);
    
      if (deltaX > moveThreshold || deltaY > moveThreshold) {
        // شروع درگ
        if (!isDragging) {
          pushHistory();
          setIsDragging(true);
          setDraggedModelId(id);
          setDragStartPosition([...position]);
          setDragStartRotation([...rotation]);

          // Store initial mouse position for drag calculation
          const mouse = new THREE.Vector2();
          mouse.x = (initialMousePos.clientX / gl.domElement.clientWidth) * 2 - 1;
          mouse.y = -(initialMousePos.clientY / gl.domElement.clientHeight) * 2 + 1;

          raycaster.setFromCamera(mouse, camera);
          const tempPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -position[1]);
          const initialIntersection = new THREE.Vector3();
          raycaster.ray.intersectPlane(tempPlane, initialIntersection);

          setDragStartMouse({
            x: initialIntersection.x,
            y: initialIntersection.z,
            clientX: initialMousePos.clientX,
            clientY: initialMousePos.clientY
          });
        }
      }
  };

  // Handle pointer up
  const handlePointerUp = (event) => {
    // همیشه propagation را متوقف کن تا onClick در Canvas اجرا نشود
    event.stopPropagation();
    
    if (isDragging) {
      if (activeControlMode === 'height' && position[1] > 0) {
        baseHeightRef.current = position[1];
      }
      setIsDragging(false);
      setDraggedModelId(null);
      setDragStartPosition(null);
      setDragStartRotation(null);
      setDragStartMouse(null);
    } else {
      // اگر درگ انجام نشده (یعنی فقط کلیک ساده بوده)، 
      // انتخاب را نگه دار و propagation را متوقف کن
      // تا onClick در Canvas انتخاب را clear نکند
    }
    setIsPointerDown(false);
    setInitialMousePos(null);
  };

  // Global mouse up handler for drag end
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        if (activeControlMode === 'height' && position[1] > 0) {
          baseHeightRef.current = position[1];
        }
        setIsDragging(false);
        setDraggedModelId(null);
        setDragStartPosition(null);
        setDragStartRotation(null);
        setDragStartMouse(null);
        dragSelectionRef.current = null; // Reset drag selection
        dragStartRotationsRef.current = null; // Reset start rotations
        previousRotationDuringDragRef.current = null; // Reset previous rotation during drag
      }
      setIsPointerDown(false);
      setInitialMousePos(null);
    };

    if (isDragging || isPointerDown) {
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, isPointerDown]);

  // Global mouse move handler to detect drag start
  useEffect(() => {
    if (!isPointerDown || !initialMousePos || isDragging) return;

    const handleGlobalMouseMoveForDragStart = (event) => {
      const moveThreshold = 5; // پیکسل
      const deltaX = Math.abs(event.clientX - initialMousePos.clientX);
      const deltaY = Math.abs(event.clientY - initialMousePos.clientY);
      
      if (deltaX > moveThreshold || deltaY > moveThreshold) {
        // شروع درگ
        pushHistory();
        setIsDragging(true);
        setDraggedModelId(id);
        setDragStartPosition([...position]);
        setDragStartRotation([...rotation]);
        previousRotationDuringDragRef.current = [...rotation];

        // Store current selection at drag start to ensure consistency during drag
        const currentSel = useModelStore.getState().selectedModelId;
        dragSelectionRef.current = currentSel;
        
        // Store start rotations for all selected models when rotating
        const currentActiveControlMode = useModelStore.getState().activeControlMode;
        if (currentActiveControlMode && (currentActiveControlMode === 'rotateY' || currentActiveControlMode === 'rotateX' || currentActiveControlMode === 'rotateZ')) {
          const models = useModelStore.getState().selectedModels;
          const rotationsMap = {};
          
          if (currentSel === 'ALL') {
            models.forEach(model => {
              rotationsMap[model.id] = [...(model.rotation || [0, 0, 0])];
            });
          } else if (Array.isArray(currentSel)) {
            currentSel.forEach(modelId => {
              const model = models.find(m => m.id === modelId);
              if (model) {
                rotationsMap[modelId] = [...(model.rotation || [0, 0, 0])];
              }
            });
          } else if (currentSel === id) {
            rotationsMap[id] = [...rotation];
          }
          
          dragStartRotationsRef.current = rotationsMap;
        }

        // Store initial mouse position for drag calculation
        const mouse = new THREE.Vector2();
        mouse.x = (initialMousePos.clientX / gl.domElement.clientWidth) * 2 - 1;
        mouse.y = -(initialMousePos.clientY / gl.domElement.clientHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const tempPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -position[1]);
        const initialIntersection = new THREE.Vector3();
        raycaster.ray.intersectPlane(tempPlane, initialIntersection);

        setDragStartMouse({
          x: initialIntersection.x,
          y: initialIntersection.z,
          clientX: initialMousePos.clientX,
          clientY: initialMousePos.clientY
        });
      }
    };

    window.addEventListener('mousemove', handleGlobalMouseMoveForDragStart);
    return () => window.removeEventListener('mousemove', handleGlobalMouseMoveForDragStart);
  }, [isPointerDown, initialMousePos, isDragging, id, position, pushHistory, raycaster, camera, gl]);

  // Global mouse move to keep dragging even when cursor leaves the model
  useEffect(() => {
    if (!isDragging || !dragStartPosition || !dragStartMouse) return;

    const handleGlobalMouseMove = (event) => {
      // Use stored selection from drag start to ensure consistency
      const dragSelection = dragSelectionRef.current !== null ? dragSelectionRef.current : selectedModelId;
      
      if (activeControlMode === 'height') {
        const deltaY = dragStartMouse.clientY - event.clientY;
        const sensitivity = 0.02;
        const heightChange = deltaY * sensitivity;
        const snapSize = modelOptions.snapSize === 'free' ? 0.1 : modelOptions.snapSize;
        const newY = Math.max(0, dragStartPosition[1] + heightChange);
        const snappedY = snapSize > 0 ? Math.round(newY / snapSize) * snapSize : newY;
        
        let finalY = snappedY;
        
        const tempGroup = new THREE.Group();
        if (clonedSceneState) {
          const tempClone = clonedSceneState.clone(true);
          tempGroup.add(tempClone);
          tempGroup.position.set(position[0], finalY, position[2]);
          tempGroup.rotation.set(rotation[0], rotation[1], rotation[2]);
          tempGroup.updateMatrixWorld(true);
          const box = new THREE.Box3().setFromObject(tempGroup);
          const minY = box.min.y;
          
          if (minY < -0.001) {
            finalY = finalY - minY;
          }
        }
        
        baseHeightRef.current = finalY;
        const proposedPosition = [position[0], finalY, position[2]];
        
        // Use dragSelection for consistency
        const currentDragSelection = dragSelection || selectedModelId;
        
        if (currentDragSelection === 'ALL') {
          const deltaY = finalY - position[1];
          const updatedModels = existingModels.map(model => ({
            ...model,
            position: [model.position[0], Math.max(0, model.position[1] + deltaY), model.position[2]]
          }));
          setSelectedModels(updatedModels);
        } else if (Array.isArray(currentDragSelection) && currentDragSelection.includes(id)) {
          const deltaY = finalY - position[1];
          const updatedModels = existingModels.map(model => 
            currentDragSelection.includes(model.id)
              ? { ...model, position: [model.position[0], Math.max(0, model.position[1] + deltaY), model.position[2]] }
              : model
          );
          setSelectedModels(updatedModels);
        } else {
          updateModelPosition(id, proposedPosition);
        }
        return;
      }

      if (activeControlMode === 'rotateY') {
        const deltaX = event.clientX - dragStartMouse.clientX;
        // Use same sensitivity as single model rotation (200)
        const rotationDelta = (deltaX / 200) * (Math.PI / 2);
        const rotationSnapRadians = (modelOptions.rotationDeg * Math.PI) / 180;
        
        // Use dragSelection for consistency
        const currentDragSelection = dragSelection || selectedModelId;
        
        // Check if multiple models are selected and rotate them together
        if (currentDragSelection === 'ALL' || (Array.isArray(currentDragSelection) && currentDragSelection.includes(id))) {
          const startRotations = dragStartRotationsRef.current || {};
          const updatedModels = existingModels.map(model => {
            const isSelected = currentDragSelection === 'ALL' || 
                              (Array.isArray(currentDragSelection) && currentDragSelection.includes(model.id));
            
            if (isSelected) {
              const modelStartRotation = startRotations[model.id];
              if (!modelStartRotation) {
                return model;
              }
              const newRotation = applySnappedAxisRotation({
                baseRotation: modelStartRotation,
                axisKey: 'y',
                deltaAngle: rotationDelta,
                snapRadians: rotationSnapRadians,
                rotationSnapDegrees: modelOptions.rotationDeg,
                space: 'world',
              });
              if (newRotation) {
                return {
                  ...model,
                  rotation: newRotation,
                };
              }
            }
            return model;
          });
          setSelectedModels(updatedModels);
          
          const currentModel = updatedModels.find(m => m.id === id);
          if (currentModel && currentModel.rotation && clonedSceneState && !isAdjustingRef.current) {
            const oldRotation = previousRotationDuringDragRef.current || rotation;
            adjustHeightAfterRotation(currentModel.rotation, currentModel.position || position, oldRotation, 'y');
            
            if (constrainToGrid && modelDimensions) {
              const currentPos = currentModel.position || position;
              const currentRot = currentModel.rotation;
              const clampedPosition = clampPositionToGrid(currentPos, modelDimensions, currentRot);
              
              if (
                clampedPosition[0] !== currentPos[0] ||
                clampedPosition[1] !== currentPos[1] ||
                clampedPosition[2] !== currentPos[2]
              ) {
                const updatedModelsWithPosition = updatedModels.map(m => 
                  m.id === id ? { ...m, position: clampedPosition } : m
                );
                setSelectedModels(updatedModelsWithPosition);
              }
            }
            
            previousRotationDuringDragRef.current = currentModel.rotation;
          }
        } else {
          const baseRotation = dragStartRotation || rotation;
          const newRotation = applySnappedAxisRotation({
            baseRotation,
            axisKey: 'y',
            deltaAngle: rotationDelta,
            snapRadians: rotationSnapRadians,
            rotationSnapDegrees: modelOptions.rotationDeg,
            space: 'world',
          });
          if (newRotation) {
            const oldRotation = previousRotationDuringDragRef.current || rotation;
            updateModelRotation(id, newRotation);
            if (clonedSceneState && !isAdjustingRef.current) {
              adjustHeightAfterRotation(newRotation, position, oldRotation, 'y');
              
              if (constrainToGrid && modelDimensions) {
                adjustPositionAfterRotation(newRotation, position);
              }
            }
            previousRotationDuringDragRef.current = newRotation;
          }
        }
        return;
      }

      if (activeControlMode === 'rotateX') {
        const deltaX = event.clientX - dragStartMouse.clientX;
        // Use same sensitivity as single model rotation (200)
        const rotationDelta = (deltaX / 200) * (Math.PI / 2);
        const rotationSnapRadians = (modelOptions.rotationDeg * Math.PI) / 180;
        
        // Use dragSelection for consistency
        const currentDragSelection = dragSelection || selectedModelId;
        
        // Check if multiple models are selected and rotate them together
        if (currentDragSelection === 'ALL' || (Array.isArray(currentDragSelection) && currentDragSelection.includes(id))) {
          const startRotations = dragStartRotationsRef.current || {};
          const updatedModels = existingModels.map(model => {
            const isSelected = currentDragSelection === 'ALL' || 
                              (Array.isArray(currentDragSelection) && currentDragSelection.includes(model.id));
            
            if (isSelected) {
              const modelStartRotation = startRotations[model.id];
              if (!modelStartRotation) {
                return model;
              }
              const newRotation = applySnappedAxisRotation({
                baseRotation: modelStartRotation,
                axisKey: 'x',
                deltaAngle: rotationDelta,
                snapRadians: rotationSnapRadians,
                rotationSnapDegrees: modelOptions.rotationDeg,
                space: 'local',
              });
              if (newRotation) {
                return {
                  ...model,
                  rotation: newRotation,
                };
              }
            }
            return model;
          });
          setSelectedModels(updatedModels);
          
          const currentModel = updatedModels.find(m => m.id === id);
          if (currentModel && currentModel.rotation && clonedSceneState && !isAdjustingRef.current) {
            const oldRotation = previousRotationDuringDragRef.current || rotation;
            adjustHeightAfterRotation(currentModel.rotation, currentModel.position || position, oldRotation, 'x');
            previousRotationDuringDragRef.current = currentModel.rotation;
          }
        } else {
          const baseRotation = dragStartRotation || rotation;
          const newRotation = applySnappedAxisRotation({
            baseRotation,
            axisKey: 'x',
            deltaAngle: rotationDelta,
            snapRadians: rotationSnapRadians,
            rotationSnapDegrees: modelOptions.rotationDeg,
            space: 'local',
          });
          if (newRotation) {
            const oldRotation = previousRotationDuringDragRef.current || rotation;
            updateModelRotation(id, newRotation);
            if (clonedSceneState && !isAdjustingRef.current) {
              adjustHeightAfterRotation(newRotation, position, oldRotation, 'x');
            }
            previousRotationDuringDragRef.current = newRotation;
          }
        }
        return;
      }

      if (activeControlMode === 'rotateZ') {
        const deltaY = dragStartMouse.clientY - event.clientY;
        // Use same sensitivity as single model rotation (200)
        const rotationDelta = (-deltaY / 200) * (Math.PI / 2);
        const rotationSnapRadians = (modelOptions.rotationDeg * Math.PI) / 180;
        
        // Use dragSelection for consistency
        const currentDragSelection = dragSelection || selectedModelId;
        
        // Check if multiple models are selected and rotate them together
        if (currentDragSelection === 'ALL' || (Array.isArray(currentDragSelection) && currentDragSelection.includes(id))) {
          const startRotations = dragStartRotationsRef.current || {};
          const updatedModels = existingModels.map(model => {
            const isSelected =
              currentDragSelection === 'ALL' ||
              (Array.isArray(currentDragSelection) && currentDragSelection.includes(model.id));

            if (isSelected) {
              const modelStartRotation = startRotations[model.id];
              if (!modelStartRotation) {
                return model;
              }
              const startZ = modelStartRotation[2] || 0;
              const totalRotation = startZ + rotationDelta;
              const snappedRotation = snapRotation(totalRotation, rotationSnapRadians);
              const normalizedRotation = normalizeAngle(snappedRotation);

              return {
                ...model,
                rotation: [
                  modelStartRotation[0],
                  modelStartRotation[1],
                  normalizedRotation,
                ],
              };
            }
            return model;
          });
          setSelectedModels(updatedModels);
          
          const currentModel = updatedModels.find(m => m.id === id);
          if (currentModel && currentModel.rotation && clonedSceneState && !isAdjustingRef.current) {
            const oldRotation = previousRotationDuringDragRef.current || rotation;
            adjustHeightAfterRotation(currentModel.rotation, currentModel.position || position, oldRotation, 'z');
            previousRotationDuringDragRef.current = currentModel.rotation;
          }
        } else {
          const baseRotation = dragStartRotation || rotation;
          const startZ = baseRotation[2] || 0;
          const totalRotation = startZ + rotationDelta;
          const snappedRotation = snapRotation(totalRotation, rotationSnapRadians);
          const normalizedRotation = normalizeAngle(snappedRotation);
          const newRotation = [baseRotation[0], baseRotation[1], normalizedRotation];

          const oldRotation = previousRotationDuringDragRef.current || rotation;
          updateModelRotation(id, newRotation);
          if (clonedSceneState && !isAdjustingRef.current) {
            adjustHeightAfterRotation(newRotation, position, oldRotation, 'z');
          }
          previousRotationDuringDragRef.current = newRotation;
        }
        return;
      }

      const mouse = new THREE.Vector2();
      mouse.x = (event.clientX / gl.domElement.clientWidth) * 2 - 1;
      mouse.y = -(event.clientY / gl.domElement.clientHeight) * 2 + 1;

      const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -position[1]);
      const currentIntersection = new THREE.Vector3();
      raycaster.setFromCamera(mouse, camera);
      raycaster.ray.intersectPlane(dragPlane, currentIntersection);

      if (currentIntersection) {
        const deltaX = currentIntersection.x - dragStartMouse.x;
        const deltaZ = currentIntersection.z - dragStartMouse.y;

        const newX = dragStartPosition[0] + deltaX;
        const newZ = dragStartPosition[2] + deltaZ;

        const snapSize = modelOptions.snapSize;
        const snappedX = snapSize > 0 ? Math.round(newX / snapSize) * snapSize : newX;
        const snappedZ = snapSize > 0 ? Math.round(newZ / snapSize) * snapSize : newZ;

        let proposedPosition = [snappedX, position[1], snappedZ];

        if (constrainToGrid) {
          proposedPosition = clampPositionToGrid(
            proposedPosition,
            modelDimensions,
            rotation
          );
        }

        let adjustedPosition = [...proposedPosition];
        
        if (!constrainToGrid) {
          adjustedPosition[1] = position[1];
        }

        if (clonedSceneState) {
          // برای drag موقعیت افقی، ارتفاع فعلی را حفظ می‌کنیم
          let targetY = position[1];
          if (activeControlMode !== 'height') {
            targetY = Math.max(0, targetY);
          }

          const tempGroup = new THREE.Group();
          const tempClone = clonedSceneState.clone(true);
          tempGroup.add(tempClone);
          tempGroup.position.set(adjustedPosition[0], targetY, adjustedPosition[2]);
          tempGroup.rotation.set(rotation[0], rotation[1], rotation[2]);
          tempGroup.updateMatrixWorld(true);
          const box = new THREE.Box3().setFromObject(tempGroup);
          const minY = box.min.y;
          
          // فقط اگر مدل زیر زمین باشد، آن را بالا ببریم
          if (minY < -0.001) {
            const offset = -minY;
            adjustedPosition[1] = targetY + offset;
            // اگر در حال تنظیم ارتفاع نیستیم، baseHeightRef را به‌روز کنیم
            if (activeControlMode !== 'height') {
              baseHeightRef.current = adjustedPosition[1];
            }
          } else {
            adjustedPosition[1] = targetY;
          }
        } else {
          adjustedPosition[1] =
            activeControlMode !== 'height' ? Math.max(0, position[1]) : position[1];
        }

        if (constrainToGrid) {
          adjustedPosition = clampPositionToGrid(
            adjustedPosition,
            modelDimensions,
            rotation
          );
        }

        // Use dragSelection for consistency
        const currentDragSelection = dragSelection || selectedModelId;

        // Check if multiple models are selected and move them together
        if (currentDragSelection === 'ALL') {
          // Move all models together (no stationary models to collide with)
          const deltaX = adjustedPosition[0] - position[0];
          const deltaZ = adjustedPosition[2] - position[2];
          const deltaY = adjustedPosition[1] - position[1];
          
          const updatedModels = existingModels.map(model => {
            const nextX = model.position[0] + deltaX;
            const nextZ = model.position[2] + deltaZ;
            const nextY = Math.max(0, model.position[1] + deltaY);
            let nextPosition = [nextX, nextY, nextZ];
            
            if (constrainToGrid) {
              nextPosition = clampPositionToGrid(
                nextPosition,
                model.dimensions,
                model.rotation
              );
            }
            return {
              ...model,
              position: nextPosition
            };
          });
          
          setSelectedModels(updatedModels);
        } else if (Array.isArray(currentDragSelection) && currentDragSelection.includes(id)) {
          // Move multiple selected models
          const deltaX = adjustedPosition[0] - position[0];
          const deltaZ = adjustedPosition[2] - position[2];
          const deltaY = adjustedPosition[1] - position[1];
          
          const updatedModels = existingModels.map(model => {
            if (currentDragSelection.includes(model.id)) {
              const nextX = model.position[0] + deltaX;
              const nextZ = model.position[2] + deltaZ;
              const nextY = Math.max(0, model.position[1] + deltaY);
              let nextPosition = [nextX, nextY, nextZ];
              
              if (constrainToGrid) {
                nextPosition = clampPositionToGrid(
                  nextPosition,
                  model.dimensions,
                  model.rotation
                );
              }
              return { ...model, position: nextPosition };
            }
            return model;
          });
          
          const movingIds = new Set(currentDragSelection);
          const hasCollision = updatedModels.some((model) => {
            if (!movingIds.has(model.id)) return false;
            if (!model.position) return false;
            return hasOverlapWithOthers(model.position, model.dimensions, movingIds);
          });
          if (!hasCollision) {
            setSelectedModels(updatedModels);
          }
        } else {
          if (constrainToGrid) {
            adjustedPosition = clampPositionToGrid(
              adjustedPosition,
              modelDimensions,
              rotation
            );
          }
          if (!hasOverlapWithOthers(adjustedPosition)) {
            updateModelPosition(id, adjustedPosition);
          }
        }
      }
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, [isDragging, dragStartPosition, dragStartRotation, dragStartMouse, position, rotation, id, updateModelPosition, updateModelRotation, raycaster, camera, gl, modelOptions, existingModels, selectedModelId, constrainToGrid, clonedSceneState, modelDimensions, activeControlMode, setSelectedModels]);


  // حذف مدل
  const deleteModelHandler = () => {
    pushHistory();
    useModelStore.setState((state) => ({
      selectedModels: state.selectedModels.filter((model) => model.id !== id),
    }));
  };

  // تکثیر مدل
  const duplicateModelHandler = () => {
    const newModel = {
      id: Date.now().toString(),
      path: path,
      position: [position[0] + 1, position[1], position[2] + 1], // Offset position
      rotation: [...rotation]
    };
    pushHistory();
    useModelStore.setState((state) => ({
      selectedModels: [...state.selectedModels, newModel],
    }));
  };

  const controlsWithDelete = {
    ...modelControls,
    deleteModel: deleteModelHandler,
  };

  if (!isValid || !clonedSceneState) return null;

  return (
    <group
      ref={modelRef}
      position={position}
      rotation={rotation}
    >
      <primitive
        object={clonedSceneState}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ cursor: isDragging ? 'grabbing' : (isHovered ? 'grab' : 'pointer') }}
      />

      <ModelControls
        position={position}
        isSelected={isSelected}
        controls={controlsWithDelete}
        isDragging={isDragging}
      />

    </group>
  );
};

export default Model;
