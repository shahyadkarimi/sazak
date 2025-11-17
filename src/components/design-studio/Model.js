import { useEffect, useRef, useState, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import useModelStore from "@/store/useModelStore";
import { useModelScene } from "@/hooks/useModelScene";
import { useModelAdjustment, normalizeAngle, snapToGrid as snapRotation } from "@/hooks/useModelAdjustment";
import ModelControls from "./ModelControls";
import ContextMenu from "./ContextMenu";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { clampPositionToGrid } from "@/helper/gridConstraints";

const Model = ({ path, position, id, rotation, color, noColor = false }) => {
  const modelRef = useRef();
  const { raycaster, camera, gl, scene } = useThree();

  const { scene: adjustedScene, isValid } = useModelScene(path || null);

  const selectedModelId = useModelStore((s) => s.selectedModelId);
  const setSelectedModelId = useModelStore((s) => s.setSelectedModelId);
  const updateModelPosition = useModelStore((s) => s.updateModelPosition);
  const updateModelRotation = useModelStore((s) => s.updateModelRotation);
  const setIsAdjustingHeight = useModelStore((s) => s.setIsAdjustingHeight);
  const existingModels = useModelStore((s) => s.selectedModels);
  const setSelectedModels = useModelStore((s) => s.setSelectedModels);
  const modelOptions = useModelStore((s) => s.modelOptions);
  const setModelsRef = useModelStore((s) => s.setModelsRef);
  const pushHistory = useModelStore((s) => s.pushHistory);
  const updateModelDimensions = useModelStore((s) => s.updateModelDimensions);
  const setDraggedModelId = useModelStore((s) => s.setDraggedModelId);
  const activeControlMode = useModelStore((s) => s.activeControlMode);

  const zoomLevel = useModelStore((s) => s.zoomLevel);
  const effectiveSnap =
    Math.max(0.05, (modelOptions?.snapSize ?? 0.5) * (zoomLevel / 50));

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
    }
  );
  const constrainToGrid = useModelStore((s) => s.constrainToGrid);

  // Get dimensions from store for collision
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
  const [showContextMenu, setShowContextMenu] = useState(false);
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
  const dragSelectionRef = useRef(null); // Store selection at drag start
  const dragStartRotationsRef = useRef(null); // Store start rotations for all selected models
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
    return { size, center };
  }, [clonedSceneState, rotation]);

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
      
      // Store the dimensions in the store (dimensions are in world space after scale)
      const dimensions = {
        x: box.max.x - box.min.x,
        y: box.max.y - box.min.y,
        z: box.max.z - box.min.z
      };
      updateModelDimensions(id, dimensions);
    }
  }, [adjustedScene, id, updateModelDimensions]);

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
    const { size } = bounds;
    const current = modelDimensions;
    const epsilon = 0.01;
    const hasChanged =
      !current ||
      Math.abs(current.x - size.x) > epsilon ||
      Math.abs(current.y - size.y) > epsilon ||
      Math.abs(current.z - size.z) > epsilon;
    if (hasChanged) {
      updateModelDimensions(id, { x: size.x, y: size.y, z: size.z });
    }
  }, [getRotatedBounds, modelDimensions, id, updateModelDimensions]);

  const checkAndAdjustPosition = useCallback(() => {
    if (!clonedSceneState || isAdjustingRef.current) return;
    
    // اگر در حال تنظیم ارتفاع هستیم، فقط بررسی کنیم که مدل زیر زمین نرود
    if (activeControlMode === 'height') {
      // فقط بررسی کنیم که مدل زیر زمین نرود، نه اینکه ارتفاع را تغییر دهیم
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
      
      // فقط اگر مدل زیر زمین باشد، آن را بالا ببریم
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
        // اگر مدل زیر زمین نیست، baseHeightRef را به‌روز کنیم
        baseHeightRef.current = currentPosition[1];
      }
      return;
    }
    
    // برای حالت‌های دیگر (نه تنظیم ارتفاع)
    if (isDragging) {
      return;
    }

    const currentPosition = positionRef.current;
    const currentRotation = rotationRef.current;

    let targetY = currentPosition[1];
    
    // اگر ارتفاع منفی است، آن را به 0 تنظیم کنیم
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
    
    // فقط اگر مدل زیر زمین باشد، آن را بالا ببریم
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
    // اگر در حال drag ارتفاع هستیم، اجازه دهیم که کاربر آزادانه ارتفاع را تغییر دهد
    if (isDragging && activeControlMode === 'height') return;
    
    // فقط برای بررسی اینکه مدل زیر زمین نرود (نه برای تغییر ارتفاع)
    const timer = setTimeout(() => {
      checkAndAdjustPosition();
    }, 10);
    return () => clearTimeout(timer);
  }, [position, rotation, checkAndAdjustPosition, isDragging, activeControlMode]);

  // Tag all meshes of this model for robust selection discrimination
  useEffect(() => {
    if (!clonedSceneState) return;
    clonedSceneState.traverse((child) => {
      if (!child.userData) child.userData = {};
      child.userData.__modelId = id;
    });
  }, [clonedSceneState, id]);

  // Build/update precise rotated AABB collider for selection
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
  useEffect(() => {
    if (!clonedSceneState) return;
    setModelsRef(modelRef);

    clonedSceneState.traverse((child) => {
      if (child.isMesh && child.material) {
        const edge = child.children?.find?.((c) => c.name === 'edge-lines');
        const isTransparent = color == null && !noColor;

        // Base appearance
        if (isTransparent) {
          // Transparent body, only border visible
          if (child.material) {
            child.material.transparent = true;
            child.material.opacity = 0;
            // Avoid writing color/depth to prevent dark artifacts
            if ('colorWrite' in child.material) child.material.colorWrite = false;
            if ('depthWrite' in child.material) child.material.depthWrite = false;
            if ('emissiveIntensity' in child.material) child.material.emissiveIntensity = 0;
          }
          if (edge) edge.visible = true;
        } else {
          // Opaque with selected color
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
            }
            child.material.transparent = false;
            child.material.opacity = 1;
            if ('colorWrite' in child.material) child.material.colorWrite = true;
            if ('depthWrite' in child.material) child.material.depthWrite = true;
          }
          if (edge) edge.visible = false;
        }
      }
    });
  }, [isSelected, isDragging, clonedSceneState, color, noColor]);

  // اطلاع به استور درباره درحال تنظیم بودن مدل
  useEffect(() => {
    setIsAdjustingHeight(
      modelControls.isAdjustingHeight || modelControls.isMoving || isDragging
    );
  }, [modelControls.isAdjustingHeight, modelControls.isMoving, isDragging]);


  // Handle right-click: open context menu only (selection is done with left click)
  const handleRightClick = (event) => {
    event.stopPropagation();
    if (typeof event.preventDefault === 'function') {
      event.preventDefault();
    } else if (event.nativeEvent && typeof event.nativeEvent.preventDefault === 'function') {
      event.nativeEvent.preventDefault();
    }
    
    // فقط منوی زمینه را نشان بده، انتخاب نکن
    setShowContextMenu(true);
  };

  // Handle mouse hover for visual feedback
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
    // فقط با کلیک چپ
    const btn = (event.button !== undefined) ? event.button : event.nativeEvent?.button;
    if (btn !== 0) return;

    // Only select if this model is the top-most intersected model using selection colliders (layer 31)
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

    // انتخاب مدل با کلیک چپ
    const isCtrl = event.ctrlKey || event.metaKey;
    
    // Normalize current selection to array for easier ops
    let currentSelection = [];
    if (selectedModelId === 'ALL') {
      currentSelection = existingModels.map((m) => m.id);
    } else if (Array.isArray(selectedModelId)) {
      currentSelection = [...selectedModelId];
    } else if (selectedModelId) {
      currentSelection = [selectedModelId];
    }

    // Check if this model is already selected
    const isAlreadySelected = currentSelection.includes(id);

    let nextSelection;
    if (isCtrl) {
      // Toggle this id
      if (isAlreadySelected) {
        nextSelection = currentSelection.filter((sid) => sid !== id);
      } else {
        nextSelection = [...currentSelection, id];
      }
      // If empties out, keep single selection to this id for usability
      if (nextSelection.length === 0) nextSelection = [id];
      setSelectedModelId(nextSelection.length === 1 ? nextSelection[0] : nextSelection);
    } else {
      // If clicking on an already selected model in multi-selection, keep selection
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
          // Use stored start rotations if available, otherwise fall back to current rotations
          const startRotations = dragStartRotationsRef.current || {};
          const updatedModels = existingModels.map(model => {
            const isSelected = currentDragSelection === 'ALL' || 
                              (Array.isArray(currentDragSelection) && currentDragSelection.includes(model.id));
            
            if (isSelected) {
              // Get start rotation for this model from stored rotations
              const modelStartRotation = startRotations[model.id];
              if (!modelStartRotation) {
                // Fallback: use current rotation if start rotation not stored
                return model;
              }
              const modelStartY = modelStartRotation[1];
              
              // Apply the same rotationDelta to this model's start rotation
              const modelTotalRotation = modelStartY + rotationDelta;
              const modelSnappedRotation = snapRotation(modelTotalRotation, rotationSnapRadians);
              const modelNewY = normalizeAngle(modelSnappedRotation);
              
              // Use start rotation for X and Z to keep them unchanged, only update Y
              return {
                ...model,
                rotation: [modelStartRotation[0], modelNewY, modelStartRotation[2]]
              };
            }
            return model;
          });
          setSelectedModels(updatedModels);
        } else {
          // Single model rotation
          const startRotationY = dragStartRotation ? dragStartRotation[1] : rotation[1];
          const totalRotation = startRotationY + rotationDelta;
          const snappedRotation = snapRotation(totalRotation, rotationSnapRadians);
          const normalizedRotation = normalizeAngle(snappedRotation);
          const newRotation = [rotation[0], normalizedRotation, rotation[2]];
          updateModelRotation(id, newRotation);
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
          // Use stored start rotations if available, otherwise fall back to current rotations
          const startRotations = dragStartRotationsRef.current || {};
          const updatedModels = existingModels.map(model => {
            const isSelected = currentDragSelection === 'ALL' || 
                              (Array.isArray(currentDragSelection) && currentDragSelection.includes(model.id));
            
            if (isSelected) {
              // Get start rotation for this model from stored rotations
              const modelStartRotation = startRotations[model.id];
              if (!modelStartRotation) {
                // Fallback: use current rotation if start rotation not stored
                return model;
              }
              const modelStartX = modelStartRotation[0];
              
              // Apply the same rotationDelta to this model's start rotation
              const modelTotalRotation = modelStartX + rotationDelta;
              let modelSnappedRotation = snapRotation(modelTotalRotation, rotationSnapRadians);
              modelSnappedRotation = normalizeAngle(modelSnappedRotation);
              
              // Apply 90-degree constraint if needed
              if (modelOptions.rotationDeg === 90) {
                if (modelSnappedRotation > Math.PI / 2 && modelSnappedRotation < (3 * Math.PI) / 2) {
                  modelSnappedRotation = modelSnappedRotation < Math.PI ? Math.PI / 2 : (3 * Math.PI) / 2;
                }
              }
              
              // Use start rotation for Y and Z to keep them unchanged, only update X
              return {
                ...model,
                rotation: [modelSnappedRotation, modelStartRotation[1], modelStartRotation[2]]
              };
            }
            return model;
          });
          setSelectedModels(updatedModels);
        } else {
          // Single model rotation
          const startRotationX = dragStartRotation ? dragStartRotation[0] : rotation[0];
          const totalRotation = startRotationX + rotationDelta;
          let snappedRotation = snapRotation(totalRotation, rotationSnapRadians);
          snappedRotation = normalizeAngle(snappedRotation);
          
          // Apply 90-degree constraint if needed
          if (modelOptions.rotationDeg === 90) {
            if (snappedRotation > Math.PI / 2 && snappedRotation < (3 * Math.PI) / 2) {
              snappedRotation = snappedRotation < Math.PI ? Math.PI / 2 : (3 * Math.PI) / 2;
            }
          }
          
          const newRotation = [snappedRotation, rotation[1], rotation[2]];
          updateModelRotation(id, newRotation);
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
          // Use stored start rotations if available, otherwise fall back to current rotations
          const startRotations = dragStartRotationsRef.current || {};
          const updatedModels = existingModels.map(model => {
            const isSelected = currentDragSelection === 'ALL' || 
                              (Array.isArray(currentDragSelection) && currentDragSelection.includes(model.id));
            
            if (isSelected) {
              // Get start rotation for this model from stored rotations
              const modelStartRotation = startRotations[model.id];
              if (!modelStartRotation) {
                // Fallback: use current rotation if start rotation not stored
                return model;
              }
              const modelStartZ = modelStartRotation[2];
              
              // Apply the same rotationDelta to this model's start rotation
              const modelTotalRotation = modelStartZ + rotationDelta;
              const modelSnappedRotation = snapRotation(modelTotalRotation, rotationSnapRadians);
              const modelNewZ = normalizeAngle(modelSnappedRotation);
              
              // Use start rotation for X and Y to keep them unchanged, only update Z
              return {
                ...model,
                rotation: [modelStartRotation[0], modelStartRotation[1], modelNewZ]
              };
            }
            return model;
          });
          setSelectedModels(updatedModels);
        } else {
          // Single model rotation
          const startRotationZ = dragStartRotation ? dragStartRotation[2] : rotation[2];
          const totalRotation = startRotationZ + rotationDelta;
          const snappedRotation = snapRotation(totalRotation, rotationSnapRadians);
          const normalizedRotation = normalizeAngle(snappedRotation);
          const newRotation = [rotation[0], rotation[1], normalizedRotation];
          updateModelRotation(id, newRotation);
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
          let targetY = position[1]; // ارتفاع فعلی را حفظ می‌کنیم
          
          if (constrainToGrid && activeControlMode !== 'height') {
            targetY = 0;
          } else if (position[1] < 0 && activeControlMode !== 'height') {
            targetY = 0;
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
          if (constrainToGrid && activeControlMode !== 'height') {
            adjustedPosition[1] = 0;
          } else {
            adjustedPosition[1] = position[1];
          }
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
          // Move all models - but they each need their own collision check
          // For simplicity, just move them relative to the current model's movement
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
          
          setSelectedModels(updatedModels);
        } else {
          if (constrainToGrid) {
            adjustedPosition = clampPositionToGrid(
              adjustedPosition,
              modelDimensions,
              rotation
            );
          }
          updateModelPosition(id, adjustedPosition);
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
      {/* Invisible exact-size rotated collider for robust selection */}
      <mesh
        ref={selectionColliderRef}
        visible={false}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <boxGeometry args={[0.001, 0.001, 0.001]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <primitive
        object={clonedSceneState}
        onContextMenu={handleRightClick}
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

      <ContextMenu
        position={position}
        isVisible={showContextMenu}
        onClose={() => setShowContextMenu(false)}
      />
    </group>
  );
};

export default Model;
