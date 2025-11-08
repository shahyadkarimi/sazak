import { useEffect, useRef, useState } from "react";
import useModelStore from "@/store/useModelStore";
import { useModelScene } from "@/hooks/useModelScene";
import { useModelAdjustment } from "@/hooks/useModelAdjustment";
import ModelControls from "./ModelControls";
import ContextMenu from "./ContextMenu";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RigidBody } from "@react-three/rapier";
import { checkCollisionAndStack, checkFloatingAndGround } from "@/helper/snapDetection";
import { clampPositionToGrid } from "@/helper/gridConstraints";

const Model = ({ path, position, id, rotation, color }) => {
  const modelRef = useRef();
  const { raycaster, camera, gl } = useThree();

  const { scene: adjustedScene, isValid } = useModelScene(path || null);

  const selectedModelId = useModelStore((s) => s.selectedModelId);
  const setSelectedModelId = useModelStore((s) => s.setSelectedModelId);
  const updateModelPosition = useModelStore((s) => s.updateModelPosition);
  const updateModelRotation = useModelStore((s) => s.updateModelRotation);
  const setIsAdjustingHeight = useModelStore((s) => s.setIsAdjustingHeight);
  const existingModels = useModelStore((s) => s.selectedModels);
  const modelOptions = useModelStore((s) => s.modelOptions);
  const setModelsRef = useModelStore((s) => s.setModelsRef);
  const pushHistory = useModelStore((s) => s.pushHistory);
  const updateModelDimensions = useModelStore((s) => s.updateModelDimensions);
  const setDraggedModelId = useModelStore((s) => s.setDraggedModelId);

  const modelControls = useModelAdjustment(
    id,
    position,
    rotation,
    updateModelPosition,
    updateModelRotation,
    existingModels,
    {
      positionSnapStep: modelOptions.snapSize,
      heightSnapStep: modelOptions.snapSize,
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
  const [dragStartMouse, setDragStartMouse] = useState(null);
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [initialMousePos, setInitialMousePos] = useState(null);

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

  // تغییر رنگ و حالت ترنسپرنت (فقط بردر)
  useEffect(() => {
    if (!clonedSceneState) return;
    setModelsRef(modelRef);

    clonedSceneState.traverse((child) => {
      if (child.isMesh && child.material) {
        const edge = child.children?.find?.((c) => c.name === 'edge-lines');
        const isTransparent = color == null;

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
          if (child.material?.color && color) {
            child.material.color = new THREE.Color(color);
          }
          if (child.material) {
            child.material.transparent = false;
            child.material.opacity = 1;
            if ('colorWrite' in child.material) child.material.colorWrite = true;
            if ('depthWrite' in child.material) child.material.depthWrite = true;
          }
          if (edge) edge.visible = false;
        }
        
        if (!isTransparent && isDragging) {
          if (child.material.emissive) {
            const dragColor = 0x00ff00; // Green for drag
            child.material.emissive = new THREE.Color(dragColor);
            child.material.emissiveIntensity = 0.4; // نوردهی بیشتر
          }
        } else if (!isTransparent && isSelected) {
          if (child.material.emissive) {
            // هنگام انتخاب کمی درخشش با رنگ انتخابی (برای ترنسپرنت هم لبه‌ها کافی هستند)
            child.material.emissive = new THREE.Color(color || 0x000000);
            child.material.emissiveIntensity = 0.3; // نوردهی ملایم
          }
        } else if (!isTransparent && isHovered) {
          if (child.material.emissive) {
            child.material.emissive = new THREE.Color(color || 0x000000);
            child.material.emissiveIntensity = 0.2; // نوردهی ملایم
          }
        } else if (!isTransparent) {
          if (child.material.emissive) {
            child.material.emissive = new THREE.Color(color || 0x000000);
            child.material.emissiveIntensity = 0.5; // نوردهی ملایم
          }
        }
      }
    });
  }, [isSelected, isHovered, isDragging, clonedSceneState, color]);

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

    let nextSelection;
    if (isCtrl) {
      // Toggle this id
      if (currentSelection.includes(id)) {
        nextSelection = currentSelection.filter((sid) => sid !== id);
      } else {
        nextSelection = [...currentSelection, id];
      }
      // If empties out, keep single selection to this id for usability
      if (nextSelection.length === 0) nextSelection = [id];
    } else {
      // Regular single select
      nextSelection = id;
    }

    setSelectedModelId(nextSelection);

    // ذخیره موقعیت اولیه ماوس برای تشخیص درگ
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
      setIsDragging(false);
      setDraggedModelId(null);
      setDragStartPosition(null);
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
        setIsDragging(false);
        setDraggedModelId(null);
        setDragStartPosition(null);
        setDragStartMouse(null);
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

        // Use current Y for collision detection to avoid flickering
        let proposedPosition = [snappedX, position[1], snappedZ];

        if (constrainToGrid) {
          proposedPosition = clampPositionToGrid(
            proposedPosition,
            modelDimensions,
            rotation
          );
        }

        // Check collision and stack if needed
        const collisionResult = checkCollisionAndStack(
          proposedPosition,
          { id, position: proposedPosition, rotation, path, dimensions: modelDimensions },
          existingModels,
          snapSize
        );
        
        // Use collision result position - it already handles ground level correctly
        let adjustedPosition = collisionResult.position;

        if (!collisionResult.isStacked) {
          adjustedPosition[1] = 0;
        } else {
          adjustedPosition[1] = Math.max(0, adjustedPosition[1]);
        }

        if (constrainToGrid) {
          adjustedPosition = clampPositionToGrid(
            adjustedPosition,
            modelDimensions,
            rotation
          );
        }

        // Check if multiple models are selected and move them together
        if (selectedModelId === 'ALL') {
          // Move all models - but they each need their own collision check
          // For simplicity, just move them relative to the current model's movement
          const deltaX = adjustedPosition[0] - position[0];
          const deltaZ = adjustedPosition[2] - position[2];
          const deltaY = adjustedPosition[1] - position[1];
          
          const updatedModels = existingModels.map(model => {
            const nextX = model.position[0] + deltaX;
            const nextZ = model.position[2] + deltaZ;
            const nextY = model.position[1] + deltaY;
            let nextPosition = [nextX, nextY, nextZ];
            if (!collisionResult.isStacked) {
              nextPosition[1] = Math.max(0, model.position[1] + deltaY);
            }
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
          
          useModelStore.setState({ selectedModels: updatedModels });
        } else if (Array.isArray(selectedModelId) && selectedModelId.includes(id)) {
          // Move multiple selected models
          const deltaX = adjustedPosition[0] - position[0];
          const deltaZ = adjustedPosition[2] - position[2];
          const deltaY = adjustedPosition[1] - position[1];
          
          const updatedModels = existingModels.map(model => {
            if (selectedModelId.includes(model.id)) {
              const nextX = model.position[0] + deltaX;
              const nextZ = model.position[2] + deltaZ;
              const nextY = model.position[1] + deltaY;
              let nextPosition = [nextX, nextY, nextZ];
              if (!collisionResult.isStacked) {
                nextPosition[1] = Math.max(0, model.position[1] + deltaY);
              }
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
          
          useModelStore.setState({ selectedModels: updatedModels });
        } else {
          // Single model selection - update this model's position
          if (constrainToGrid) {
            adjustedPosition = clampPositionToGrid(
              adjustedPosition,
              modelDimensions,
              rotation
            );
          }
          if (!collisionResult.isStacked) {
            adjustedPosition[1] = 0;
          } else {
            adjustedPosition[1] = Math.max(0, adjustedPosition[1]);
          }
          updateModelPosition(id, adjustedPosition);
        }
      }
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, [isDragging, dragStartPosition, dragStartMouse, position, id, updateModelPosition, raycaster, camera, gl, modelOptions.snapSize, existingModels, selectedModelId, constrainToGrid, rotation]);


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

  // Half-size for cuboid collider (Rapier expects half-extents)
  const halfSize = modelDimensions 
    ? [modelDimensions.x / 2, modelDimensions.y / 2, modelDimensions.z / 2]
    : [0.5, 0.5, 0.5];

  return (
    <RigidBody 
      ref={modelRef}
      type="kinematic"
      position={position}
      rotation={rotation}
      colliders="cuboid"
      args={halfSize}
      lockRotations={true}
      lockTranslations={true}
      // Prevent physics-based movement - we handle collisions in code
      collisionGroups={0}
      solverGroups={0}
    >
      <primitive
        object={clonedSceneState}
        // حذف انتخاب با کلیک چپ؛ انتخاب با راست‌کلیک انجام می‌شود
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
    </RigidBody>
  );
};

export default Model;
