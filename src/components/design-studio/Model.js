import { useEffect, useRef, useState } from "react";
import useModelStore from "@/store/useModelStore";
import { useModelScene } from "@/hooks/useModelScene";
import { useModelAdjustment, adjustPositionToAvoidOverlap } from "@/hooks/useModelAdjustment";
import ModelControls from "./ModelControls";
import ContextMenu from "./ContextMenu";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { calculateSnapPoints, calculatePreviewPosition, ultimateCollisionDetection } from "@/helper/snapDetection";

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
  const isPreviewMode = useModelStore((s) => s.isPreviewMode);
  const setSnapPoints = useModelStore((s) => s.setSnapPoints);
  const setPreviewPosition = useModelStore((s) => s.setPreviewPosition);
  const setIsSnapping = useModelStore((s) => s.setIsSnapping);
  const setActiveFacePreview = useModelStore((s) => s.setActiveFacePreview);
  const setDraggedModelPreviewPosition = useModelStore((s) => s.setDraggedModelPreviewPosition);
  const collisionMode = useModelStore((s) => s.collisionMode);

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
    }
  }, [adjustedScene]);

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
            // Different colors for preview mode vs normal drag
            const dragColor = isPreviewMode ? 0x00aaff : 0x00ff00; // Blue for preview, green for normal
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


  // انتخاب فقط با کلیک راست انجام می‌شود (در handleRightClick)

  // Handle right-click: select model (with multi-select) and open context menu
  const handleRightClick = (event) => {
    event.stopPropagation();
    if (typeof event.preventDefault === 'function') {
      event.preventDefault();
    } else if (event.nativeEvent && typeof event.nativeEvent.preventDefault === 'function') {
      event.nativeEvent.preventDefault();
    }
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

  // Handle drag start
  const handlePointerDown = (event) => {
    event.stopPropagation();
    // جلوگیری از رفتار پیش‌فرض در صورت موجود بودن
    if (typeof event.preventDefault === 'function') {
      event.preventDefault();
    } else if (event.nativeEvent && typeof event.nativeEvent.preventDefault === 'function') {
      event.nativeEvent.preventDefault();
    }
    // فقط با کلیک چپ درگ شروع شود
    const btn = (event.button !== undefined) ? event.button : event.nativeEvent?.button;
    if (btn !== 0) return;

    // Snapshot before starting a drag move
    pushHistory();

    setIsDragging(true);
    setDragStartPosition([...position]);

    // Store initial mouse position for drag calculation
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / gl.domElement.clientWidth) * 2 - 1;
    mouse.y = -(event.clientY / gl.domElement.clientHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const tempPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -position[1]);
    const initialIntersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(tempPlane, initialIntersection);

    setDragStartMouse({
      x: initialIntersection.x,
      y: initialIntersection.z,
      clientX: event.clientX,
      clientY: event.clientY
    });
  };

  // Handle drag move - this is now handled by the global mouse move handler
  const handlePointerMove = (event) => {
    // The global mouse move handler takes care of all drag movement
    // This local handler is kept for potential future use but doesn't do anything
    // to avoid conflicts with the global handler
  };

  // Handle drag end
  const handlePointerUp = (event) => {
    if (isDragging) {
      event.stopPropagation();
      setIsDragging(false);
      setDragStartPosition(null);
      setDragStartMouse(null);
      
      // Clear preview state when drag ends
      if (isPreviewMode) {
        setSnapPoints([]);
        setPreviewPosition(null);
        setIsSnapping(false);
        setActiveFacePreview(null);
        setDraggedModelPreviewPosition(null);
      }
    }
  };

  // Global mouse up handler for drag end
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        setDragStartPosition(null);
        setDragStartMouse(null);
        
        // Clear preview state when drag ends
        if (isPreviewMode) {
          setSnapPoints([]);
          setPreviewPosition(null);
          setIsSnapping(false);
          setActiveFacePreview(null);
          setDraggedModelPreviewPosition(null);
        }
      }
    };

    if (isDragging) {
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, isPreviewMode, setSnapPoints, setPreviewPosition, setIsSnapping]);

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

        let proposedPosition = [snappedX, position[1], snappedZ];

        if (constrainToGrid) {
          const limit = 20; // match CustomGrid size/2 (size=40)
          proposedPosition[0] = Math.max(-limit, Math.min(limit, proposedPosition[0]));
          proposedPosition[2] = Math.max(-limit, Math.min(limit, proposedPosition[2]));
        }

        // Ultimate collision detection with all features
        const collisionResult = ultimateCollisionDetection(
          proposedPosition,
          { id, position: proposedPosition, rotation, path },
          existingModels.filter(m => m.id !== id),
          snapSize
        );
        
        // Use the collision-adjusted position
        proposedPosition = collisionResult.position;

        // Handle preview mode with snap points
        if (isPreviewMode) {
          // Calculate snap points for this model
          const snapPoints = calculateSnapPoints(
            { id, position: proposedPosition, rotation },
            existingModels.filter(m => m.id !== id),
            2
          );
          setSnapPoints(snapPoints);

          // Calculate preview position with snapping
          const previewResult = calculatePreviewPosition(proposedPosition, snapPoints, 2);
          setPreviewPosition(previewResult.position);
          setIsSnapping(previewResult.isSnapped);

          // Set active face preview for TinkerCAD-style highlighting
          if (previewResult.isSnapped && previewResult.snapPoint) {
            setActiveFacePreview(previewResult.snapPoint);
            setDraggedModelPreviewPosition(previewResult.position);
          } else {
            setActiveFacePreview(null);
            setDraggedModelPreviewPosition(null);
          }

          // Use snapped position if available
          if (previewResult.isSnapped) {
            proposedPosition = previewResult.position;
          }
        } else {
          // Clear preview state when not in preview mode
          setSnapPoints([]);
          setPreviewPosition(null);
          setIsSnapping(false);
          setActiveFacePreview(null);
          setDraggedModelPreviewPosition(null);
        }

        // Use the collision-adjusted position
        let adjustedPosition = proposedPosition;

        if (constrainToGrid) {
          const limit = 20;
          adjustedPosition = [
            Math.max(-limit, Math.min(limit, adjustedPosition[0])),
            adjustedPosition[1],
            Math.max(-limit, Math.min(limit, adjustedPosition[2]))
          ];
        }

        // Check if multiple models are selected and move them together
        if (selectedModelId === 'ALL') {
          // Move all models
          const deltaX = adjustedPosition[0] - position[0];
          const deltaZ = adjustedPosition[2] - position[2];
          
          const updatedModels = existingModels.map(model => {
            const nextX = model.position[0] + deltaX;
            const nextZ = model.position[2] + deltaZ;
            let clampedX = nextX;
            let clampedZ = nextZ;
            if (constrainToGrid) {
              const limit = 20;
              clampedX = Math.max(-limit, Math.min(limit, nextX));
              clampedZ = Math.max(-limit, Math.min(limit, nextZ));
            }
            return {
              ...model,
              position: [clampedX, model.position[1], clampedZ]
            };
          });
          
          useModelStore.setState({ selectedModels: updatedModels });
        } else if (Array.isArray(selectedModelId) && selectedModelId.includes(id)) {
          // Move multiple selected models
          const deltaX = adjustedPosition[0] - position[0];
          const deltaZ = adjustedPosition[2] - position[2];
          
          const updatedModels = existingModels.map(model => {
            if (selectedModelId.includes(model.id)) {
              const nextX = model.position[0] + deltaX;
              const nextZ = model.position[2] + deltaZ;
              let clampedX = nextX;
              let clampedZ = nextZ;
              if (constrainToGrid) {
                const limit = 20;
                clampedX = Math.max(-limit, Math.min(limit, nextX));
                clampedZ = Math.max(-limit, Math.min(limit, nextZ));
              }
              return { ...model, position: [clampedX, model.position[1], clampedZ] };
            }
            return model;
          });
          
          useModelStore.setState({ selectedModels: updatedModels });
        } else {
          // Single model selection - update this model's position
          updateModelPosition(id, adjustedPosition);
        }
      }
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, [isDragging, dragStartPosition, dragStartMouse, position, id, updateModelPosition, raycaster, camera, gl, modelOptions.snapSize, existingModels, selectedModelId, constrainToGrid, isPreviewMode, setSnapPoints, setPreviewPosition, setIsSnapping, rotation]);


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
    <group ref={modelRef} position={position}>
      <primitive
        object={clonedSceneState}
        rotation={rotation}
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
